import { BaseRequestCodeGenerator } from '@/openapi/generator/generator';
import {
  CodeGenerateContext,
  ExampleOpenAPIParameter,
  HttpMethod,
  Language,
  OpenAPIOperation,
} from '@/types';

export class AxiosJavaScriptRequestCodeGenerator extends BaseRequestCodeGenerator {
  getLanguage(): Language {
    return 'javascript';
  }

  getLibrary(): string {
    return 'axios';
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
    const binarySetup = this.isBinaryRequestBody(context)
      ? `  const requestBody = await readFile('${this.escapeSingleQuoted(
          this.getBinaryRequestBodyFileName(requestBody)
        )}');\n\n`
      : '';
    const queryParamsSetup =
      queryParams.length > 0
        ? `  ${this.buildQueryParamsSetup(queryParams)}\n\n`
        : '';
    const hasRequestBody = this.hasRequestBodyValue(method, requestBody);
    const multipartSetup =
      this.isMultipartRequestBody(context) && hasRequestBody
        ? `  ${this.buildMultipartFormDataSetup(requestBody)}\n\n`
        : '';
    const config = this.buildRequestConfig(
      method,
      cookies,
      headers,
      queryParams,
      requestBody,
      context
    );
    const expectedSuccessStatusCode =
      this.getExpectedSuccessStatusCode(context);
    const usesAny2xxSuccessStatus = this.usesAny2xxSuccessStatus(context);

    return this.generateAxiosRequestCode(
      baseUrl,
      path,
      config,
      operation,
      `${queryParamsSetup}${binarySetup}${multipartSetup}`,
      this.isBinaryRequestBody(context),
      this.isBinaryResponse(context),
      expectedSuccessStatusCode,
      usesAny2xxSuccessStatus
    );
  }

  private buildRequestConfig(
    method: HttpMethod,
    cookies: ExampleOpenAPIParameter[],
    headers: ExampleOpenAPIParameter[],
    queryParams: ExampleOpenAPIParameter[],
    requestBody: any,
    context: CodeGenerateContext
  ): string {
    const configParts: string[] = [`method: '${method}'`];
    const requestHeaders = [...headers];
    const hasRequestBody = this.hasRequestBodyValue(method, requestBody);

    if (cookies.length > 0) {
      configParts.push(`withCredentials: true`);
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
      configParts.push(`headers: ${this.buildHeadersObject(requestHeaders)}`);
    }

    if (
      queryParams.length > 0 &&
      !this.hasAllowReservedQueryParameters(queryParams)
    ) {
      configParts.push('params: queryParams');
    }

    if (this.isBinaryResponse(context)) {
      configParts.push(`responseType: 'arraybuffer'`);
    }

    if (hasRequestBody) {
      if (this.isMultipartRequestBody(context)) {
        configParts.push('data: formData');
      } else if (this.isBinaryRequestBody(context)) {
        configParts.push('data: requestBody');
      } else if (this.usesStringRequestBody(context)) {
        configParts.push(
          `data: '${this.escapeSingleQuoted(
            this.serializeStringRequestBody(requestBody, context)
          )}'`
        );
      } else {
        configParts.push(`data: ${JSON.stringify(requestBody, null, 2)}`);
      }
    }

    return configParts.join(',\n      ');
  }

  private buildHeadersObject(headers: ExampleOpenAPIParameter[]): string {
    const headerEntries = headers.map(
      (header) =>
        `'${this.escapeSingleQuoted(header.name)}': '${this.escapeSingleQuoted(
          this.serializeHeaderParameterValue(header)
        )}'`
    );

    return `{\n    ${headerEntries.join(',\n    ')}\n  }`;
  }

  private buildQueryParamsSetup(
    queryParams: ExampleOpenAPIParameter[]
  ): string {
    if (this.hasAllowReservedQueryParameters(queryParams)) {
      return `const queryString = '${this.escapeSingleQuoted(
        this.buildSerializedQueryString(queryParams)
      )}';\n  if (queryString) {\n    url += (url.includes('?') ? '&' : '?') + queryString;\n  }`;
    }

    const paramLines = this.buildQueryParameterEntries(queryParams).map(
      (param) =>
        `queryParams.append('${this.escapeSingleQuoted(
          param.name
        )}', '${this.escapeSingleQuoted(param.value)}');`
    );

    return `const queryParams = new URLSearchParams();\n  ${paramLines.join(
      '\n  '
    )}`;
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

    return `const formData = new FormData();\n  ${multipartLines.join('\n  ')}`;
  }

  private generateAxiosRequestCode(
    baseUrl: string,
    path: string,
    config: string,
    operation: OpenAPIOperation,
    setupCode = '',
    needsBinaryImport = false,
    handlesBinaryResponse = false,
    expectedSuccessStatusCode = 200,
    usesAny2xxSuccessStatus = false
  ): string {
    const processedPath = path.replace(/{(\w+)}/g, '$${$1}');
    const url = this.buildRequestUrl(baseUrl, processedPath);
    const operationId = this.toIdentifier(
      operation.operationId,
      'apiRequest',
      'camel'
    );
    const binaryImport = needsBinaryImport
      ? `const { readFile } = require('fs/promises');\n\n`
      : '';
    const axiosImport = `const axios = require('axios');\n\n`;
    const responseLoggingCode = handlesBinaryResponse
      ? "console.log('Response bytes:', response.data.byteLength ?? response.data.length);"
      : "console.log('Response:', response.data);";
    const successStatusCheck = usesAny2xxSuccessStatus
      ? 'response.status < 200 || response.status >= 300'
      : `response.status !== ${expectedSuccessStatusCode}`;

    return `${binaryImport}${axiosImport}/**
 * ${operation.summary || operation.description || 'API request'}
 * ${operation.description ? ` * ${operation.description}` : ''}
 */
async function ${operationId}() {
  let url = ${JSON.stringify(url)};
${setupCode}  try {
    const response = await axios({
      url: url,
      ${config}
    });
    if (${successStatusCheck}) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }
    ${responseLoggingCode}
    return response.data;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    throw error;
  }
}

// Example usage
// ${operationId}();`;
  }

  private escapeSingleQuoted(value: string): string {
    return value
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/\r?\n/g, '\\n');
  }
}
