import { BaseRequestCodeGenerator } from '@/openapi/generator/generator';
import {
  CodeGenerateContext,
  ExampleOpenAPIParameter,
  HttpMethod,
  Language,
  OpenAPIOperation,
} from '@/types';

export class GotJavaScriptRequestCodeGenerator extends BaseRequestCodeGenerator {
  getLanguage(): Language {
    return 'javascript';
  }

  getLibrary(): string {
    return 'got';
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
    const expectedSuccessStatusCode =
      this.getExpectedSuccessStatusCode(context);
    const successStatusCheck = this.usesAny2xxSuccessStatus(context)
      ? 'response.statusCode < 200 || response.statusCode >= 300'
      : `response.statusCode !== ${expectedSuccessStatusCode}`;
    const binarySetup = this.isBinaryRequestBody(context)
      ? `    const requestBody = await readFile('${this.escapeSingleQuoted(
          this.getBinaryRequestBodyFileName(requestBody)
        )}');\n\n`
      : '';
    const multipartSetup =
      this.isMultipartRequestBody(context) && requestBody
        ? `    ${this.buildMultipartFormDataSetup(requestBody)}\n\n`
        : '';
    const binaryImport = this.isBinaryRequestBody(context)
      ? `const { readFile } = require('fs/promises');\n`
      : '';
    const responseDataExpression = this.isBinaryResponse(context)
      ? 'response.body'
      : this.usesStringResponse(context)
      ? 'response.body'
      : 'JSON.parse(response.body)';
    const responseLoggingCode = this.isBinaryResponse(context)
      ? "console.log('Response bytes:', data.length);"
      : "console.log('Response:', data);";
    const responseTypeOption = this.isBinaryResponse(context)
      ? `\n        responseType: 'buffer',`
      : '';

    return `${binaryImport}/**
 * ${operation.summary || operation.description || 'API request'}
 * ${operation.description ? ` * ${operation.description}` : ''}
 */
async function ${operationId}() {
    const { default: got } = await import('got');
    let url = "${url}";
    ${this.buildQueryParamsCode(queryParams)}
${binarySetup}${multipartSetup}

    const options = {
        method: '${method.toUpperCase()}',
        ${responseTypeOption}
        ${this.buildHeadersCode(cookies, headers, method, requestBody, context)}
        ${this.buildRequestBodyCode(method, requestBody, context)}
    };

    try {
        const response = await got(url, options);

        if (${successStatusCheck}) {
            throw new Error(\`HTTP error! status: \${response.statusCode}\`);
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

  private buildHeadersCode(
    cookies: ExampleOpenAPIParameter[],
    headers: ExampleOpenAPIParameter[],
    method: HttpMethod,
    requestBody: any,
    context: CodeGenerateContext
  ): string {
    const requestHeaders = [...headers];

    if (cookies.length > 0) {
      requestHeaders.push({
        name: 'Cookie',
        in: 'header',
        required: false,
        schema: { type: 'string' },
        value: this.buildCookieHeaderValue(cookies),
      });
    }

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

    if (requestHeaders.length === 0) {
      return '';
    }

    const headerEntries = requestHeaders.map(
      (header) =>
        `'${this.escapeSingleQuoted(header.name)}': '${this.escapeSingleQuoted(
          this.serializeHeaderParameterValue(header)
        )}'`
    );

    return `headers: {\n            ${headerEntries.join(
      ',\n            '
    )}\n        },`;
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

  private buildRequestBodyCode(
    method: HttpMethod,
    requestBody: any,
    context: CodeGenerateContext
  ): string {
    if (!this.hasRequestBody(method, requestBody)) {
      return '';
    }

    if (this.isMultipartRequestBody(context)) {
      return 'body: formData,';
    }

    if (this.isBinaryRequestBody(context)) {
      return 'body: requestBody,';
    }

    if (this.usesStringRequestBody(context)) {
      return `body: '${this.escapeSingleQuoted(
        this.serializeStringRequestBody(requestBody, context)
      )}',`;
    }

    return `json: ${JSON.stringify(requestBody, null, 8)},`;
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
