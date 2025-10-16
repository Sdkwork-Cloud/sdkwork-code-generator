import { BaseRequestCodeGenerator } from '@/openapi/generator/generator';
import { Language, HttpMethod, OpenAPIOperation, ExampleOpenAPIParameter, CodeGenerateContext } from '@/types';

/**
 * C# Refit HTTP请求代码生成器
 */
export class RefitCsharpRequestCodeGenerator extends BaseRequestCodeGenerator {
  
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
    return 'refit';
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
using System.Threading.Tasks;
using Refit;
using Newtonsoft.Json;

/**
 * ${operation.summary || operation.description || 'API请求'}
 * ${operation.description ? ` * ${operation.description}` : ''}
 */

public interface IApiService
{
    [${method.toUpperCase()}("${path}")]
    Task<object> ${operationId}Async(
        ${this.buildRefitParameters(cookies, queryParams, headers, requestBody)}
    );
}

class ${className}
{
    static async Task Main(string[] args)
    {
        await ${operationId}Async();
    }
    
    static async Task ${operationId}Async()
    {
        var apiService = RestService.For<IApiService>("${baseUrl}");
        
        var result = await apiService.${operationId}Async(
            ${this.buildRefitArguments(cookies, queryParams, headers, requestBody)}
        );
        
        Console.WriteLine("Response: " + JsonConvert.SerializeObject(result, Formatting.Indented));
    }
}`;
  }

  /**
   * 构建Refit参数
   */
  private buildRefitParameters(
    cookies: ExampleOpenAPIParameter[],
    queryParams: ExampleOpenAPIParameter[], 
    headers: ExampleOpenAPIParameter[], 
    requestBody: any
  ): string {
    const parameters: string[] = [];
    
    if (cookies.length > 0) {
      cookies.forEach(cookie => {
        parameters.push(`[Header("Cookie")] string ${cookie.name}Cookie`);
      });
    }
    
    if (queryParams.length > 0) {
      queryParams.forEach(param => {
        parameters.push(`[Query("${param.name}")] string ${param.name}`);
      });
    }
    
    if (headers.length > 0) {
      headers.forEach(header => {
        parameters.push(`[Header("${header.name}")] string ${header.name}`);
      });
    }
    
    if (requestBody) {
      parameters.push(`[Body] object body`);
    }
    
    return parameters.join(',\n        ');
  }

  /**
   * 构建Refit参数值
   */
  private buildRefitArguments(
    cookies: ExampleOpenAPIParameter[],
    queryParams: ExampleOpenAPIParameter[], 
    headers: ExampleOpenAPIParameter[], 
    requestBody: any
  ): string {
    const args: string[] = [];
    
    if (cookies.length > 0) {
      cookies.forEach(cookie => {
        args.push(`"${cookie.name}=${cookie.value}"`);
      });
    }
    
    if (queryParams.length > 0) {
      queryParams.forEach(param => {
        args.push(`"${param.value}"`);
      });
    }
    
    if (headers.length > 0) {
      headers.forEach(header => {
        args.push(`"${header.value}"`);
      });
    }
    
    if (requestBody) {
      args.push(JSON.stringify(requestBody, null, 12));
    }
    
    return args.join(',\n            ');
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