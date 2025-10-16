import { BaseRequestCodeGenerator } from '@/openapi/generator/generator';
import { Language, HttpMethod, OpenAPIOperation, ExampleOpenAPIParameter, CodeGenerateContext } from '@/types';

/**
 * Go net/http HTTP请求代码生成器
 */
export class NetHttpGoRequestCodeGenerator extends BaseRequestCodeGenerator {
  
  /**
   * 获取目标编程语言
   * @returns 编程语言标识符
   */
  getLanguage(): Language {
    return 'go';
  }

  /**
   * 获取使用的HTTP库名称
   * @returns HTTP库名称
   */
  getLibrary(): string {
    return 'net/http';
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
    // 生成Go包导入和函数定义
    const packageCode = this.generatePackageCode();
    const functionCode = this.generateFunctionCode(baseUrl, path, method, cookies, headers, queryParams, requestBody, operation);
    
    return `${packageCode}

${functionCode}`;
  }

  /**
   * 生成Go包导入代码
   */
  private generatePackageCode(): string {
    return `package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
    "net/url"
    "strings"
)`;
  }

  /**
   * 生成Go函数代码
   */
  private generateFunctionCode(
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
    const url = `${baseUrl}${path}`;
    
    // 构建查询参数
    const queryParamsCode = this.buildQueryParamsCode(queryParams);
    
    // 构建请求体
    const requestBodyCode = this.buildRequestBodyCode(requestBody, method);
    
    // 构建请求头
    const headersCode = this.buildHeadersCode(headers);
    
    // 构建cookies
    const cookiesCode = this.buildCookiesCode(cookies);
    
    return `// ${operation.summary || operation.description || 'API请求'}
func ${operationId}() error {
    // 构建URL
    baseURL := "${url}"
    ${queryParamsCode}
    
    // 创建请求
    ${requestBodyCode}
    
    // 设置cookies
    ${cookiesCode}
    
    // 设置请求头
    ${headersCode}
    
    // 发送请求
    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        return fmt.Errorf("request failed: %v", err)
    }
    defer resp.Body.Close()
    
    // 读取响应
    body, err := io.ReadAll(resp.Body)
    if err != nil {
        return fmt.Errorf("reading response failed: %v", err)
    }
    
    fmt.Printf("Status: %s\\n", resp.Status)
    fmt.Printf("Response: %s\\n", string(body))
    
    return nil
}

func main() {
    if err := ${operationId}(); err != nil {
        fmt.Printf("Error: %v\\n", err)
    }
}`;
  }

  /**
   * 构建查询参数代码
   */
  private buildQueryParamsCode(queryParams: ExampleOpenAPIParameter[]): string {
    if (queryParams.length === 0) {
      return 'urlStr := baseURL';
    }
    
    const paramEntries = queryParams.map(param => 
      `q.Set("${param.name}", "${param.value}")`
    );
    
    return `q := url.Values{}
${paramEntries.join('\n')}
urlStr := baseURL + "?" + q.Encode()`;
  }

  /**
   * 构建请求体代码
   */
  private buildRequestBodyCode(requestBody: any, method: HttpMethod): string {
    if (!['POST', 'PUT', 'PATCH'].includes(method) || !requestBody) {
      return `req, err := http.NewRequest("${method}", urlStr, nil)
    if err != nil {
        return fmt.Errorf("creating request failed: %v", err)
    }`;
    }
    
    const jsonBody = JSON.stringify(requestBody, null, 2);
    return `jsonData, err := json.Marshal(${jsonBody})
    if err != nil {
        return fmt.Errorf("marshaling JSON failed: %v", err)
    }
    
    req, err := http.NewRequest("${method}", urlStr, bytes.NewBuffer(jsonData))
    if err != nil {
        return fmt.Errorf("creating request failed: %v", err)
    }`;
  }

  /**
   * 构建请求头代码
   */
  private buildHeadersCode(headers: ExampleOpenAPIParameter[]): string {
    if (headers.length === 0) {
      return '';
    }
    
    const headerEntries = headers.map(header => 
      `req.Header.Set("${header.name}", "${header.value}")`
    );
    
    return headerEntries.join('\n    ');
  }

  /**
   * 构建cookies代码
   */
  private buildCookiesCode(cookies: ExampleOpenAPIParameter[]): string {
    if (cookies.length === 0) {
      return '';
    }
    
    const cookieEntries = cookies.map(cookie => 
      `req.Header.Set("Cookie", "${cookie.name}=${cookie.value}")`
    );
    
    return cookieEntries.join('\n    ');
  }
}