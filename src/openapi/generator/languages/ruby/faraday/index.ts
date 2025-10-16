import { BaseRequestCodeGenerator } from '@/openapi/generator/generator';
import { Language, HttpMethod, OpenAPIOperation, ExampleOpenAPIParameter, CodeGenerateContext } from '@/types';

/**
 * Ruby Faraday HTTP请求代码生成器
 */
export class FaradayRubyRequestCodeGenerator extends BaseRequestCodeGenerator {
  
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
    return 'faraday';
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
    
    // 构建请求参数
    const requestParams = this.buildRequestParams(method, cookies, headers, queryParams, requestBody);
    
    return `require 'faraday'
require 'json'

# ${operation.summary || operation.description || 'API请求'}
def ${operationId}
  conn = Faraday.new(url: '${baseUrl}') do |f|
    f.request :json
    f.response :json
  end
  
  ${this.buildQueryParamsCode(queryParams)}
  
  response = conn.${method.toLowerCase()}('${path}'${requestParams ? ', ' + requestParams : ''})
  
  if response.success?
    puts "Status: #{response.status}"
    puts "Response: #{response.body}"
    response.body
  else
    puts "Error: #{response.status} - #{response.body}"
    raise "Request failed with status #{response.status}"
  end
end

# 调用示例
${operationId}`;
  }

  /**
   * 构建请求参数
   */
  private buildRequestParams(
    method: HttpMethod,
    cookies: ExampleOpenAPIParameter[],
    headers: ExampleOpenAPIParameter[],
    queryParams: ExampleOpenAPIParameter[],
    requestBody: any
  ): string {
    const params: string[] = [];

    // 添加cookies
    if (cookies.length > 0) {
      const cookiesHash = this.buildCookiesHash(cookies);
      params.push(`cookies: ${cookiesHash}`);
    }

    // 添加请求头
    if (headers.length > 0) {
      const headersHash = this.buildHeadersHash(headers);
      params.push(`headers: ${headersHash}`);
    }

    // 添加查询参数
    if (queryParams.length > 0) {
      const paramsHash = this.buildParamsHash(queryParams);
      params.push(`params: ${paramsHash}`);
    }

    // 添加请求体
    if (['POST', 'PUT', 'PATCH'].includes(method) && requestBody) {
      params.push(`body: ${JSON.stringify(requestBody, null, 2)}`);
    }

    return params.length > 0 ? `{ ${params.join(', ')} }` : '';
  }

  /**
   * 构建cookies哈希
   */
  private buildCookiesHash(cookies: ExampleOpenAPIParameter[]): string {
    const cookieEntries = cookies.map(cookie => 
      `'${cookie.name}' => '${cookie.value}'`
    );
    return `{ ${cookieEntries.join(', ')} }`;
  }

  /**
   * 构建请求头哈希
   */
  private buildHeadersHash(headers: ExampleOpenAPIParameter[]): string {
    const headerEntries = headers.map(header => 
      `'${header.name}' => '${header.value}'`
    );
    return `{ ${headerEntries.join(', ')} }`;
  }

  /**
   * 构建查询参数哈希
   */
  private buildParamsHash(queryParams: ExampleOpenAPIParameter[]): string {
    const paramEntries = queryParams.map(param => 
      `'${param.name}' => '${param.value}'`
    );
    return `{ ${paramEntries.join(', ')} }`;
  }

  /**
   * 构建查询参数代码
   */
  private buildQueryParamsCode(queryParams: ExampleOpenAPIParameter[]): string {
    if (queryParams.length === 0) {
      return '';
    }
    
    const paramEntries = queryParams.map(param => 
      `params[:${param.name}] = '${param.value}'`
    );
    
    return paramEntries.join('\n  ');
  }
}