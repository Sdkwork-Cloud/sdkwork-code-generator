import { BaseRequestCodeGenerator } from '@/openapi/generator/generator';
import { Language, HttpMethod, OpenAPIOperation, ExampleOpenAPIParameter, CodeGenerateContext } from '@/types';

/**
 * C++ cpprest HTTP请求代码生成器
 */
export class CpprestCppRequestCodeGenerator extends BaseRequestCodeGenerator {
  
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
    return 'cpprest';
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
    const url = `${baseUrl}${path}`;
    
    return `#include <cpprest/http_client.h>
#include <cpprest/json.h>
#include <iostream>

using namespace web;
using namespace web::http;
using namespace web::http::client;

// ${operation.summary || operation.description || 'API请求'}
void ${operationId}() {
    http_client client(U("${baseUrl}"));
    
    // 构建URI
    uri_builder builder(U("${path}"));
    ${this.buildQueryParamsCode(queryParams)}
    
    // 构建请求
    http_request request(methods::${method});
    request.set_request_uri(builder.to_string());
    
    // 设置cookies
    ${this.buildCookiesCode(cookies)}
    
    // 设置请求头
    ${this.buildHeadersCode(headers)}
    
    // 设置请求体
    ${this.buildRequestBodyCode(requestBody, method)}
    
    // 发送请求
    client.request(request).then([](http_response response) {
        std::cout << "Status: " << response.status_code() << std::endl;
        return response.extract_string();
    }).then([](std::string body) {
        std::cout << "Response: " << body << std::endl;
    }).wait();
}

int main() {
    ${operationId}();
    return 0;
}`;
  }

  /**
   * 构建cookies代码
   */
  private buildCookiesCode(cookies: ExampleOpenAPIParameter[]): string {
    if (cookies.length === 0) {
      return '';
    }
    
    const cookieEntries = cookies.map(cookie => 
      `"${cookie.name}=${cookie.value}"`
    );
    
    return `request.headers().add(U("Cookie"), U("${cookieEntries.join('; ')}"));`;
  }

  /**
   * 构建查询参数代码
   */
  private buildQueryParamsCode(queryParams: ExampleOpenAPIParameter[]): string {
    if (queryParams.length === 0) {
      return '';
    }
    
    const paramEntries = queryParams.map(param => 
      `builder.append_query(U("${param.name}"), U("${param.value}"));`
    );
    
    return paramEntries.join('\n    ');
  }

  /**
   * 构建请求头代码
   */
  private buildHeadersCode(headers: ExampleOpenAPIParameter[]): string {
    if (headers.length === 0) {
      return '';
    }
    
    const headerEntries = headers.map(header => 
      `request.headers().add(U("${header.name}"), U("${header.value}"));`
    );
    
    return headerEntries.join('\n    ');
  }

  /**
   * 构建请求体代码
   */
  private buildRequestBodyCode(requestBody: any, method: HttpMethod): string {
    if (!['POST', 'PUT', 'PATCH'].includes(method) || !requestBody) {
      return '';
    }
    
    const jsonBody = JSON.stringify(requestBody, null, 2);
    return `json::value body = json::value::parse(U(R"(${jsonBody})"));
    request.set_body(body);`;
  }
}