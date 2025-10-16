import { BaseRequestCodeGenerator } from '@/openapi/generator/generator';
import { Language, HttpMethod, OpenAPIOperation, ExampleOpenAPIParameter, CodeGenerateContext } from '@/types';

/**
 * C++ Boost.Beast HTTP请求代码生成器
 */
export class BoostBeastCppRequestCodeGenerator extends BaseRequestCodeGenerator {
  
  /**
   * 获取目标编程语言
   * @returns 编程语言标识符
   */
  getLanguage(): Language {
    return 'cpp';
  }

  /**
   * 获取使用的HTTP库名称
   * @returns HTTP库名称
   */
  getLibrary(): string {
    return 'boost-beast';
  }

  /**
   * 生成具体的HTTP请求代码
   * @param path - 完整的请求Path
   * @param method - 请求方法
   * @param baseUrl - baseUrl
   * @param operation - OpenAPI操作定义
   * @param cookies - cookies示例数据
   * @param headers - 请求头示例数据
   * @param queryParams - 查询参数示例数据
   * @param requestBody - 请求体示例数据
   * @param context - 代码生成上下文
   * @returns 生成的代码字符串
   */
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
    const operationId = operation.operationId || 'api_request';
    
    return `#include <iostream>
#include <string>
#include <boost/beast.hpp>
#include <boost/asio.hpp>
#include <nlohmann/json.hpp>

namespace beast = boost::beast;
namespace http = beast::http;
namespace net = boost::asio;
using tcp = net::ip::tcp;
using json = nlohmann::json;

/*
${operation.summary || operation.description || 'API请求'}
${operation.description ? ` * ${operation.description}` : ''}
*/

int main() {
    try {
        net::io_context ioc;
        tcp::resolver resolver(ioc);
        beast::tcp_stream stream(ioc);
        
        auto const results = resolver.resolve("${baseUrl.replace('https://', '').replace('http://', '')}", "80");
        stream.connect(results);
        
        http::request<http::string_body> req{http::verb::${method.toLowerCase()}, "${path}", 11};
        req.set(http::field::host, "${baseUrl.replace('https://', '').replace('http://', '')}");
        req.set(http::field::user_agent, "Boost.Beast");
        req.set(http::field::content_type, "application/json");
        
        ${this.buildCookiesCode(cookies, 'req')}
        ${this.buildHeadersCode(headers, 'req')}
        ${this.buildRequestBodyCode(method, requestBody, 'req')}
        
        http::write(stream, req);
        
        beast::flat_buffer buffer;
        http::response<http::dynamic_body> res;
        http::read(stream, buffer, res);
        
        if (res.result() != http::status::ok) {
            std::cerr << "HTTP error! status: " << res.result() << std::endl;
            return 1;
        }
        
        std::string response_body = beast::buffers_to_string(res.body().data());
        auto data = json::parse(response_body);
        std::cout << "Response: " << data.dump(4) << std::endl;
        
        beast::error_code ec;
        stream.socket().shutdown(tcp::socket::shutdown_both, ec);
        
    } catch (std::exception const& e) {
        std::cerr << "Error: " << e.what() << std::endl;
        return 1;
    }
    
    return 0;
}`;
  }

  /**
   * 构建cookies代码
   */
  private buildCookiesCode(cookies: ExampleOpenAPIParameter[], reqVar: string): string {
    if (cookies.length === 0) {
      return '';
    }
    
    const cookieEntries = cookies.map(cookie => 
      `"${cookie.name}=${cookie.value}"`
    );
    
    return `${reqVar}.set(http::field::cookie, "${cookieEntries.join('; ')}");`;
  }

  /**
   * 构建请求头代码
   */
  private buildHeadersCode(headers: ExampleOpenAPIParameter[], reqVar: string): string {
    if (headers.length === 0) {
      return '';
    }
    
    const headerEntries = headers.map(header => 
      `${reqVar}.set("${header.name}", "${header.value}");`
    );
    
    return headerEntries.join('\n        ');
  }

  /**
   * 构建请求体代码
   */
  private buildRequestBodyCode(method: HttpMethod, requestBody: any, reqVar: string): string {
    if (!['POST', 'PUT', 'PATCH'].includes(method) || !requestBody) {
      return '';
    }
    
    return `json request_body = ${JSON.stringify(requestBody, null, 8)};\n        ${reqVar}.body() = request_body.dump();\n        ${reqVar}.prepare_payload();`;
  }
}