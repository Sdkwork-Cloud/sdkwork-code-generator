import { BaseRequestCodeGenerator } from '@/openapi/generator/generator';
import { Language, HttpMethod, OpenAPIOperation, ExampleOpenAPIParameter, CodeGenerateContext } from '@/types';

/**
 * Python Requests HTTP请求代码生成器
 */
export class RequestsPythonRequestCodeGenerator extends BaseRequestCodeGenerator {
  
  /**
   * 获取目标编程语言
   * @returns 编程语言标识符
   */
  getLanguage(): Language {
    return 'python';
  }

  /**
   * 获取使用的HTTP库名称
   * @returns HTTP库名称
   */
  getLibrary(): string {
    return 'requests';
  }

  /**
   * 生成具体的HTTP请求代码
   * @param path - 完整的请求Path
   * @param method - 请求方法
   * @param baseUrl - baseUrl
   * @param operation - OpenAPI操作定义
   * @param pathVariables - 路径参数示例数据
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
    // 构建请求参数
    const requestParams = this.buildRequestParams(method, cookies, headers, queryParams, requestBody);
    
    // 生成完整的Python请求代码
    return this.generatePythonRequestCode(baseUrl, path, requestParams, operation, method);
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
      const cookiesDict = this.buildCookiesDict(cookies);
      params.push(`cookies=${cookiesDict}`);
    }

    // 添加请求头
    if (headers.length > 0) {
      const headersDict = this.buildHeadersDict(headers);
      params.push(`headers=${headersDict}`);
    }

    // 添加查询参数
    if (queryParams.length > 0) {
      const paramsDict = this.buildParamsDict(queryParams);
      params.push(`params=${paramsDict}`);
    }

    // 添加请求体（对于POST、PUT、PATCH方法）
    if (['POST', 'PUT', 'PATCH'].includes(method) && requestBody) {
      params.push(`json=${JSON.stringify(requestBody, null, 2)}`);
    }

    return params.join(', ');
  }

  /**
   * 构建请求头字典
   */
  private buildHeadersDict(headers: ExampleOpenAPIParameter[]): string {
    const headerEntries = headers.map(header => 
      `'${header.name}': '${header.value}'`
    );
    return `{${headerEntries.join(', ')}}`;
  }

  /**
   * 构建查询参数字典
   */
  private buildParamsDict(queryParams: ExampleOpenAPIParameter[]): string {
    const paramEntries = queryParams.map(param => 
      `'${param.name}': '${param.value}'`
    );
    return `{${paramEntries.join(', ')}}`;
  }

  /**
   * 构建cookies字典
   */
  private buildCookiesDict(cookies: ExampleOpenAPIParameter[]): string {
    const cookieEntries = cookies.map(cookie => 
      `'${cookie.name}': '${cookie.value}'`
    );
    return `{${cookieEntries.join(', ')}}`;
  }

  /**
   * 生成完整的Python请求代码
   */
  private generatePythonRequestCode(
    baseUrl: string,
    path: string,
    requestParams: string,
    operation: OpenAPIOperation,
    method: HttpMethod
  ): string {
    const url = `${baseUrl}${path}`;
    const operationId = operation.operationId || 'api_request';
    const methodLower = method.toLowerCase();
    
    return `import requests
import json

def ${operationId}():
    \"\"\"
    ${operation.summary || operation.description || 'API请求'}
    ${operation.description ? '    ' + operation.description : ''}
    \"\"\"
    url = "${url}"
    
    try:
        response = requests.${methodLower}(url${requestParams ? ', ' + requestParams : ''})
        response.raise_for_status()
        
        print("Status Code: " + str(response.status_code))
        print("Response: " + response.text)
        
        return response.json()
    except requests.exceptions.RequestException as e:
        print("Error: " + str(e))
        raise e

if __name__ == "__main__":
    result = ${operationId}()
    print(result)`;
  }
}