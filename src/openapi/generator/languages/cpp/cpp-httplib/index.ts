import { BaseRequestCodeGenerator } from '@/openapi/generator/generator';
import {
  CodeGenerateContext,
  ExampleOpenAPIParameter,
  HttpMethod,
  Language,
  OpenAPIOperation,
} from '@/types';

export class CppHttplibCppRequestCodeGenerator extends BaseRequestCodeGenerator {
  getLanguage(): Language {
    return 'cpp';
  }

  getLibrary(): string {
    return 'cpp-httplib';
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
    const expectedSuccessStatusCode =
      this.getExpectedSuccessStatusCode(context);
    const successStatusCheck = this.usesAny2xxSuccessStatus(context)
      ? 'response->status < 200 || response->status >= 300'
      : `response->status != ${expectedSuccessStatusCode}`;
    const binaryHelper = this.isBinaryRequestBody(context)
      ? `
std::string readBinaryFile(const std::string& path) {
    std::ifstream file(path, std::ios::binary);
    if (!file) {
        throw std::runtime_error("Failed to open binary file");
    }

    return std::string(
        (std::istreambuf_iterator<char>(file)),
        std::istreambuf_iterator<char>()
    );
}
`
      : '';
    const queryEncodingHelper =
      queryParams.length > 0 &&
      !this.hasAllowReservedQueryParameters(queryParams)
        ? `
std::string urlEncode(const std::string& value) {
    static const char* hex = "0123456789ABCDEF";
    std::string encoded;
    encoded.reserve(value.size() * 3);

    for (unsigned char ch : value) {
        if ((ch >= 'A' && ch <= 'Z') || (ch >= 'a' && ch <= 'z') ||
            (ch >= '0' && ch <= '9') || ch == '-' || ch == '_' ||
            ch == '.' || ch == '~') {
            encoded += static_cast<char>(ch);
        } else {
            encoded += '%';
            encoded += hex[ch >> 4];
            encoded += hex[ch & 0x0F];
        }
    }

    return encoded;
}
`
        : '';
    const responseHandlingCode = this.isBinaryResponse(context)
      ? `std::string data = response->body;
    std::cout << "Response bytes: " << data.size() << std::endl;`
      : this.usesStringResponse(context)
      ? `std::string data = response->body;
    std::cout << "Response: " << data << std::endl;`
      : `auto data = json::parse(response->body);
    std::cout << "Response: " << data.dump(4) << std::endl;`;
    const serverUrl = this.parseServerUrl(baseUrl);
    const requestBaseUrl = this.escapeDoubleQuotedString(serverUrl.origin);
    const requestPath = this.escapeDoubleQuotedString(
      this.combineServerPath(baseUrl, path)
    );

    return `#include <iostream>
#include <fstream>
#include <iterator>
#include <stdexcept>
#include <string>
#include <httplib.h>
#include <nlohmann/json.hpp>

using json = nlohmann::json;
${binaryHelper}
${queryEncodingHelper}

/*
${operation.summary || operation.description || 'API request'}
${operation.description ? ` * ${operation.description}` : ''}
*/

int main() {
    std::string path = "${requestPath}";
    ${this.buildQueryParamsCode(queryParams)}

    httplib::Client cli("${requestBaseUrl}");

    ${this.buildHeadersCode(headers, method, requestBody, context)}
    ${this.buildCookiesCode(cookies)}
    ${this.buildRequestBodyCode(method, requestBody, context)}

    ${this.buildRequestExecutionCode(method, requestBody, context)}

    if (!response) {
        std::cerr << "HTTP request failed" << std::endl;
        return 1;
    }

    if (${successStatusCheck}) {
        std::cerr << "HTTP error! status: " << response->status << std::endl;
        return 1;
    }

    ${responseHandlingCode}

    return 0;
}`;
  }

  private buildCookiesCode(cookies: ExampleOpenAPIParameter[]): string {
    if (cookies.length === 0) {
      return '';
    }

    const cookieHeader = this.buildCookieHeaderValue(cookies);

    return `headers.emplace("Cookie", "${this.escapeDoubleQuoted(
      cookieHeader
    )}");`;
  }

  private buildQueryParamsCode(queryParams: ExampleOpenAPIParameter[]): string {
    if (this.hasAllowReservedQueryParameters(queryParams)) {
      return `path += (path.find('?') != std::string::npos ? "&" : "?") + "${this.escapeDoubleQuoted(
        this.buildSerializedQueryString(queryParams)
      )}";`;
    }

    const paramEntries = this.buildQueryParameterEntries(queryParams);

    if (paramEntries.length === 0) {
      return '';
    }

    return paramEntries
      .map(
        (param) =>
          `path += (path.find('?') != std::string::npos ? "&" : "?") + "${this.escapeDoubleQuoted(
            param.name
          )}=" + urlEncode("${this.escapeDoubleQuoted(String(param.value))}");`
      )
      .join('\n    ');
  }

  private buildHeadersCode(
    headers: ExampleOpenAPIParameter[],
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
      return 'httplib::Headers headers;';
    }

    const headerEntries = requestHeaders.map(
      (header) =>
        `{"${header.name}", "${this.escapeDoubleQuoted(
          this.serializeHeaderParameterValue(header)
        )}"}`
    );

    return `httplib::Headers headers = {\n        ${headerEntries.join(
      ',\n        '
    )}\n    };`;
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
      return `std::string request_body = readBinaryFile("${this.escapeDoubleQuoted(
        this.getBinaryRequestBodyFileName(requestBody)
      )}");`;
    }

    if (this.usesStringRequestBody(context)) {
      return `std::string request_body = "${this.escapeDoubleQuoted(
        this.serializeStringRequestBody(requestBody, context)
      )}";`;
    }

    if (this.isMultipartRequestBody(context)) {
      return this.buildMultipartRequestBodyCode(requestBody);
    }

    const jsonBody = JSON.stringify(requestBody, null, 2);
    return `json request_body = json::parse(${this.toCppStringLiteral(
      jsonBody
    )});`;
  }

  private buildRequestExecutionCode(
    method: HttpMethod,
    requestBody: any,
    context: CodeGenerateContext
  ): string {
    if (!this.hasRequestBody(method, requestBody)) {
      if (method === 'GET') {
        return 'auto response = cli.Get(path.c_str(), headers);';
      }

      if (method === 'DELETE') {
        return 'auto response = cli.Delete(path.c_str(), headers);';
      }

      return `auto response = cli.${this.toMethodName(
        method
      )}(path.c_str(), headers);`;
    }

    const contentType = context.requestContentType || 'application/json';
    const bodyValue =
      this.usesStringRequestBody(context) || this.isBinaryRequestBody(context)
        ? 'request_body'
        : 'request_body.dump()';

    if (this.isMultipartRequestBody(context)) {
      return `auto response = cli.${this.toMethodName(
        method
      )}(path.c_str(), headers, request_body, "multipart/form-data; boundary=${this.buildMultipartBoundary()}");`;
    }

    return `auto response = cli.${this.toMethodName(
      method
    )}(path.c_str(), headers, ${bodyValue}, "${contentType}");`;
  }

  private buildMultipartRequestBodyCode(requestBody: any): string {
    const rawBody = this.buildRawMultipartBody(
      this.getMultipartParts(requestBody)
    );

    return `const std::string boundary = "${this.buildMultipartBoundary()}";
    std::string request_body = R"SDKWORK(${rawBody})SDKWORK";`;
  }

  private hasRequestBody(method: HttpMethod, requestBody: any): boolean {
    return (
      ['POST', 'PUT', 'PATCH'].includes(method) &&
      requestBody !== undefined &&
      requestBody !== null
    );
  }

  private toMethodName(method: HttpMethod): string {
    return method.charAt(0) + method.slice(1).toLowerCase();
  }

  private escapeDoubleQuoted(value: string): string {
    return value
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\r?\n/g, '\\n');
  }
}
