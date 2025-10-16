import { BaseRequestCodeGenerator } from '@/openapi/generator/generator';
import { Language, HttpMethod, OpenAPIOperation, ExampleOpenAPIParameter, CodeGenerateContext } from '@/types';

/**
 * C++ cpp-httplib HTTP请求代码生成器
 */
export class CppHttplibCppRequestCodeGenerator extends BaseRequestCodeGenerator {
  
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
    return 'cpp-httplib';
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
    
    return `#include <iostream>
#include <string>
#include <httplib.h>
#include <nlohmann/json.hpp>

using json = nlohmann::json;

/*
${operation.summary || operation.description || 'API请求'}
${operation.description ? ` * ${operation.description}` : ''}
*/

int main() {
    std::string url = "${url}";
    ${this.buildQueryParamsCode(queryParams)}
    
    httplib::Client cli("${baseUrl}");
    
    ${this.buildCookiesCode(cookies)}
    ${this.buildHeadersCode(headers)}
    ${this.buildRequestBodyCode(method, requestBody)}
    
    auto response = cli.${method.toLowerCase()}("${path}");
    
    if (response->status != 200) {
        std::cerr << "HTTP error! status: " << response->status << std::endl;
        return 1;
    }
    
    auto data = json::parse(response->body);
    std::cout << "Response: " << data.dump(4) << std::endl;
    
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
    
    return `httplib::Cookies cookies = {\n        ${cookieEntries.join(',\n        ')}\n    };`;
  }

  /**
   * 构建查询参数代码
   */
  private buildQueryParamsCode(queryParams: ExampleOpenAPIParameter[]): string {
    if (queryParams.length === 0) {
      return '';
    }
    
    const paramEntries = queryParams.map(param => 
      `url += (url.find('?') != std::string::npos ? "&" : "?") + "${param.name}=" + "${param.value}";`
    );
    
    return paramEntries.join('\n    ');
  }

  /**
   * 构建请求头代码
   */
  private buildHeadersCode(headers: ExampleOpenAPIParameter[]): string {
    if (headers.length === 0) {
      return 'httplib::Headers headers = {{"Content-Type", "application/json"}};';
    }
    
    const headerEntries = headers.map(header => 
      `{"${header.name}", "${header.value}"}`
    );
    
    return `httplib::Headers headers = {\n        ${headerEntries.join(',\n        ')}\n    };`;
  }

  /**
   * 构建请求体代码
   */
  private buildRequestBodyCode(method: HttpMethod, requestBody: any): string {
    if (!['POST', 'PUT', 'PATCH'].includes(method) || !requestBody) {
      return '';
    }
    
    return `json request_body = ${JSON.stringify(requestBody, null, 8)};`;
  }
}