import { BaseRequestCodeGenerator } from '@/openapi/generator/generator';
import { Language, HttpMethod, OpenAPIOperation, ExampleOpenAPIParameter, CodeGenerateContext } from '@/types';

/**
 * Swift URLSession HTTP请求代码生成器
 */
export class UrlsessionSwiftRequestCodeGenerator extends BaseRequestCodeGenerator {
  
  /**
   * 获取目标编程语言
   * @returns 编程语言标识符
   */
  getLanguage(): Language {
    return 'swift';
  }

  /**
   * 获取使用的HTTP库名称
   * @returns HTTP库名称
   */
  getLibrary(): string {
    return 'urlsession';
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
    const operationId = operation.operationId || 'apiRequest';
    const url = `${baseUrl}${path}`;
    
    return `import Foundation

/*
${operation.summary || operation.description || 'API请求'}
${operation.description ? ` * ${operation.description}` : ''}
*/

func ${operationId}() {
    let urlString = "${url}"
    ${this.buildQueryParamsCode(queryParams)}
    
    guard let url = URL(string: urlString) else {
        fatalError("Invalid URL")
    }
    
    var request = URLRequest(url: url)
    request.httpMethod = "${method.toUpperCase()}"
    
    ${this.buildCookiesCode(cookies, 'request')}
    ${this.buildHeadersCode(headers, 'request')}
    ${this.buildRequestBodyCode(method, requestBody, 'request')}
    
    let task = URLSession.shared.dataTask(with: request) { data, response, error in
        if let error = error {
            print("Error: \\(error)")
            return
        }
        
        guard let httpResponse = response as? HTTPURLResponse else {
            print("Invalid response")
            return
        }
        
        if httpResponse.statusCode != 200 {
            print("HTTP error! status: \\(httpResponse.statusCode)")
            return
        }
        
        guard let data = data else {
            print("No data received")
            return
        }
        
        do {
            let jsonObject = try JSONSerialization.jsonObject(with: data)
            print("Response: \\(jsonObject)")
        } catch {
            print("JSON parsing error: \\(error)")
        }
    }
    
    task.resume()
}

// 调用示例
${operationId}()`;
  }

  /**
   * 构建cookies代码
   */
  private buildCookiesCode(cookies: ExampleOpenAPIParameter[], requestVar: string): string {
    if (cookies.length === 0) {
      return '';
    }
    
    const cookieEntries = cookies.map(cookie => 
      `"${cookie.name}=${cookie.value}"`
    );
    
    return `${requestVar}.setValue("${cookieEntries.join('; ')}", forHTTPHeaderField: "Cookie")`;
  }

  /**
   * 构建查询参数代码
   */
  private buildQueryParamsCode(queryParams: ExampleOpenAPIParameter[]): string {
    if (queryParams.length === 0) {
      return '';
    }
    
    const paramEntries = queryParams.map(param => 
      `urlString += (urlString.contains("?") ? "&" : "?") + "${param.name}=" + "${param.value}".addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed)!`
    );
    
    return paramEntries.join('\n    ');
  }

  /**
   * 构建请求头代码
   */
  private buildHeadersCode(headers: ExampleOpenAPIParameter[], requestVar: string): string {
    if (headers.length === 0) {
      return `${requestVar}.setValue("application/json", forHTTPHeaderField: "Content-Type")`;
    }
    
    const headerEntries = headers.map(header => 
      `${requestVar}.setValue("${header.value}", forHTTPHeaderField: "${header.name}")`
    );
    
    return headerEntries.join('\n    ');
  }

  /**
   * 构建请求体代码
   */
  private buildRequestBodyCode(method: HttpMethod, requestBody: any, requestVar: string): string {
    if (!['POST', 'PUT', 'PATCH'].includes(method) || !requestBody) {
      return '';
    }
    
    return `let requestData = try? JSONSerialization.data(withJSONObject: ${JSON.stringify(requestBody, null, 8)})\n    ${requestVar}.httpBody = requestData`;
  }
}