import { BaseRequestCodeGenerator } from '@/openapi/generator/generator';
import {
  CodeGenerateContext,
  ExampleOpenAPIParameter,
  HttpMethod,
  Language,
  OpenAPIOperation,
} from '@/types';

export class HttpxPythonRequestCodeGenerator extends BaseRequestCodeGenerator {
  getLanguage(): Language {
    return 'python';
  }

  getLibrary(): string {
    return 'httpx';
  }

  generateCode(
    path: string,
    method: HttpMethod,
    baseUrl: string,
    operation: OpenAPIOperation,
    cookies: ExampleOpenAPIParameter[],
    headers: ExampleOpenAPIParameter[],
    queryParams: ExampleOpenAPIParameter[],
    requestBody: any,
    context: CodeGenerateContext
  ): string {
    if (this.isMultipartRequestBody(context)) {
      return this.generateMultipartRequestCode(
        path,
        baseUrl,
        method,
        operation,
        cookies,
        headers,
        queryParams,
        requestBody,
        context
      );
    }

    const operationId = this.toIdentifier(
      operation.operationId,
      'api_request',
      'snake'
    );
    const url = this.escapeDoubleQuotedString(
      this.buildRequestUrl(baseUrl, path)
    );
    const successStatusCheckCode = this.buildSuccessStatusCheckCode(context);
    const requestHeaders = this.buildHeaders(
      headers,
      cookies,
      method,
      requestBody,
      context
    );
    const binaryBodySetup = this.buildBinaryBodySetup(
      method,
      requestBody,
      context
    );
    const queryEncodingImport =
      queryParams.length > 0 &&
      !this.hasAllowReservedQueryParameters(queryParams)
        ? 'from urllib.parse import quote\n'
        : '';

    return `import httpx
import json
${queryEncodingImport}

"""
${operation.summary || operation.description || 'API request'}
${operation.description || ''}
"""

async def ${operationId}():
    url = "${url}"
    ${this.buildQueryParamsCode(queryParams)}

    headers = {
        ${this.buildHeadersCode(requestHeaders)}
    }

    ${binaryBodySetup}
    ${this.buildRequestBodyCode(method, requestBody, context)}

    async with httpx.AsyncClient() as client:
        response = await client.${method.toLowerCase()}(
            url,
            headers=headers,
            ${this.buildRequestDataCode(method, requestBody, context)}
        )

${successStatusCheckCode}

${this.buildResponseHandlingCode(context)}

if __name__ == "__main__":
    import asyncio
    asyncio.run(${operationId}())`;
  }

  private generateMultipartRequestCode(
    path: string,
    baseUrl: string,
    method: HttpMethod,
    operation: OpenAPIOperation,
    cookies: ExampleOpenAPIParameter[],
    headers: ExampleOpenAPIParameter[],
    queryParams: ExampleOpenAPIParameter[],
    requestBody: any,
    context: CodeGenerateContext
  ): string {
    const operationId = this.toIdentifier(
      operation.operationId,
      'api_request',
      'snake'
    );
    const url = this.escapeDoubleQuotedString(
      this.buildRequestUrl(baseUrl, path)
    );
    const successStatusCheckCode = this.buildSuccessStatusCheckCode(context);
    const fieldParts = this.getMultipartFieldParts(requestBody);
    const fileParts = this.getMultipartFileParts(requestBody);
    const requestHeaders = this.buildRequestHeaders(headers, cookies);
    const queryEncodingImport =
      queryParams.length > 0 &&
      !this.hasAllowReservedQueryParameters(queryParams)
        ? 'from urllib.parse import quote\n'
        : '';
    return `import httpx
${queryEncodingImport}

"""
${operation.summary || operation.description || 'API request'}
${operation.description || ''}
"""

async def ${operationId}():
    url = "${url}"
    ${this.buildQueryParamsCode(queryParams)}

    headers = {
        ${this.buildHeadersCode(requestHeaders)}
    }

    data = {${fieldParts
      .map(
        (part) =>
          `'${this.escapeSingleQuoted(part.name)}': '${this.escapeSingleQuoted(
            String(part.value)
          )}'`
      )
      .join(', ')}}
    files = {${fileParts
      .map(
        (part) =>
          `'${this.escapeSingleQuoted(part.name)}': ('${this.escapeSingleQuoted(
            part.filename || part.name
          )}', open('${this.escapeSingleQuoted(
            part.filename || part.name
          )}', 'rb'), '${this.escapeSingleQuoted(
            part.contentType || 'application/octet-stream'
          )}')`
      )
      .join(', ')}}

    async with httpx.AsyncClient() as client:
        response = await client.${method.toLowerCase()}(
            url,
            headers=headers,
            data=data,
            files=files
        )

${successStatusCheckCode}

${this.buildResponseHandlingCode(context)}

if __name__ == "__main__":
    import asyncio
    asyncio.run(${operationId}())`;
  }

  private buildHeaders(
    headers: ExampleOpenAPIParameter[],
    cookies: ExampleOpenAPIParameter[],
    method: HttpMethod,
    requestBody: any,
    context: CodeGenerateContext
  ): ExampleOpenAPIParameter[] {
    const requestHeaders = this.buildRequestHeaders(headers, cookies);

    if (
      this.hasRequestBody(method, requestBody) &&
      this.shouldAutoAddContentTypeHeader(context) &&
      !requestHeaders.some(
        (header) => header.name.toLowerCase() === 'content-type'
      )
    ) {
      requestHeaders.push({
        name: 'Content-Type',
        in: 'header',
        required: false,
        schema: { type: 'string' },
        value: context.requestContentType,
      });
    }

    return requestHeaders;
  }

  private buildQueryParamsCode(queryParams: ExampleOpenAPIParameter[]): string {
    if (this.hasAllowReservedQueryParameters(queryParams)) {
      return `url += ('?' if '?' not in url else '&') + '${this.escapeSingleQuoted(
        this.buildSerializedQueryString(queryParams)
      )}'`;
    }

    const paramEntries = this.buildQueryParameterEntries(queryParams);

    if (paramEntries.length === 0) {
      return '';
    }

    return paramEntries
      .map(
        (param) =>
          `url += ('?' if '?' not in url else '&') + '${this.escapeSingleQuoted(
            param.name
          )}=' + quote('${this.escapeSingleQuoted(param.value)}', safe='')`
      )
      .join('\n    ');
  }

  private buildHeadersCode(headers: ExampleOpenAPIParameter[]): string {
    if (headers.length === 0) {
      return '';
    }

    return headers
      .map(
        (header) =>
          `'${this.escapeSingleQuoted(
            header.name
          )}': '${this.escapeSingleQuoted(
            this.serializeHeaderParameterValue(header)
          )}'`
      )
      .join(',\n        ');
  }

  private buildRequestBodyCode(
    method: HttpMethod,
    requestBody: any,
    context: CodeGenerateContext
  ): string {
    if (!this.hasRequestBody(method, requestBody)) {
      return '';
    }

    if (this.isBinaryRequestBody(context)) {
      return '';
    }

    if (this.usesStringRequestBody(context)) {
      return `data = '${this.escapeSingleQuoted(
        this.serializeStringRequestBody(requestBody, context)
      )}'`;
    }

    return `data = ${this.toPythonLiteral(requestBody, 4)}`;
  }

  private buildRequestDataCode(
    method: HttpMethod,
    requestBody: any,
    context: CodeGenerateContext
  ): string {
    if (!this.hasRequestBody(method, requestBody)) {
      return '';
    }

    if (this.isBinaryRequestBody(context)) {
      return 'content=data';
    }

    if (this.usesStringRequestBody(context)) {
      return 'content=data';
    }

    return 'json=data';
  }

  private buildRequestHeaders(
    headers: ExampleOpenAPIParameter[],
    cookies: ExampleOpenAPIParameter[]
  ): ExampleOpenAPIParameter[] {
    const requestHeaders = [...headers];
    const cookieHeader = this.buildCookieHeaderParameter(cookies);

    if (cookieHeader) {
      requestHeaders.push(cookieHeader);
    }

    return requestHeaders;
  }

  private hasRequestBody(method: HttpMethod, requestBody: any): boolean {
    return (
      ['POST', 'PUT', 'PATCH'].includes(method) &&
      requestBody !== undefined &&
      requestBody !== null
    );
  }

  private escapeSingleQuoted(value: string): string {
    return value
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/\r?\n/g, '\\n');
  }

  private buildBinaryBodySetup(
    method: HttpMethod,
    requestBody: any,
    context: CodeGenerateContext
  ): string {
    if (
      !this.hasRequestBody(method, requestBody) ||
      !this.isBinaryRequestBody(context)
    ) {
      return '';
    }

    return `with open('${this.escapeSingleQuoted(
      this.getBinaryRequestBodyFileName(requestBody)
    )}', 'rb') as requestBody:
        data = requestBody.read()`;
  }

  private buildResponseHandlingCode(context: CodeGenerateContext): string {
    if (this.isBinaryResponse(context)) {
      return `        data = response.content
        print('Response bytes:', len(data))
        return data`;
    }

    if (this.usesStringResponse(context)) {
      return `        data = response.text
        print('Response:', data)
        return data`;
    }

    return `        data = response.json()
        print('Response:', data)
        return data`;
  }

  private buildSuccessStatusCheckCode(context: CodeGenerateContext): string {
    if (this.usesAny2xxSuccessStatus(context)) {
      return `        if response.status_code < 200 or response.status_code >= 300:
            raise Exception(f"HTTP error! status: {response.status_code}")`;
    }

    return `        if response.status_code != ${this.getExpectedSuccessStatusCode(
      context
    )}:
            raise Exception(f"HTTP error! status: {response.status_code}")`;
  }
}
