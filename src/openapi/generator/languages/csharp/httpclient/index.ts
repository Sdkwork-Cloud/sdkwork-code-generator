import { BaseRequestCodeGenerator } from '@/openapi/generator/generator';
import { Language, HttpMethod, OpenAPIOperation, ExampleOpenAPIParameter, CodeGenerateContext } from '@/types';

/**
 * C# HttpClient HTTP请求代码生成器
 */
export class HttpClientCSharpRequestCodeGenerator extends BaseRequestCodeGenerator {
  
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
    return 'httpclient';
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
    // 生成C#类和方法
    const classCode = this.generateCSharpClass(baseUrl, path, method, cookies, headers, queryParams, requestBody, operation);
    
    return classCode;
  }

  /**
   * 生成C#类代码
   */
  private generateCSharpClass(
    baseUrl: string,
    path: string,
    method: HttpMethod,
    cookies: ExampleOpenAPIParameter[],
    headers: ExampleOpenAPIParameter[],
    queryParams: ExampleOpenAPIParameter[],
    requestBody: any,
    operation: OpenAPIOperation
  ): string {
    const operationId = operation.operationId || 'ApiRequest';
    const className = operationId;
    const methodName = operationId;
    const url = `${baseUrl}${path}`;
    
    // 构建查询参数
    const queryParamsCode = this.buildQueryParamsCode(queryParams);
    
    // 构建请求体
    const requestBodyCode = this.buildRequestBodyCode(requestBody, method);
    
    // 构建请求头
    const headersCode = this.buildHeadersCode(headers);
    
    // 构建cookies
    const cookiesCode = this.buildCookiesCode(cookies);
    
    return `using System;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using System.Text.Json;

public class ${className}
{
    private static readonly HttpClient client = new HttpClient();
    
    /**
     * ${operation.summary || operation.description || 'API请求'}
     */
    public static async Task ${methodName}Async()
    {
        // 构建URL
        var url = "${url}";
        ${queryParamsCode}
        
        // 构建请求
        var request = new HttpRequestMessage
        {
            Method = HttpMethod.${method},
            RequestUri = new Uri(url)
        };
        
        // 设置cookies
        ${cookiesCode}
        
        // 设置请求头
        ${headersCode}
        
        // 设置请求体
        ${requestBodyCode}
        
        try
        {
            var response = await client.SendAsync(request);
            response.EnsureSuccessStatusCode();
            
            var responseBody = await response.Content.ReadAsStringAsync();
            Console.WriteLine($"Status: {response.StatusCode}");
            Console.WriteLine($"Response: {responseBody}");
        }
        catch (HttpRequestException e)
        {
            Console.WriteLine($"Error: {e.Message}");
            throw;
        }
    }
    
    public static async Task Main(string[] args)
    {
        await ${methodName}Async();
    }
}`;
  }

  /**
   * 构建查询参数代码
   */
  private buildQueryParamsCode(queryParams: ExampleOpenAPIParameter[]): string {
    if (queryParams.length === 0) {
      return '';
    }
    
    const paramEntries = queryParams.map(param => 
      `url += "${param.name === queryParams[0].name ? '?' : '&'}${param.name}=" + Uri.EscapeDataString("${param.value}");`
    );
    
    return paramEntries.join('\n        ');
  }

  /**
   * 构建请求体代码
   */
  private buildRequestBodyCode(requestBody: any, method: HttpMethod): string {
    if (!['POST', 'PUT', 'PATCH'].includes(method) || !requestBody) {
      return '';
    }
    
    const jsonBody = JSON.stringify(requestBody, null, 2);
    return `var json = JsonSerializer.Serialize(${jsonBody});
        request.Content = new StringContent(json, Encoding.UTF8, "application/json");`;
  }

  /**
   * 构建请求头代码
   */
  private buildHeadersCode(headers: ExampleOpenAPIParameter[]): string {
    if (headers.length === 0) {
      return '';
    }
    
    const headerEntries = headers.map(header => 
      `request.Headers.Add("${header.name}", "${header.value}");`
    );
    
    return headerEntries.join('\n        ');
  }

  /**
   * 构建cookies代码
   */
  private buildCookiesCode(cookies: ExampleOpenAPIParameter[]): string {
    if (cookies.length === 0) {
      return '';
    }
    
    const cookieEntries = cookies.map(cookie => 
      `request.Headers.Add("Cookie", "${cookie.name}=${cookie.value}");`
    );
    
    return cookieEntries.join('\n        ');
  }
}