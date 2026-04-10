import { BaseRequestCodeGenerator } from '@/openapi/generator/generator';
import {
  CodeGenerateContext,
  ExampleOpenAPIParameter,
  HttpMethod,
  Language,
  OpenAPIOperation,
} from '@/types';

export class DioDartRequestCodeGenerator extends BaseRequestCodeGenerator {
  getLanguage(): Language {
    return 'dart';
  }

  getLibrary(): string {
    return 'dio';
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
    const successStatusCheckCode = this.buildSuccessStatusCheckCode(context);
    const responseTypeOption = this.isBinaryResponse(context)
      ? '    responseType: ResponseType.bytes,\n'
      : '';
    const responseHandlingCode = this.isBinaryResponse(context)
      ? `    final data = response.data as List<int>;
    print('Response bytes: \${data.length}');`
      : `    final data = response.data;
    print('Response: $data');`;

    if (
      this.isMultipartRequestBody(context) &&
      this.hasRequestBody(method, requestBody)
    ) {
      return this.generateMultipartCode(
        baseUrl,
        path,
        operation,
        queryParams,
        cookies,
        headers,
        requestBody,
        context,
        responseTypeOption,
        responseHandlingCode
      );
    }

    return `import 'dart:io';
import 'package:dio/dio.dart';

/**
 * ${operation.summary || operation.description || 'API request'}
 * ${operation.description ? ` * ${operation.description}` : ''}
 */

Future<void> ${operationId}() async {
  final dio = Dio();
  String url = "${this.escapeDoubleQuotedString(
    this.buildRequestUrl(baseUrl, path)
  )}";
  ${this.buildQueryParamsCode(queryParams)}

  final options = Options(
    method: '${method.toUpperCase()}',
    headers: {
      ${this.buildHeadersCode(cookies, headers, method, requestBody, context)}
    },
${responseTypeOption}  );

  ${this.buildRequestBodyCode(method, requestBody, context)}

  try {
    final response = await dio.request(
      url,
      options: options,
      ${this.buildRequestDataCode(method, requestBody)}
    );

    ${successStatusCheckCode}

${responseHandlingCode}
  } catch (e) {
    print('Error: $e');
  }
}

void main() {
  ${operationId}();
}`;
  }

  private generateMultipartCode(
    baseUrl: string,
    path: string,
    operation: OpenAPIOperation,
    queryParams: ExampleOpenAPIParameter[],
    cookies: ExampleOpenAPIParameter[],
    headers: ExampleOpenAPIParameter[],
    requestBody: any,
    context: CodeGenerateContext,
    responseTypeOption: string,
    responseHandlingCode: string
  ): string {
    const operationId = this.toIdentifier(
      operation.operationId,
      'apiRequest',
      'camel'
    );
    const successStatusCheckCode = this.buildSuccessStatusCheckCode(context);
    const headerLines = this.buildHeadersCode(
      cookies,
      headers,
      'POST',
      undefined,
      { requestContentType: undefined } as CodeGenerateContext
    );
    const fieldLines = this.getMultipartFieldParts(requestBody).map(
      (part) =>
        `    '${this.escapeSingleQuoted(
          part.name
        )}': '${this.escapeSingleQuoted(part.value)}',`
    );
    const filePart = this.getMultipartFileParts(requestBody)[0];
    const fileLines = filePart
      ? [
          `    '${this.escapeSingleQuoted(
            filePart.name
          )}': MultipartFile.fromString('${this.escapeSingleQuoted(
            filePart.value
          )}', filename: '${this.escapeSingleQuoted(
            filePart.filename || filePart.name
          )}'),`,
        ]
      : [];

    return `import 'package:dio/dio.dart';

/**
 * ${operation.summary || operation.description || 'API request'}
 * ${operation.description ? ` * ${operation.description}` : ''}
 */

Future<void> ${operationId}() async {
  final dio = Dio();
  String url = "${this.escapeDoubleQuotedString(
    this.buildRequestUrl(baseUrl, path)
  )}";
  ${this.buildQueryParamsCode(queryParams)}

  final options = Options(
    method: 'POST',
    headers: {
      ${headerLines}
    },
${responseTypeOption}  );

  final requestBody = FormData.fromMap({
${[...fieldLines, ...fileLines].join('\n')}
  });

  try {
    final response = await dio.request(
      url,
      options: options,
      data: requestBody,
    );

    ${successStatusCheckCode}

${responseHandlingCode}
  } catch (e) {
    print('Error: \$e');
  }
}

void main() {
  ${operationId}();
}`;
  }

  private buildQueryParamsCode(queryParams: ExampleOpenAPIParameter[]): string {
    if (this.hasAllowReservedQueryParameters(queryParams)) {
      return `url += (url.contains('?') ? '&' : '?') + '${this.escapeSingleQuoted(
        this.buildSerializedQueryString(queryParams)
      )}';`;
    }

    const paramEntries = this.buildQueryParameterEntries(queryParams);

    if (paramEntries.length === 0) {
      return '';
    }

    return paramEntries
      .map(
        (param) =>
          `url += (url.contains('?') ? '&' : '?') + '${this.escapeSingleQuoted(
            param.name
          )}=' + Uri.encodeComponent('${this.escapeSingleQuoted(
            param.value
          )}');`
      )
      .join('\n  ');
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

    return requestHeaders
      .map(
        (header) =>
          `'${this.escapeSingleQuoted(
            header.name
          )}': '${this.escapeSingleQuoted(
            this.serializeHeaderParameterValue(header)
          )}',`
      )
      .join('\n      ');
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
      return `final requestBody = await File('${this.escapeSingleQuoted(
        this.getBinaryRequestBodyFileName(requestBody)
      )}').readAsBytes();`;
    }

    if (this.usesStringRequestBody(context)) {
      return `final requestBody = '${this.escapeSingleQuoted(
        this.serializeStringRequestBody(requestBody, context)
      )}';`;
    }

    return `final requestBody = ${JSON.stringify(requestBody, null, 6)};`;
  }

  private buildRequestDataCode(method: HttpMethod, requestBody: any): string {
    if (!this.hasRequestBody(method, requestBody)) {
      return '';
    }

    return 'data: requestBody,';
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

  private buildSuccessStatusCheckCode(context: CodeGenerateContext): string {
    if (this.usesAny2xxSuccessStatus(context)) {
      return `if (response.statusCode < 200 || response.statusCode >= 300) {\n      throw Exception('HTTP error! status: \${response.statusCode}');\n    }`;
    }

    return `if (response.statusCode != ${this.getExpectedSuccessStatusCode(
      context
    )}) {\n      throw Exception('HTTP error! status: \${response.statusCode}');\n    }`;
  }
}
