import { BaseRequestCodeGenerator } from '@/openapi/generator/generator';
import { Language, HttpMethod, OpenAPIOperation, ExampleOpenAPIParameter, CodeGenerateContext } from '@/types';

/**
 * Java OkHttp HTTP请求代码生成器
 */
export class OkHttpJavaRequestCodeGenerator extends BaseRequestCodeGenerator {
  
  /**
   * 获取目标编程语言
   * @returns 编程语言标识符
   */
  getLanguage(): Language {
    return 'java';
  }

  /**
   * 获取使用的HTTP库名称
   * @returns HTTP库名称
   */
  getLibrary(): string {
    return 'okhttp';
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
    // 生成Java类和方法
    const classCode = this.generateJavaClass(baseUrl, path, method, cookies, headers, queryParams, requestBody, operation);
    
    return classCode;
  }

  /**
   * 生成Java类代码
   */
  private generateJavaClass(
    baseUrl: string,
    path: string,
    method: HttpMethod,
    cookies: ExampleOpenAPIParameter[],
    headers: ExampleOpenAPIParameter[],
    queryParams: ExampleOpenAPIParameter[],
    requestBody: any,
    operation: OpenAPIOperation
  ): string {
    const operationId = operation.operationId || 'apiRequest';
    const className = this.toCamelCase(operationId, true);
    const methodName = this.toCamelCase(operationId, false);
    const url = `${baseUrl}${path}`;
    
    // 构建查询参数
    const queryParamsCode = this.buildQueryParamsCode(queryParams);
    
    // 构建请求体
    const requestBodyCode = this.buildRequestBodyCode(requestBody, method);
    
    // 构建请求头
    const headersCode = this.buildHeadersCode(headers);
    
    // 构建cookies
    const cookiesCode = this.buildCookiesCode(cookies);
    
    return `import okhttp3.*;

public class ${className} {
    
    private static final OkHttpClient client = new OkHttpClient();
    
    /**
     * ${operation.summary || operation.description || 'API请求'}
     */
    public static void ${methodName}() throws Exception {
        // 构建URL
        HttpUrl.Builder urlBuilder = HttpUrl.parse("${url}").newBuilder();
        ${queryParamsCode}
        
        // 构建请求
        Request.Builder requestBuilder = new Request.Builder()
            .url(urlBuilder.build())
            .${method.toLowerCase()}(${requestBodyCode});
        
        // 设置cookies
        ${cookiesCode}
        
        // 设置请求头
        ${headersCode}
        
        Request request = requestBuilder.build();
        
        try (Response response = client.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                throw new RuntimeException("Unexpected code " + response);
            }
            
            System.out.println("Status: " + response.code());
            System.out.println("Response: " + response.body().string());
        }
    }
    
    public static void main(String[] args) {
        try {
            ${methodName}();
        } catch (Exception e) {
            e.printStackTrace();
        }
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
      `urlBuilder.addQueryParameter("${param.name}", "${param.value}");`
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
    return `RequestBody.create(
            MediaType.parse("application/json"), 
            "${jsonBody.replace(/"/g, '\\"')}")`;
  }

  /**
   * 构建请求头代码
   */
  private buildHeadersCode(headers: ExampleOpenAPIParameter[]): string {
    if (headers.length === 0) {
      return '';
    }
    
    const headerEntries = headers.map(header => 
      `requestBuilder.addHeader("${header.name}", "${header.value}");`
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
      `requestBuilder.addHeader("Cookie", "${cookie.name}=${cookie.value}");`
    );
    
    return cookieEntries.join('\n        ');
  }

  /**
   * 转换为驼峰命名
   */
  private toCamelCase(str: string, firstUpper: boolean): string {
    const words = str.split(/[_\-\s]/);
    return words.map((word, index) => {
      if (index === 0 && !firstUpper) {
        return word.toLowerCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }).join('');
  }
}