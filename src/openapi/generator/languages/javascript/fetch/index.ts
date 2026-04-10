import { BaseRequestCodeGenerator } from '@/openapi/generator/generator';
import {
  CodeGenerateContext,
  ExampleOpenAPIParameter,
  HttpMethod,
  Language,
  OpenAPIOperation,
} from '@/types';

export class FetchJavaScriptRequestCodeGenerator extends BaseRequestCodeGenerator {
  getLanguage(): Language {
    return 'javascript';
  }

  getLibrary(): string {
    return 'fetch';
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
    const operationId = this.toIdentifier(
      operation.operationId,
      'apiRequest',
      'camel'
    );
    const url = this.escapeDoubleQuotedString(
      this.buildRequestUrl(baseUrl, path)
    );
    const binarySetup = this.isBinaryRequestBody(context)
      ? `    const requestBody = await readFile('${this.escapeSingleQuoted(
          this.getBinaryRequestBodyFileName(requestBody)
        )}');\n\n`
      : '';
    const multipartSetup =
      this.isMultipartRequestBody(context) && requestBody
        ? `    ${this.buildMultipartFormDataSetup(requestBody)}\n\n`
        : '';
    const config = this.buildFetchConfig(
      method,
      cookies,
      headers,
      requestBody,
      context
    );
    const expectedSuccessStatusCode =
      this.getExpectedSuccessStatusCode(context);
    const successStatusCheck = this.usesAny2xxSuccessStatus(context)
      ? 'response.status < 200 || response.status >= 300'
      : `response.status !== ${expectedSuccessStatusCode}`;
    const responseDataExpression = this.isBinaryResponse(context)
      ? 'await response.arrayBuffer()'
      : this.usesStringResponse(context)
      ? 'await response.text()'
      : 'await response.json()';
    const responseLoggingCode = this.isBinaryResponse(context)
      ? "console.log('Response bytes:', data.byteLength);"
      : "console.log('Response:', data);";

    const binaryImport = this.isBinaryRequestBody(context)
      ? `const { readFile } = require('fs/promises');\n\n`
      : '';

    return `${binaryImport}/**
 * ${operation.summary || operation.description || 'API request'}
 * ${operation.description ? ` * ${operation.description}` : ''}
 */
async function ${operationId}() {
    let url = "${url}";
    ${this.buildQueryParamsCode(queryParams)}
${binarySetup}${multipartSetup}

    try {
        const response = await fetch(url, ${config});

        if (${successStatusCheck}) {
            throw new Error(\`HTTP error! status: \${response.status}\`);
        }

        const data = ${responseDataExpression};
        ${responseLoggingCode}
        return data;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

// Example usage
${operationId}();`;
  }

  private buildFetchConfig(
    method: HttpMethod,
    cookies: ExampleOpenAPIParameter[],
    headers: ExampleOpenAPIParameter[],
    requestBody: any,
    context: CodeGenerateContext
  ): string {
    const configParts: string[] = [`method: '${method}'`];
    const requestHeaders = this.buildRequestHeaders(
      cookies,
      headers,
      method,
      requestBody,
      context
    );

    if (cookies.length > 0) {
      configParts.push(`credentials: 'include'`);
    }

    if (requestHeaders.length > 0) {
      configParts.push(`headers: ${this.buildHeadersObject(requestHeaders)}`);
    }

    if (this.hasRequestBody(method, requestBody)) {
      if (this.isMultipartRequestBody(context)) {
        configParts.push('body: formData');
      } else if (this.isBinaryRequestBody(context)) {
        configParts.push('body: requestBody');
      } else if (this.usesStringRequestBody(context)) {
        configParts.push(
          `body: '${this.escapeSingleQuoted(
            this.serializeStringRequestBody(requestBody, context)
          )}'`
        );
      } else {
        configParts.push(
          `body: JSON.stringify(${JSON.stringify(requestBody, null, 2)})`
        );
      }
    }

    return `{\n        ${configParts.join(',\n        ')}\n    }`;
  }

  private buildRequestHeaders(
    cookies: ExampleOpenAPIParameter[],
    headers: ExampleOpenAPIParameter[],
    method: HttpMethod,
    requestBody: any,
    context: CodeGenerateContext
  ): ExampleOpenAPIParameter[] {
    const requestHeaders = [...headers];

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

  private buildHeadersObject(headers: ExampleOpenAPIParameter[]): string {
    const headerEntries = headers.map(
      (header) =>
        `'${this.escapeSingleQuoted(header.name)}': '${this.escapeSingleQuoted(
          this.serializeHeaderParameterValue(header)
        )}'`
    );

    return `{\n            ${headerEntries.join(',\n            ')}\n        }`;
  }

  private buildQueryParamsCode(queryParams: ExampleOpenAPIParameter[]): string {
    if (this.hasAllowReservedQueryParameters(queryParams)) {
      return `const queryString = '${this.escapeSingleQuoted(
        this.buildSerializedQueryString(queryParams)
      )}';\n    if (queryString) {\n        url += (url.includes('?') ? '&' : '?') + queryString;\n    }`;
    }

    const paramEntries = this.buildQueryParameterEntries(queryParams);

    if (paramEntries.length === 0) {
      return '';
    }

    const paramLines = paramEntries.map(
      (param) =>
        `queryParams.append('${this.escapeSingleQuoted(
          param.name
        )}', '${this.escapeSingleQuoted(param.value)}');`
    );

    return `const queryParams = new URLSearchParams();\n    ${paramLines.join(
      '\n    '
    )}\n    const queryString = queryParams.toString();\n    if (queryString) {\n        url += (url.includes('?') ? '&' : '?') + queryString;\n    }`;
  }

  private buildMultipartFormDataSetup(requestBody: any): string {
    const multipartLines = this.getMultipartParts(requestBody).map((part) =>
      part.kind === 'file'
        ? `formData.append('${this.escapeSingleQuoted(
            part.name
          )}', new Blob(['${this.escapeSingleQuoted(
            part.value
          )}']), '${this.escapeSingleQuoted(part.filename || part.name)}');`
        : `formData.append('${this.escapeSingleQuoted(
            part.name
          )}', '${this.escapeSingleQuoted(part.value)}');`
    );

    return `const formData = new FormData();\n    ${multipartLines.join(
      '\n    '
    )}`;
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
}
