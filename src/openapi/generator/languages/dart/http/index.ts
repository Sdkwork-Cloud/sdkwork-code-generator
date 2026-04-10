import { BaseRequestCodeGenerator } from '@/openapi/generator/generator';
import {
  CodeGenerateContext,
  ExampleOpenAPIParameter,
  HttpMethod,
  Language,
  OpenAPIOperation,
} from '@/types';

export class HttpDartRequestCodeGenerator extends BaseRequestCodeGenerator {
  getLanguage(): Language {
    return 'dart';
  }

  getLibrary(): string {
    return 'http';
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
    const successStatusCode = this.getExpectedSuccessStatusCode(context);
    const successStatusCheck = this.usesAny2xxSuccessStatus(context)
      ? 'response.statusCode >= 200 && response.statusCode < 300'
      : `response.statusCode == ${successStatusCode}`;

    if (
      this.isMultipartRequestBody(context) &&
      this.hasRequestBody(method, requestBody)
    ) {
      return this.generateMultipartCode(
        baseUrl,
        path,
        operation,
        queryParams,
        requestBody,
        successStatusCode,
        successStatusCheck,
        context
      );
    }

    const responseHandlingCode = this.isBinaryResponse(context)
      ? `      final responseBody = response.bodyBytes;
      print('Response bytes: \${responseBody.length}');`
      : `      print('Response: \${response.body}');`;

    return `import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;

// ${operation.summary || operation.description || 'API request'}
Future<void> ${operationId}() async {
    ${this.buildDartRequestCode(
      method,
      cookies,
      headers,
      queryParams,
      requestBody,
      this.buildRequestUrl(baseUrl, path),
      context
    )}

  try {
    final response = await http.${method.toLowerCase()}(${
      this.hasRequestBody(method, requestBody)
        ? 'uri, headers: headers, body: body'
        : 'uri, headers: headers'
    });

    if (${successStatusCheck}) {
      print('Status: \${response.statusCode}');
${responseHandlingCode}
    } else {
      throw Exception('Request failed with status: \${response.statusCode}');
    }
  } catch (e) {
    print('Error: $e');
    rethrow;
  }
}

void main() async {
  await ${operationId}();
}`;
  }

  private generateMultipartCode(
    baseUrl: string,
    path: string,
    operation: OpenAPIOperation,
    queryParams: ExampleOpenAPIParameter[],
    requestBody: any,
    successStatusCode: number,
    successStatusCheck: string,
    context: CodeGenerateContext
  ): string {
    const operationId = this.toIdentifier(
      operation.operationId,
      'apiRequest',
      'camel'
    );
    const uriCode = this.buildUriCode(
      this.buildRequestUrl(baseUrl, path),
      queryParams
    );
    const responseHandlingCode = this.isBinaryResponse(context)
      ? `      final responseBody = await response.stream.toBytes();
      print('Status: \${response.statusCode}');
      print('Response bytes: \${responseBody.length}');`
      : `      final responseBody = await response.stream.bytesToString();
      print('Status: \${response.statusCode}');
      print('Response: \$responseBody');`;
    const fieldLines = this.getMultipartFieldParts(requestBody).map(
      (part) =>
        `  request.fields['${this.escapeSingleQuoted(
          part.name
        )}'] = '${this.escapeSingleQuoted(part.value)}';`
    );
    const filePart = this.getMultipartFileParts(requestBody)[0];
    const fileLines = filePart
      ? [
          `  request.files.add(await http.MultipartFile.fromString('${this.escapeSingleQuoted(
            filePart.name
          )}', '${this.escapeSingleQuoted(
            filePart.value
          )}', filename: '${this.escapeSingleQuoted(
            filePart.filename || filePart.name
          )}'));`,
        ]
      : [];

    return `import 'package:http/http.dart' as http;

// ${operation.summary || operation.description || 'API request'}
Future<void> ${operationId}() async {
  ${uriCode}
  var request = http.MultipartRequest('${
    operation.requestBody ? 'POST' : 'POST'
  }', uri);
${[...fieldLines, ...fileLines].join('\n')}

  try {
    final response = await request.send();

    if (${successStatusCheck}) {
${responseHandlingCode}
    } else {
      throw Exception('Request failed with status: \${response.statusCode}');
    }
  } catch (e) {
    print('Error: \$e');
    rethrow;
  }
}

void main() async {
  await ${operationId}();
}`;
  }

  private buildDartRequestCode(
    method: HttpMethod,
    cookies: ExampleOpenAPIParameter[],
    headers: ExampleOpenAPIParameter[],
    queryParams: ExampleOpenAPIParameter[],
    requestBody: any,
    url: string,
    context: CodeGenerateContext
  ): string {
    const uriCode = this.buildUriCode(url, queryParams);
    const headersCode = this.buildHeadersCode(
      cookies,
      headers,
      method,
      requestBody,
      context
    );
    const bodyCode = this.buildBodyCode(method, requestBody, context);

    return `${uriCode}
  ${headersCode}
  ${bodyCode}`;
  }

  private buildUriCode(
    url: string,
    queryParams: ExampleOpenAPIParameter[]
  ): string {
    const paramEntries = this.buildQueryParameterEntries(queryParams);

    if (paramEntries.length === 0) {
      return `final uri = Uri.parse("${this.escapeDoubleQuotedString(url)}");`;
    }

    if (this.hasAllowReservedQueryParameters(queryParams)) {
      return `final baseUri = Uri.parse("${this.escapeDoubleQuotedString(
        url
      )}");
  final queryParts = <String>[];
  if (baseUri.query.isNotEmpty) {
    queryParts.add(baseUri.query);
  }
  queryParts.add('${this.escapeSingleQuoted(
    this.buildSerializedQueryString(queryParams)
  )}');
  final uri = baseUri.replace(query: queryParts.join('&'));`;
    }

    const queryPartLines = paramEntries.map(
      (param) =>
        `queryParts.add(Uri.encodeQueryComponent('${this.escapeSingleQuoted(
          param.name
        )}') + '=' + Uri.encodeQueryComponent('${this.escapeSingleQuoted(
          param.value
        )}'));`
    );

    return `final baseUri = Uri.parse("${url}");
  final queryParts = <String>[];
  if (baseUri.query.isNotEmpty) {
    queryParts.add(baseUri.query);
  }
  ${queryPartLines.join('\n  ')}
  final uri = baseUri.replace(query: queryParts.join('&'));`;
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
      return 'final headers = <String, String>{};';
    }

    const headerEntries = requestHeaders.map(
      (header) =>
        `"${this.escapeSingleQuoted(header.name)}": "${this.escapeSingleQuoted(
          this.serializeHeaderParameterValue(header)
        )}"`
    );

    return `final headers = <String, String>{
    ${headerEntries.join(',\n    ')}
  };`;
  }

  private buildBodyCode(
    method: HttpMethod,
    requestBody: any,
    context: CodeGenerateContext
  ): string {
    if (!this.hasRequestBody(method, requestBody)) {
      return '';
    }

    if (this.isBinaryRequestBody(context)) {
      return `final body = await File('${this.escapeSingleQuoted(
        this.getBinaryRequestBodyFileName(requestBody)
      )}').readAsBytes();`;
    }

    if (this.usesStringRequestBody(context)) {
      return `final body = '${this.escapeSingleQuoted(
        this.serializeStringRequestBody(requestBody, context)
      )}';`;
    }

    return `final body = jsonEncode(${JSON.stringify(requestBody, null, 2)});`;
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
