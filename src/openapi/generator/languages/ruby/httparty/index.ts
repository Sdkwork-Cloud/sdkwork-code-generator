import { BaseRequestCodeGenerator } from '@/openapi/generator/generator';
import {
  CodeGenerateContext,
  ExampleOpenAPIParameter,
  HttpMethod,
  Language,
  OpenAPIOperation,
} from '@/types';

export class HttpartyRubyRequestCodeGenerator extends BaseRequestCodeGenerator {
  getLanguage(): Language {
    return 'ruby';
  }

  getLibrary(): string {
    return 'httparty';
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
      'api_request',
      'snake'
    );
    const url = this.escapeDoubleQuotedString(
      this.buildRequestUrl(baseUrl, path)
    );
    const expectedSuccessStatusCode =
      this.getExpectedSuccessStatusCode(context);
    const successStatusCheck = this.usesAny2xxSuccessStatus(context)
      ? 'response.code < 200 || response.code >= 300'
      : `response.code != ${expectedSuccessStatusCode}`;
    const requestBodySetup =
      this.hasRequestBody(method, requestBody) &&
      this.isBinaryRequestBody(context)
        ? `  requestBody = File.binread('${this.escapeSingleQuoted(
            this.getBinaryRequestBodyFileName(requestBody)
          )}')\n\n`
        : '';
    const responseHandlingCode = this.isBinaryResponse(context)
      ? `data = response.body.dup.force_encoding(Encoding::BINARY)
  puts "Response bytes: #{data.bytesize}"`
      : this.usesStringResponse(context)
      ? `data = response.body
  puts "Response: #{data}"`
      : `data = JSON.parse(response.body)
  puts "Response: #{JSON.pretty_generate(data)}"`;

    return `require 'httparty'
require 'json'

=begin
${operation.summary || operation.description || 'API request'}
${operation.description ? ` * ${operation.description}` : ''}
=end

def ${operationId}
  url = "${url}"
  ${this.buildQueryParamsCode(queryParams)}
${requestBodySetup}

  options = {
    ${this.buildHeadersCode(headers, cookies, method, requestBody, context)}
    ${this.buildRequestBodyCode(method, requestBody, context)}
  }

  response = HTTParty.${method.toLowerCase()}(url, options)

  if ${successStatusCheck}
    raise "HTTP error! status: #{response.code}"
  end

  ${responseHandlingCode}
  data
end

${operationId}()`;
  }

  private buildQueryParamsCode(queryParams: ExampleOpenAPIParameter[]): string {
    if (this.hasAllowReservedQueryParameters(queryParams)) {
      return `url += (url.include?('?') ? '&' : '?') + '${this.escapeSingleQuoted(
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
          `url += (url.include?('?') ? '&' : '?') + '${this.escapeSingleQuoted(
            param.name
          )}=' + URI.encode_www_form_component('${this.escapeSingleQuoted(
            param.value
          )}')`
      )
      .join('\n  ');
  }

  private buildHeadersCode(
    headers: ExampleOpenAPIParameter[],
    cookies: ExampleOpenAPIParameter[],
    method: HttpMethod,
    requestBody: any,
    context: CodeGenerateContext
  ): string {
    const requestHeaders = [...headers];
    const cookieHeader = this.buildCookieHeaderParameter(cookies);

    if (cookieHeader) {
      requestHeaders.push(cookieHeader);
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
        `'${this.escapeSingleQuoted(
          header.name
        )}' => '${this.escapeSingleQuoted(
          this.serializeHeaderParameterValue(header)
        )}'`
    );

    return `headers: {\n      ${headerEntries.join(',\n      ')}\n    },`;
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
      const fieldLines = this.getMultipartFieldParts(requestBody).map(
        (part) =>
          `      '${this.escapeSingleQuoted(
            part.name
          )}' => '${this.escapeSingleQuoted(part.value)}',`
      );
      const filePart = this.getMultipartFileParts(requestBody)[0];
      const fileLines = filePart
        ? [
            `      '${this.escapeSingleQuoted(
              filePart.name
            )}' => File.open('${this.escapeSingleQuoted(
              filePart.filename || filePart.name
            )}')`,
          ]
        : [];

      return `multipart: true,\n    body: {\n${[
        ...fieldLines,
        ...fileLines,
      ].join('\n')}\n    },`;
    }

    if (this.isBinaryRequestBody(context)) {
      return 'body: requestBody,';
    }

    if (this.usesStringRequestBody(context)) {
      return `body: '${this.escapeSingleQuoted(
        this.serializeStringRequestBody(requestBody, context)
      )}',`;
    }

    return `body: '${this.escapeSingleQuoted(
      JSON.stringify(requestBody, null, 2)
    )}',`;
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
