import { BaseRequestCodeGenerator } from '@/openapi/generator/generator';
import { Language, HttpMethod, OpenAPIOperation, ExampleOpenAPIParameter, CodeGenerateContext } from '@/types';

/**
 * Go resty HTTP请求代码生成器
 */
export class RestyGoRequestCodeGenerator extends BaseRequestCodeGenerator {
  
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
    return 'resty';
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
    
    return `package main

import (
    "encoding/json"
    "fmt"
    "log"
    "github.com/go-resty/resty/v2"
)

/*
${operation.summary || operation.description || 'API请求'}
${operation.description ? ` * ${operation.description}` : ''}
*/

func ${operationId}() (map[string]interface{}, error) {
    client := resty.New()
    url := "${url}"
    
    ${this.buildQueryParamsCode(queryParams)}
    
    req := client.R()
    ${this.buildCookiesCode(cookies, 'req')}
    ${this.buildHeadersCode(headers, 'req')}
    ${this.buildRequestBodyCode(method, requestBody, 'req')}
    
    resp, err := req.${method.toUpperCase()}("${url}")
    if err != nil {
        return nil, fmt.Errorf("HTTP request failed: %v", err)
    }
    
    if resp.StatusCode() != 200 {
        return nil, fmt.Errorf("HTTP error! status: %d", resp.StatusCode())
    }
    
    var data map[string]interface{}
    err = json.Unmarshal(resp.Body(), &data)
    if err != nil {
        return nil, fmt.Errorf("JSON unmarshal failed: %v", err)
    }
    
    fmt.Println("Response:", data)
    return data, nil
}

func main() {
    result, err := ${operationId}()
    if err != nil {
        log.Fatal(err)
    }
    fmt.Println("Success:", result)
}`;
  }

  /**
   * 构建cookies代码
   */
  private buildCookiesCode(cookies: ExampleOpenAPIParameter[], reqVar: string): string {
    if (cookies.length === 0) {
      return '';
    }
    
    const cookieEntries = cookies.map(cookie => 
      `"${cookie.name}=${cookie.value}"`
    );
    
    return `${reqVar}.SetHeader("Cookie", "${cookieEntries.join('; ')}")`;
  }

  /**
   * 构建查询参数代码
   */
  private buildQueryParamsCode(queryParams: ExampleOpenAPIParameter[]): string {
    if (queryParams.length === 0) {
      return '';
    }
    
    const paramEntries = queryParams.map(param => 
      `req.SetQueryParam("${param.name}", "${param.value}")`
    );
    
    return paramEntries.join('\n    ');
  }

  /**
   * 构建请求头代码
   */
  private buildHeadersCode(headers: ExampleOpenAPIParameter[], reqVar: string): string {
    if (headers.length === 0) {
      return `${reqVar}.SetHeader("Content-Type", "application/json")`;
    }
    
    const headerEntries = headers.map(header => 
      `${reqVar}.SetHeader("${header.name}", "${header.value}")`
    );
    
    return headerEntries.join('\n    ');
  }

  /**
   * 构建请求体代码
   */
  private buildRequestBodyCode(method: HttpMethod, requestBody: any, reqVar: string): string {
    if (!['POST', 'PUT', 'PATCH'].includes(method) || !requestBody) {
      return '';
    }
    
    return `${reqVar}.SetBody(${JSON.stringify(requestBody, null, 8)})`;
  }
}