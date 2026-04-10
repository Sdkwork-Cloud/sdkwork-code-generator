import { BaseRequestCodeGenerator } from '@/openapi/generator/generator';
import {
  CodeGenerateContext,
  ExampleOpenAPIParameter,
  HttpMethod,
  Language,
  OpenAPIOperation,
} from '@/types';

export class RequestsPythonRequestCodeGenerator extends BaseRequestCodeGenerator {
  getLanguage(): Language {
    return 'python';
  }

  getLibrary(): string {
    return 'requests';
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
      return this.generateMultipartPythonRequestCode(
        baseUrl,
        path,
        method,
        cookies,
        headers,
        queryParams,
        requestBody,
        operation,
        context
      );
    }

    const requestParams = this.buildRequestParams(
      method,
      cookies,
      headers,
      queryParams,
      requestBody,
      context
    );
    const requestBodySetup = this.buildBinaryRequestBodySetup(
      method,
      requestBody,
      context
    );
    const querySetup = this.buildAllowReservedQuerySetup(queryParams);

    return this.generatePythonRequestCode(
      baseUrl,
      path,
      requestParams,
      operation,
      method,
      context,
      `${querySetup}${requestBodySetup}`
    );
  }

  private buildRequestParams(
    method: HttpMethod,
    cookies: ExampleOpenAPIParameter[],
    headers: ExampleOpenAPIParameter[],
    queryParams: ExampleOpenAPIParameter[],
    requestBody: any,
    context: CodeGenerateContext
  ): string {
    const params: string[] = [];
    const requestHeaders = [...headers];
    const cookieHeader = this.buildCookieHeaderParameter(cookies);
    const hasRequestBody = this.hasRequestBody(method, requestBody);

    if (cookieHeader) {
      requestHeaders.push(cookieHeader);
    }

    if (
      hasRequestBody &&
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

    if (requestHeaders.length > 0) {
      params.push(`headers=${this.buildHeadersDict(requestHeaders)}`);
    }

    if (
      queryParams.length > 0 &&
      !this.hasAllowReservedQueryParameters(queryParams)
    ) {
      params.push(`params=${this.buildParamsList(queryParams)}`);
    }

    if (hasRequestBody) {
      if (this.isBinaryRequestBody(context)) {
        params.push('data=requestBody');
      } else if (this.usesStringRequestBody(context)) {
        params.push(
          `data='${this.escapeSingleQuoted(
            this.serializeStringRequestBody(requestBody, context)
          )}'`
        );
      } else {
        params.push(`json=${this.toPythonLiteral(requestBody, 4)}`);
      }
    }

    return params.join(', ');
  }

  private buildHeadersDict(headers: ExampleOpenAPIParameter[]): string {
    const headerEntries = headers.map(
      (header) =>
        `'${this.escapeSingleQuoted(header.name)}': '${this.escapeSingleQuoted(
          this.serializeHeaderParameterValue(header)
        )}'`
    );

    return `{${headerEntries.join(', ')}}`;
  }

  private buildParamsList(queryParams: ExampleOpenAPIParameter[]): string {
    const paramEntries = this.buildQueryParameterEntries(queryParams).map(
      (param) =>
        `('${this.escapeSingleQuoted(param.name)}', '${this.escapeSingleQuoted(
          param.value
        )}')`
    );

    return `[${paramEntries.join(', ')}]`;
  }

  private buildAllowReservedQuerySetup(
    queryParams: ExampleOpenAPIParameter[]
  ): string {
    if (!this.hasAllowReservedQueryParameters(queryParams)) {
      return '';
    }

    return `    url += ('?' if '?' not in url else '&') + '${this.escapeSingleQuoted(
      this.buildSerializedQueryString(queryParams)
    )}'\n`;
  }

  private generatePythonRequestCode(
    baseUrl: string,
    path: string,
    requestParams: string,
    operation: OpenAPIOperation,
    method: HttpMethod,
    context: CodeGenerateContext,
    requestBodySetup = ''
  ): string {
    const url = this.escapeDoubleQuotedString(
      this.buildRequestUrl(baseUrl, path)
    );
    const operationId = this.toIdentifier(
      operation.operationId,
      'api_request',
      'snake'
    );
    const methodLower = method.toLowerCase();

    return `import requests
import json

def ${operationId}():
    """
    ${operation.summary || operation.description || 'API request'}
    ${operation.description ? `    ${operation.description}` : ''}
    """
    url = "${url}"
${requestBodySetup}

    try:
        response = requests.${methodLower}(url${
      requestParams ? ', ' + requestParams : ''
    })
${this.buildSuccessStatusCheckCode(context)}

        print("Status Code: " + str(response.status_code))
${this.buildResponseHandlingCode(context)}
    except requests.exceptions.RequestException as e:
        print("Error: " + str(e))
        raise e

if __name__ == "__main__":
    result = ${operationId}()
    print(result)`;
  }

  private buildBinaryRequestBodySetup(
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

    return `    with open('${this.escapeSingleQuoted(
      this.getBinaryRequestBodyFileName(requestBody)
    )}', 'rb') as requestBodyFile:
        requestBody = requestBodyFile.read()
`;
  }

  private generateMultipartPythonRequestCode(
    baseUrl: string,
    path: string,
    method: HttpMethod,
    cookies: ExampleOpenAPIParameter[],
    headers: ExampleOpenAPIParameter[],
    queryParams: ExampleOpenAPIParameter[],
    requestBody: any,
    operation: OpenAPIOperation,
    context: CodeGenerateContext
  ): string {
    const url = this.escapeDoubleQuotedString(
      this.buildRequestUrl(baseUrl, path)
    );
    const operationId = this.toIdentifier(
      operation.operationId,
      'api_request',
      'snake'
    );
    const methodLower = method.toLowerCase();
    const fieldParts = this.getMultipartFieldParts(requestBody);
    const fileParts = this.getMultipartFileParts(requestBody);
    const requestHeaders = [...headers];
    const cookieHeader = this.buildCookieHeaderParameter(cookies);
    if (cookieHeader) {
      requestHeaders.push(cookieHeader);
    }
    const headerCode = this.buildHeadersDict(requestHeaders);
    const querySetup = this.buildAllowReservedQuerySetup(queryParams);
    const paramsCode =
      queryParams.length > 0 &&
      !this.hasAllowReservedQueryParameters(queryParams)
        ? `    params = ${this.buildParamsList(queryParams)}\n`
        : '';
    const requestArgs = [
      'headers=headers',
      'data=data',
      'files=files',
      queryParams.length > 0 &&
      !this.hasAllowReservedQueryParameters(queryParams)
        ? 'params=params'
        : '',
    ]
      .filter(Boolean)
      .join(', ');

    return `import requests

def ${operationId}():
    """
    ${operation.summary || operation.description || 'API request'}
    ${operation.description ? `    ${operation.description}` : ''}
    """
    url = "${url}"
    headers = ${headerCode}
${querySetup}${paramsCode}    data = {${fieldParts
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

    try:
        response = requests.${methodLower}(url, ${requestArgs})
${this.buildSuccessStatusCheckCode(context)}

        print("Status Code: " + str(response.status_code))
        print("Response: " + response.text)

${this.buildResponseHandlingCode(context)}
    except requests.exceptions.RequestException as e:
        print("Error: " + str(e))
        raise e

if __name__ == "__main__":
    result = ${operationId}()
    print(result)`;
  }

  private hasRequestBody(method: HttpMethod, requestBody: any): boolean {
    return this.hasRequestBodyValue(method, requestBody);
  }

  private escapeSingleQuoted(value: string): string {
    return value
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/\r?\n/g, '\\n');
  }

  private buildResponseHandlingCode(context: CodeGenerateContext): string {
    if (this.isBinaryResponse(context)) {
      return `        data = response.content
        print("Response bytes: " + str(len(data)))
        return data`;
    }

    if (this.usesStringResponse(context)) {
      return `        data = response.text
        print("Response: " + data)
        return data`;
    }

    return `        data = response.json()
        print("Response: " + str(data))
        return data`;
  }

  private buildSuccessStatusCheckCode(context: CodeGenerateContext): string {
    if (this.usesAny2xxSuccessStatus(context)) {
      return `        if response.status_code < 200 or response.status_code >= 300:
            raise requests.exceptions.HTTPError(f"HTTP error! status: {response.status_code}")`;
    }

    return `        if response.status_code != ${this.getExpectedSuccessStatusCode(
      context
    )}:
            raise requests.exceptions.HTTPError(f"HTTP error! status: {response.status_code}")`;
  }
}
