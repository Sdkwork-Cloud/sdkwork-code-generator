import { BaseRequestCodeGenerator } from '@/openapi/generator/generator';
import {
  CodeGenerateContext,
  ExampleOpenAPIParameter,
  HttpMethod,
  Language,
  OpenAPIOperation,
} from '@/types';

export class SuperagentJavaScriptRequestCodeGenerator extends BaseRequestCodeGenerator {
  getLanguage(): Language {
    return 'javascript';
  }

  getLibrary(): string {
    return 'superagent';
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
      ? 'response.status < 200 || response.status >= 300'
      : `response.status !== ${expectedSuccessStatusCode}`;
    const handlesBinaryResponse = this.isBinaryResponse(context);
    const binarySetup = this.isBinaryRequestBody(context)
      ? `        const requestBody = await readFile('${this.escapeSingleQuoted(
          this.getBinaryRequestBodyFileName(requestBody)
        )}');\n\n`
      : '';
    const binaryImport = this.isBinaryRequestBody(context)
      ? `const { readFile } = require('fs/promises');\n`
      : '';
    const responseParserSetup = handlesBinaryResponse
      ? `const binaryParser = (res, callback) => {
    const data = [];
    res.on('data', (chunk) => data.push(chunk));
    res.on('end', () => callback(null, Buffer.concat(data)));
    res.on('error', callback);
};

`
      : '';
    const requestBinaryHandling = handlesBinaryResponse
      ? '        request = request.buffer(true).parse(binaryParser);\n\n'
      : '';
    const responseDataExpression = this.usesStringResponse(context)
      ? 'response.text'
      : 'response.body';
    const responseLoggingCode = handlesBinaryResponse
      ? '        console.log("Response bytes:", data.length);'
      : "        console.log('Response:', data);";

    return `${binaryImport}${responseParserSetup}const superagent = require('superagent');

/**
 * ${operation.summary || operation.description || 'API request'}
 * ${operation.description ? ` * ${operation.description}` : ''}
 */
async function ${operationId}() {
    let url = "${url}";
    ${this.buildQueryParamsCode(queryParams)}

    try {
${binarySetup}        let request = superagent('${method.toUpperCase()}', url);
${requestBinaryHandling}

        ${this.buildCookiesCode(cookies, 'request')}
        ${this.buildHeadersCode(
          headers,
          'request',
          method,
          requestBody,
          context
        )}
        ${this.buildRequestBodyCode(method, requestBody, 'request', context)}

        const response = await request;

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

  private buildCookiesCode(
    cookies: ExampleOpenAPIParameter[],
    requestVar: string
  ): string {
    if (cookies.length === 0) {
      return '';
    }

    return `${requestVar}.set('Cookie', '${this.escapeSingleQuoted(
      this.buildCookieHeaderValue(cookies)
    )}');`;
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

  private buildHeadersCode(
    headers: ExampleOpenAPIParameter[],
    requestVar: string,
    method: HttpMethod,
    requestBody: any,
    context: CodeGenerateContext
  ): string {
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

    if (requestHeaders.length === 0) {
      return '';
    }

    return requestHeaders
      .map(
        (header) =>
          `${requestVar}.set('${this.escapeSingleQuoted(
            header.name
          )}', '${this.escapeSingleQuoted(
            this.serializeHeaderParameterValue(header)
          )}');`
      )
      .join('\n        ');
  }

  private buildRequestBodyCode(
    method: HttpMethod,
    requestBody: any,
    requestVar: string,
    context: CodeGenerateContext
  ): string {
    if (!this.hasRequestBody(method, requestBody)) {
      return '';
    }

    if (this.isMultipartRequestBody(context)) {
      return this.getMultipartParts(requestBody)
        .map((part) =>
          part.kind === 'file'
            ? `${requestVar}.attach('${this.escapeSingleQuoted(
                part.name
              )}', '${this.escapeSingleQuoted(part.filename || part.name)}');`
            : `${requestVar}.field('${this.escapeSingleQuoted(
                part.name
              )}', '${this.escapeSingleQuoted(part.value)}');`
        )
        .join('\n        ');
    }

    if (this.isBinaryRequestBody(context)) {
      return `${requestVar}.send(requestBody);`;
    }

    if (this.usesStringRequestBody(context)) {
      return `${requestVar}.send('${this.escapeSingleQuoted(
        this.serializeStringRequestBody(requestBody, context)
      )}');`;
    }

    return `${requestVar}.send(${JSON.stringify(requestBody, null, 8)});`;
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
