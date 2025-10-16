import { BaseRequestCodeGenerator } from '@/openapi/generator/generator';
import { Language, HttpMethod, OpenAPIOperation, ExampleOpenAPIParameter, CodeGenerateContext } from '@/types';

/**
 * Ruby HTTParty HTTP请求代码生成器
 */
export class HttpartyRubyRequestCodeGenerator extends BaseRequestCodeGenerator {
  
  /**
   * 获取目标编程语言
   * @returns 编程语言标识符
   */
  getLanguage(): Language {
    return 'ruby';
  }

  /**
   * 获取使用的HTTP库名称
   * @returns HTTP库名称
   */
  getLibrary(): string {
    return 'httparty';
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
    
    return `require 'httparty'
require 'json'

=begin
${operation.summary || operation.description || 'API请求'}
${operation.description ? ` * ${operation.description}` : ''}
=end

def ${operationId}
  url = "${url}"
  ${this.buildQueryParamsCode(queryParams)}
  
  options = {
    ${this.buildCookiesCode(cookies)}
    ${this.buildHeadersCode(headers)}
    ${this.buildRequestBodyCode(method, requestBody)}
  }
  
  response = HTTParty.${method.toLowerCase()}(url, options)
  
  if response.code != 200
    raise "HTTP error! status: #{response.code}"
  end
  
  data = JSON.parse(response.body)
  puts "Response: #{JSON.pretty_generate(data)}"
  data
end

# 调用示例
${operationId}()`;
  }

  /**
   * 构建cookies代码
   */
  private buildCookiesCode(cookies: ExampleOpenAPIParameter[]): string {
    if (cookies.length === 0) {
      return '';
    }
    
    const cookieEntries = cookies.map(cookie => 
      `'${cookie.name}' => '${cookie.value}'`
    );
    
    return `cookies: {\n      ${cookieEntries.join(',\n      ')}\n    },`;
  }

  /**
   * 构建查询参数代码
   */
  private buildQueryParamsCode(queryParams: ExampleOpenAPIParameter[]): string {
    if (queryParams.length === 0) {
      return '';
    }
    
    const paramEntries = queryParams.map(param => 
      `url += (url.include?('?') ? '&' : '?') + '${param.name}=' + URI.encode_www_form_component('${param.value}')`
    );
    
    return paramEntries.join('\n  ');
  }

  /**
   * 构建请求头代码
   */
  private buildHeadersCode(headers: ExampleOpenAPIParameter[]): string {
    if (headers.length === 0) {
      return `headers: {\n      'Content-Type' => 'application/json'\n    },`;
    }
    
    const headerEntries = headers.map(header => 
      `'${header.name}' => '${header.value}'`
    );
    
    return `headers: {\n      ${headerEntries.join(',\n      ')}\n    },`;
  }

  /**
   * 构建请求体代码
   */
  private buildRequestBodyCode(method: HttpMethod, requestBody: any): string {
    if (!['POST', 'PUT', 'PATCH'].includes(method) || !requestBody) {
      return '';
    }
    
    return `body: ${JSON.stringify(requestBody, null, 6)}.to_json,`;
  }
}