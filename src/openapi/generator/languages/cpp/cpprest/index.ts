import { BaseRequestCodeGenerator } from '@/openapi/generator/generator';
import {
  CodeGenerateContext,
  ExampleOpenAPIParameter,
  HttpMethod,
  Language,
  OpenAPIOperation,
} from '@/types';

export class CpprestCppRequestCodeGenerator extends BaseRequestCodeGenerator {
  getLanguage(): Language {
    return 'cpp';
  }

  getLibrary(): string {
    return 'cpprest';
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
      ? 'response.status_code() < 200 || response.status_code() >= 300'
      : `response.status_code() != ${expectedSuccessStatusCode}`;
    const handlesBinaryResponse = this.isBinaryResponse(context);
    const responseExtractCode = handlesBinaryResponse
      ? 'response.extract_vector();'
      : 'response.extract_string();';
    const responseBodyType = handlesBinaryResponse
      ? 'std::vector<unsigned char>'
      : 'std::string';
    const responseOutputCode = handlesBinaryResponse
      ? 'std::cout << "Response bytes: " << body.size() << std::endl;'
      : 'std::cout << "Response: " << body << std::endl;';
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
    const serverUrl = this.parseServerUrl(baseUrl);
    const requestBaseUrl = this.escapeDoubleQuotedString(serverUrl.origin);
    const requestPath = this.combineServerPath(baseUrl, path);

    return `#include <cpprest/http_client.h>
#include <cpprest/json.h>
#include <fstream>
#include <iostream>
#include <iterator>
#include <stdexcept>
#include <string>
${handlesBinaryResponse ? '#include <vector>\n' : ''}

using namespace web;
using namespace web::http;
using namespace web::http::client;
${binaryHelper}

// ${operation.summary || operation.description || 'API request'}
void ${operationId}() {
    http_client client(U("${requestBaseUrl}"));

    ${this.buildRequestUriCode(requestPath, queryParams)}

    http_request request(methods::${method});
    request.set_request_uri(requestUri);

    ${this.buildCookiesCode(cookies)}
    ${this.buildHeadersCode(headers, method, requestBody, context)}
    ${this.buildRequestBodyCode(requestBody, method, context)}

    client.request(request).then([](http_response response) {
        if (${successStatusCheck}) {
            throw std::runtime_error("HTTP error! status: " + std::to_string(static_cast<int>(response.status_code())));
        }
        std::cout << "Status: " << response.status_code() << std::endl;
        return ${responseExtractCode}
    }).then([](${responseBodyType} body) {
        ${responseOutputCode}
    }).wait();
}

int main() {
    ${operationId}();
    return 0;
}`;
  }

  private buildCookiesCode(cookies: ExampleOpenAPIParameter[]): string {
    if (cookies.length === 0) {
      return '';
    }

    const cookieHeader = this.buildCookieHeaderValue(cookies);

    return `request.headers().add(U("Cookie"), U("${this.escapeDoubleQuoted(
      cookieHeader
    )}"));`;
  }

  private buildRequestUriCode(
    path: string,
    queryParams: ExampleOpenAPIParameter[]
  ): string {
    if (this.hasAllowReservedQueryParameters(queryParams)) {
      return `auto requestUri = U("${this.escapeDoubleQuoted(
        `${path}?${this.buildSerializedQueryString(queryParams)}`
      )}");`;
    }

    return `uri_builder builder(U("${this.escapeDoubleQuoted(path)}"));
    ${this.buildQueryParamsCode(queryParams)}
    auto requestUri = builder.to_string();`;
  }

  private buildQueryParamsCode(queryParams: ExampleOpenAPIParameter[]): string {
    const paramEntries = this.buildQueryParameterEntries(queryParams);

    if (paramEntries.length === 0) {
      return '';
    }

    return paramEntries
      .map(
        (param) =>
          `builder.append_query(U("${this.escapeDoubleQuoted(
            param.name
          )}"), U("${this.escapeDoubleQuoted(String(param.value))}"));`
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
      return '';
    }

    return requestHeaders
      .map(
        (header) =>
          `request.headers().add(U("${
            header.name
          }"), U("${this.escapeDoubleQuoted(
            this.serializeHeaderParameterValue(header)
          )}"));`
      )
      .join('\n    ');
  }

  private buildRequestBodyCode(
    requestBody: any,
    method: HttpMethod,
    context: CodeGenerateContext
  ): string {
    if (!this.hasRequestBody(method, requestBody)) {
      return '';
    }

    if (this.isBinaryRequestBody(context)) {
      const contentType =
        context.requestContentType || 'application/octet-stream';
      return `const std::string requestBody = readBinaryFile("${this.escapeDoubleQuoted(
        this.getBinaryRequestBodyFileName(requestBody)
      )}");
    request.set_body(requestBody, "${contentType}");`;
    }

    if (this.usesStringRequestBody(context)) {
      const contentType = context.requestContentType || 'text/plain';
      return `request.set_body("${this.escapeDoubleQuoted(
        this.serializeStringRequestBody(requestBody, context)
      )}", "${contentType}");`;
    }

    if (this.isMultipartRequestBody(context)) {
      return this.buildMultipartRequestBodyCode(requestBody);
    }

    const jsonBody = JSON.stringify(requestBody, null, 2);
    return `json::value body = json::value::parse(U(R"(${jsonBody})"));
    request.set_body(body);`;
  }

  private buildMultipartRequestBodyCode(requestBody: any): string {
    const rawBody = this.buildRawMultipartBody(
      this.getMultipartParts(requestBody)
    );

    return `const std::string boundary = "${this.buildMultipartBoundary()}";
    const std::string request_body = R"SDKWORK(${rawBody})SDKWORK";
    request.headers().add(U("Content-Type"), U("multipart/form-data; boundary=${this.buildMultipartBoundary()}"));
    request.set_body(request_body);`;
  }

  private hasRequestBody(method: HttpMethod, requestBody: any): boolean {
    return (
      ['POST', 'PUT', 'PATCH'].includes(method) &&
      requestBody !== undefined &&
      requestBody !== null
    );
  }

  private escapeDoubleQuoted(value: string): string {
    return value
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\r?\n/g, '\\n');
  }
}
