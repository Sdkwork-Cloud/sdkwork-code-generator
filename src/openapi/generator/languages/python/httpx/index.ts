import { BaseRequestCodeGenerator } from '@/openapi/generator/generator';
import { Language, HttpMethod, OpenAPIOperation, ExampleOpenAPIParameter, CodeGenerateContext } from '@/types';

/**
 * Python httpx HTTP请求代码生成器
 */
export class HttpxPythonRequestCodeGenerator extends BaseRequestCodeGenerator {
  
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
    return 'httpx';
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
    
    return `import httpx
import json

"""
${operation.summary || operation.description || 'API请求'}
${operation.description ? ` * ${operation.description}` : ''}
"""

async def ${operationId}():
    url = "${url}"
    ${this.buildQueryParamsCode(queryParams)}
    
    headers = {
        ${this.buildHeadersCode(headers)}
    }
    
    ${this.buildCookiesCode(cookies)}
    ${this.buildRequestBodyCode(method, requestBody)}
    
    async with httpx.AsyncClient() as client:
        response = await client.${method.toLowerCase()}(
            url,
            headers=headers,
            ${this.buildCookiesParamCode(cookies)}
            ${this.buildRequestDataCode(method, requestBody)}
        )
        
        if response.status_code != 200:
            raise Exception(f"HTTP error! status: {response.status_code}")
        
        data = response.json()
        print('Response:', data)
        return data

# 调用示例
if __name__ == "__main__":
    import asyncio
    asyncio.run(${operationId}())`;
  }

  /**
   * 构建cookies代码
   */
  private buildCookiesCode(cookies: ExampleOpenAPIParameter[]): string {
    if (cookies.length === 0) {
      return '';
    }
    
    const cookieEntries = cookies.map(cookie => 
      `'${cookie.name}': '${cookie.value}'`
    );
    
    return `cookies = {\n    ${cookieEntries.join(',\n    ')}\n}`;
  }

  /**
   * 构建cookies参数代码
   */
  private buildCookiesParamCode(cookies: ExampleOpenAPIParameter[]): string {
    if (cookies.length === 0) {
      return '';
    }
    
    return 'cookies=cookies,';
  }

  /**
   * 构建查询参数代码
   */
  private buildQueryParamsCode(queryParams: ExampleOpenAPIParameter[]): string {
    if (queryParams.length === 0) {
      return '';
    }
    
    const paramEntries = queryParams.map(param => 
      `url += (url + '?' if '?' not in url else '&') + '${param.name}=' + '${param.value}'`
    );
    
    return paramEntries.join('\n    ');
  }

  /**
   * 构建请求头代码
   */
  private buildHeadersCode(headers: ExampleOpenAPIParameter[]): string {
    if (headers.length === 0) {
      return `'Content-Type': 'application/json'`;
    }
    
    const headerEntries = headers.map(header => 
      `'${header.name}': '${header.value}'`
    );
    
    return headerEntries.join(',\n        ');
  }

  /**
   * 构建请求体代码
   */
  private buildRequestBodyCode(method: HttpMethod, requestBody: any): string {
    if (!['POST', 'PUT', 'PATCH'].includes(method) || !requestBody) {
      return '';
    }
    
    return `data = ${JSON.stringify(requestBody, null, 8)}`;
  }

  /**
   * 构建请求数据代码
   */
  private buildRequestDataCode(method: HttpMethod, requestBody: any): string {
    if (!['POST', 'PUT', 'PATCH'].includes(method) || !requestBody) {
      return '';
    }
    
    return 'json=data';
  }
}