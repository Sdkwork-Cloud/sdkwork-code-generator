import { BaseRequestCodeGenerator } from '@/openapi/generator/generator';
import {
  CodeGenerateContext,
  ExampleOpenAPIParameter,
  HttpMethod,
  Language,
  OpenAPIOperation,
} from '@/types';

export class AxiosTypeScriptRequestCodeGenerator extends BaseRequestCodeGenerator {
  getLanguage(): Language {
    return 'typescript';
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
    const operationName = this.toIdentifier(
      operation.operationId,
      'apiRequest',
      'camel'
    );
    const operationTypeName = this.toIdentifier(
      operation.operationId,
      'ApiRequest',
      'pascal'
    );
    const binarySetup = this.isBinaryRequestBody(context)
      ? `  const requestBody = await readFile('${this.escapeSingleQuoted(
          this.getBinaryRequestBodyFileName(requestBody)
        )}');\n\n`
      : '';
    const queryParamsSetup =
      queryParams.length > 0
        ? `  ${this.buildQueryParamsSetup(queryParams)}\n\n`
        : '';
    const multipartSetup =
      this.isMultipartRequestBody(context) && requestBody
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
    const interfaceCode = this.generateTypeScriptInterfaces(
      operationTypeName,
      requestBody
    );
    const requestCode = this.generateAxiosRequestCode(
      baseUrl,
      path,
      config,
      operation,
      operationName,
      operationTypeName,
      `${queryParamsSetup}${binarySetup}${multipartSetup}`,
      this.isBinaryRequestBody(context),
      this.isBinaryResponse(context),
      this.getExpectedSuccessStatusCode(context),
      this.usesAny2xxSuccessStatus(context)
    );

    return `${interfaceCode}

${requestCode}`;
  }

  private buildRequestConfig(
    method: HttpMethod,
    cookies: ExampleOpenAPIParameter[],
    headers: ExampleOpenAPIParameter[],
    queryParams: ExampleOpenAPIParameter[],
    requestBody: any,
    context: CodeGenerateContext
  ): string {
    const configParts: string[] = [`method: '${method.toLowerCase()}'`];
    const requestHeaders = [...headers];

    if (cookies.length > 0) {
      configParts.push(`withCredentials: true`);
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

    if (this.hasRequestBody(method, requestBody)) {
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

    return `{\n  ${configParts.join(',\n  ')}\n}`;
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

  private generateTypeScriptInterfaces(
    operationTypeName: string,
    requestBody: any
  ): string {
    const requestInterface = `${operationTypeName}Request`;
    const responseInterface = `${operationTypeName}Response`;

    let interfaces = `interface ${requestInterface} {
  // Request parameter interface
`;

    if (this.isMultipartPartsRequestBody(requestBody)) {
      const seen = new Set<string>();
      this.getMultipartParts(requestBody).forEach((part) => {
        if (seen.has(part.name)) {
          return;
        }

        seen.add(part.name);
        interfaces += `  ${this.toTypeScriptPropertyKey(part.name)}: string;\n`;
      });
    } else if (requestBody && typeof requestBody === 'object') {
      Object.keys(requestBody).forEach((key) => {
        interfaces += `  ${this.toTypeScriptPropertyKey(
          key
        )}: ${typeof requestBody[key]};\n`;
      });
    }

    interfaces += `}

interface ${responseInterface} {
  data: any;
  status: number;
  statusText: string;
}`;

    return interfaces;
  }

  private generateAxiosRequestCode(
    baseUrl: string,
    path: string,
    config: string,
    operation: OpenAPIOperation,
    operationName: string,
    operationTypeName: string,
    setupCode = '',
    needsBinaryImport = false,
    handlesBinaryResponse = false,
    expectedSuccessStatusCode = 200,
    usesAny2xxSuccessStatus = false
  ): string {
    const url = this.buildRequestUrl(baseUrl, path);
    const axiosImport = `import axios from 'axios';\n`;
    const binaryImport = needsBinaryImport
      ? `import { readFile } from 'fs/promises';\n`
      : '';
    const responseTypeName = handlesBinaryResponse
      ? 'ArrayBuffer'
      : `${operationTypeName}Response`;
    const responseLoggingCode = handlesBinaryResponse
      ? "console.log('Response bytes:', response.data.byteLength);"
      : "console.log('Response:', response.data);";
    const successStatusCheck = usesAny2xxSuccessStatus
      ? 'response.status < 200 || response.status >= 300'
      : `response.status !== ${expectedSuccessStatusCode}`;
    const axiosCall = handlesBinaryResponse
      ? `axios<ArrayBuffer>(url, ${config})`
      : `axios(url, ${config})`;
    const returnCode = handlesBinaryResponse
      ? 'return response.data;'
      : `return {
      data: response.data,
      status: response.status,
      statusText: response.statusText
    };`;

    return `${axiosImport}${binaryImport}
/**
 * ${operation.summary || operation.description || 'API request'}
 */
async function ${operationName}(): Promise<${responseTypeName}> {
  let url = ${JSON.stringify(url)};
${setupCode}  try {
    const response = await ${axiosCall};
    if (${successStatusCheck}) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }
    ${responseLoggingCode}
    ${returnCode}
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    throw error;
  }
}

// Example usage
// ${operationName}();`;
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
