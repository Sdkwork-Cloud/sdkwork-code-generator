import { BaseRequestCodeGenerator } from '@/openapi/generator/generator';
import { Language, HttpMethod, OpenAPIOperation, ExampleOpenAPIParameter, CodeGenerateContext } from '@/types';

/**
 * C# RestSharp HTTP请求代码生成器
 */
export class RestsharpCsharpRequestCodeGenerator extends BaseRequestCodeGenerator {
  
  /**
   * 获取目标编程语言
   * @returns 编程语言标识符
   */
  getLanguage(): Language {
    return 'csharp';
  }

  /**
   * 获取使用的HTTP库名称
   * @returns HTTP库名称
   */
  getLibrary(): string {
    return 'restsharp';
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
    const operationId = operation.operationId || 'ApiRequest';
    const className = this.toPascalCase(operationId);
    const url = `${baseUrl}${path}`;
    
    return `using System;
using RestSharp;
using Newtonsoft.Json;

/**
 * ${operation.summary || operation.description || 'API请求'}
 * ${operation.description ? ` * ${operation.description}` : ''}
 */
class ${className}
{
    static void Main(string[] args)
    {
        ${operationId}();
    }
    
    static void ${operationId}()
    {
        var client = new RestClient("${baseUrl}");
        var request = new RestRequest("${path}", Method.${method.toUpperCase()});
        
        ${this.buildCookiesCode(cookies, 'request')}
        ${this.buildQueryParamsCode(queryParams, 'request')}
        ${this.buildHeadersCode(headers, 'request')}
        ${this.buildRequestBodyCode(method, requestBody, 'request')}
        
        var response = client.Execute(request);
        
        if (!response.IsSuccessful)
        {
            throw new Exception($"HTTP error! status: {response.StatusCode}");
        }
        
        var data = JsonConvert.DeserializeObject<object>(response.Content);
        Console.WriteLine("Response: " + JsonConvert.SerializeObject(data, Formatting.Indented));
    }
}`;
  }

  /**
   * 构建cookies代码
   */
  private buildCookiesCode(cookies: ExampleOpenAPIParameter[], requestVar: string): string {
    if (cookies.length === 0) {
      return '';
    }
    
    const cookieEntries = cookies.map(cookie => 
      `${requestVar}.AddCookie("${cookie.name}", "${cookie.value}");`
    );
    
    return cookieEntries.join('\n        ');
  }

  /**
   * 构建查询参数代码
   */
  private buildQueryParamsCode(queryParams: ExampleOpenAPIParameter[], requestVar: string): string {
    if (queryParams.length === 0) {
      return '';
    }
    
    const paramEntries = queryParams.map(param => 
      `${requestVar}.AddQueryParameter("${param.name}", "${param.value}");`
    );
    
    return paramEntries.join('\n        ');
  }

  /**
   * 构建请求头代码
   */
  private buildHeadersCode(headers: ExampleOpenAPIParameter[], requestVar: string): string {
    if (headers.length === 0) {
      return `${requestVar}.AddHeader("Content-Type", "application/json");`;
    }
    
    const headerEntries = headers.map(header => 
      `${requestVar}.AddHeader("${header.name}", "${header.value}");`
    );
    
    return headerEntries.join('\n        ');
  }

  /**
   * 构建请求体代码
   */
  private buildRequestBodyCode(method: HttpMethod, requestBody: any, requestVar: string): string {
    if (!['POST', 'PUT', 'PATCH'].includes(method) || !requestBody) {
      return '';
    }
    
    return `${requestVar}.AddJsonBody(${JSON.stringify(requestBody, null, 12)});`;
  }

  /**
   * 转换为帕斯卡命名
   */
  private toPascalCase(str: string): string {
    const words = str.split(/[_\-\s]/);
    return words.map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join('');
  }
}