import { BaseRequestCodeGenerator } from '@/openapi/generator/generator';
import {
  CodeGenerateContext,
  ExampleOpenAPIParameter,
  HttpMethod,
  Language,
  OpenAPIOperation,
} from '@/types';

export class FaradayRubyRequestCodeGenerator extends BaseRequestCodeGenerator {
  getLanguage(): Language {
    return 'ruby';
  }

  getLibrary(): string {
    return 'faraday';
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
    const expectedSuccessStatusCode =
      this.getExpectedSuccessStatusCode(context);
    const successStatusCheck = this.usesAny2xxSuccessStatus(context)
      ? 'response.status >= 200 && response.status < 300'
      : `response.status == ${expectedSuccessStatusCode}`;
    const responseHandlingCode = this.isBinaryResponse(context)
      ? `data = response.body.dup.force_encoding(Encoding::BINARY)
    puts "Response bytes: #{data.bytesize}"
    data`
      : `puts "Response: #{response.body}"
    response.body`;
    const multipartRequire = this.isMultipartRequestBody(context)
      ? "require 'faraday/multipart'\n"
      : '';
    const escapedRequestUrl = this.escapeSingleQuotedString(
      this.buildRequestUrl(baseUrl, path)
    );
    const connectionCode = this.isMultipartRequestBody(context)
      ? `Faraday.new do |f|
    f.request :multipart
    f.request :url_encoded
    f.adapter Faraday.default_adapter
  end`
      : `Faraday.new`;

    return `require 'faraday'
require 'uri'
${multipartRequire}require 'json'

# ${operation.summary || operation.description || 'API request'}
def ${operationId}
  conn = ${connectionCode}
  request_url = '${escapedRequestUrl}'
${this.buildQueryParamsCode(queryParams)}

  response = conn.${method.toLowerCase()}(request_url) do |req|
${this.buildRequestSetup(cookies, headers, method, requestBody, context)}
  end

  if ${successStatusCheck}
    puts "Status: #{response.status}"
    ${responseHandlingCode}
  else
    puts "Error: #{response.status} - #{response.body}"
    raise "Request failed with status #{response.status}"
  end
end

${operationId}`;
  }

  private buildRequestSetup(
    cookies: ExampleOpenAPIParameter[],
    headers: ExampleOpenAPIParameter[],
    method: HttpMethod,
    requestBody: any,
    context: CodeGenerateContext
  ): string {
    const lines: string[] = [];
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

    requestHeaders.forEach((header) => {
      lines.push(
        `    req.headers['${this.escapeSingleQuoted(
          header.name
        )}'] = '${this.escapeSingleQuoted(
          this.serializeHeaderParameterValue(header)
        )}'`
      );
    });

    if (this.hasRequestBody(method, requestBody)) {
      if (this.isMultipartRequestBody(context)) {
        lines.push('    req.body = {');
        this.getMultipartFieldParts(requestBody).forEach((part) => {
          lines.push(
            `      '${this.escapeSingleQuoted(
              part.name
            )}' => '${this.escapeSingleQuoted(part.value)}',`
          );
        });
        this.getMultipartFileParts(requestBody).forEach((part) => {
          lines.push(
            `      '${this.escapeSingleQuoted(
              part.name
            )}' => Faraday::Multipart::FilePart.new('${this.escapeSingleQuoted(
              part.filename || part.name
            )}', '${this.escapeSingleQuoted(
              part.contentType || 'application/octet-stream'
            )}')`
          );
        });
        lines.push('    }');
      } else if (this.isBinaryRequestBody(context)) {
        lines.push(
          `    requestBody = File.binread('${this.escapeSingleQuoted(
            this.getBinaryRequestBodyFileName(requestBody)
          )}')`
        );
        lines.push('    req.body = requestBody');
      } else if (this.usesStringRequestBody(context)) {
        lines.push(
          `    req.body = '${this.escapeSingleQuoted(
            this.serializeStringRequestBody(requestBody, context)
          )}'`
        );
      } else {
        lines.push(
          `    req.body = '${this.escapeSingleQuoted(
            JSON.stringify(requestBody, null, 2)
          )}'`
        );
      }
    }

    return lines.join('\n');
  }

  private buildQueryParamsCode(queryParams: ExampleOpenAPIParameter[]): string {
    if (this.hasAllowReservedQueryParameters(queryParams)) {
      return `  request_url += (request_url.include?('?') ? '&' : '?') + '${this.escapeSingleQuoted(
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
          `  request_url += (request_url.include?('?') ? '&' : '?') + '${this.escapeSingleQuoted(
            param.name
          )}=' + URI.encode_www_form_component('${this.escapeSingleQuoted(
            param.value
          )}')`
      )
      .join('\n');
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
