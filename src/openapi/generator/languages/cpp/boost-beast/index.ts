import { BaseRequestCodeGenerator } from '@/openapi/generator/generator';
import {
  CodeGenerateContext,
  ExampleOpenAPIParameter,
  HttpMethod,
  Language,
  OpenAPIOperation,
} from '@/types';

export class BoostBeastCppRequestCodeGenerator extends BaseRequestCodeGenerator {
  getLanguage(): Language {
    return 'cpp';
  }

  getLibrary(): string {
    return 'boost-beast';
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
    const serverUrl = this.parseServerUrl(baseUrl);
    const isHttps = serverUrl.protocol === 'https:';
    const escapedResolverHost = this.escapeDoubleQuotedString(
      serverUrl.hostname
    );
    const escapedHostHeader = this.escapeDoubleQuotedString(
      serverUrl.host || serverUrl.hostname
    );
    const escapedPort = this.escapeDoubleQuotedString(serverUrl.port || '80');
    const expectedSuccessStatusCode =
      this.getExpectedSuccessStatusCode(context);
    const successStatusCheck = this.usesAny2xxSuccessStatus(context)
      ? 'res.result_int() < 200 || res.result_int() >= 300'
      : `res.result_int() != ${expectedSuccessStatusCode}`;
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
      ? `std::string data = response_body;
        std::cout << "Response bytes: " << data.size() << std::endl;`
      : this.usesStringResponse(context)
      ? `std::string data = response_body;
        std::cout << "Response: " << data << std::endl;`
      : `auto data = json::parse(response_body);
        std::cout << "Response: " << data.dump(4) << std::endl;`;
    const targetPath = this.escapeDoubleQuotedString(
      this.combineServerPath(baseUrl, path)
    );
    const sslIncludes = isHttps
      ? `#include <boost/beast/ssl.hpp>
#include <boost/asio/ssl.hpp>
#include <openssl/err.h>
#include <openssl/ssl.h>
`
      : '';
    const sslNamespace = isHttps ? 'namespace ssl = net::ssl;\n' : '';
    const streamSetup = isHttps
      ? `ssl::context ctx(ssl::context::tlsv12_client);
        ctx.set_default_verify_paths();
        beast::ssl_stream<beast::tcp_stream> stream(ioc, ctx);
        stream.set_verify_mode(ssl::verify_peer);

        if (!SSL_set_tlsext_host_name(stream.native_handle(), "${escapedResolverHost}")) {
            beast::error_code ec{
                static_cast<int>(::ERR_get_error()),
                net::error::get_ssl_category()
            };
            throw beast::system_error{ec};
        }

        auto const results = resolver.resolve("${escapedResolverHost}", "${escapedPort}");
        beast::get_lowest_layer(stream).connect(results);
        stream.handshake(ssl::stream_base::client);`
      : `beast::tcp_stream stream(ioc);

        auto const results = resolver.resolve("${escapedResolverHost}", "${escapedPort}");
        stream.connect(results);`;
    const streamShutdown = isHttps
      ? 'stream.shutdown(ec);'
      : 'stream.socket().shutdown(tcp::socket::shutdown_both, ec);';

    return `#include <iostream>
#include <fstream>
#include <iterator>
#include <string>
#include <stdexcept>
#include <boost/beast.hpp>
#include <boost/asio.hpp>
${sslIncludes}#include <nlohmann/json.hpp>

namespace beast = boost::beast;
namespace http = beast::http;
namespace net = boost::asio;
${sslNamespace}using tcp = net::ip::tcp;
using json = nlohmann::json;
${binaryHelper}
${queryEncodingHelper}

/*
${operation.summary || operation.description || 'API request'}
${operation.description ? ` * ${operation.description}` : ''}
*/

int main() {
    try {
        net::io_context ioc;
        tcp::resolver resolver(ioc);
        ${streamSetup}

        std::string target = "${targetPath}";
        ${this.buildQueryParamsCode(queryParams)}

        http::request<http::string_body> req{http::verb::${method.toLowerCase()}, target, 11};
        req.set(http::field::host, "${escapedHostHeader}");
        req.set(http::field::user_agent, "Boost.Beast");

        ${this.buildCookiesCode(cookies, 'req')}
        ${this.buildHeadersCode(headers, 'req', method, requestBody, context)}
        ${this.buildRequestBodyCode(method, requestBody, 'req', context)}

        http::write(stream, req);

        beast::flat_buffer buffer;
        http::response<http::dynamic_body> res;
        http::read(stream, buffer, res);

        if (${successStatusCheck}) {
            std::cerr << "HTTP error! status: " << res.result() << std::endl;
            return 1;
        }

        std::string response_body = beast::buffers_to_string(res.body().data());
        ${responseHandlingCode}

        beast::error_code ec;
        ${streamShutdown}
    } catch (std::exception const& e) {
        std::cerr << "Error: " << e.what() << std::endl;
        return 1;
    }

    return 0;
}`;
  }

  private buildCookiesCode(
    cookies: ExampleOpenAPIParameter[],
    reqVar: string
  ): string {
    if (cookies.length === 0) {
      return '';
    }

    const cookieHeader = this.buildCookieHeaderValue(cookies);

    return `${reqVar}.set(http::field::cookie, "${this.escapeDoubleQuoted(
      cookieHeader
    )}");`;
  }

  private buildHeadersCode(
    headers: ExampleOpenAPIParameter[],
    reqVar: string,
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
      .map((header) => {
        const value = this.escapeDoubleQuoted(
          this.serializeHeaderParameterValue(header)
        );
        if (header.name.toLowerCase() === 'content-type') {
          return `${reqVar}.set(http::field::content_type, "${value}");`;
        }

        return `${reqVar}.set("${header.name}", "${value}");`;
      })
      .join('\n        ');
  }

  private buildRequestBodyCode(
    method: HttpMethod,
    requestBody: any,
    reqVar: string,
    context: CodeGenerateContext
  ): string {
    if (!this.hasRequestBody(method, requestBody)) {
      return '';
    }

    if (this.isBinaryRequestBody(context)) {
      return `std::string requestBody = readBinaryFile("${this.escapeDoubleQuoted(
        this.getBinaryRequestBodyFileName(requestBody)
      )}");\n        ${reqVar}.body() = requestBody;\n        ${reqVar}.prepare_payload();`;
    }

    if (this.usesStringRequestBody(context)) {
      return `${reqVar}.body() = "${this.escapeDoubleQuoted(
        this.serializeStringRequestBody(requestBody, context)
      )}";\n        ${reqVar}.prepare_payload();`;
    }

    if (this.isMultipartRequestBody(context)) {
      return this.buildMultipartRequestBodyCode(requestBody, reqVar);
    }

    const jsonBody = JSON.stringify(requestBody, null, 2);
    return `json request_body = json::parse(${this.toCppStringLiteral(
      jsonBody
    )});\n        ${reqVar}.body() = request_body.dump();\n        ${reqVar}.prepare_payload();`;
  }

  private hasRequestBody(method: HttpMethod, requestBody: any): boolean {
    return (
      ['POST', 'PUT', 'PATCH'].includes(method) &&
      requestBody !== undefined &&
      requestBody !== null
    );
  }

  private buildMultipartRequestBodyCode(
    requestBody: any,
    reqVar: string
  ): string {
    const rawBody = this.buildRawMultipartBody(
      this.getMultipartParts(requestBody)
    );

    return `const std::string boundary = "${this.buildMultipartBoundary()}";
        const std::string request_body = R"SDKWORK(${rawBody})SDKWORK";
        ${reqVar}.set(http::field::content_type, "multipart/form-data; boundary=${this.buildMultipartBoundary()}");
        ${reqVar}.body() = request_body;
        ${reqVar}.prepare_payload();`;
  }

  private buildQueryParamsCode(queryParams: ExampleOpenAPIParameter[]): string {
    if (this.hasAllowReservedQueryParameters(queryParams)) {
      return `target += (target.find('?') != std::string::npos ? "&" : "?") + "${this.escapeDoubleQuoted(
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
          `target += (target.find('?') != std::string::npos ? "&" : "?") + "${this.escapeDoubleQuoted(
            param.name
          )}=" + urlEncode("${this.escapeDoubleQuoted(String(param.value))}");`
      )
      .join('\n        ');
  }

  private escapeDoubleQuoted(value: string): string {
    return value
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\r?\n/g, '\\n');
  }
}
