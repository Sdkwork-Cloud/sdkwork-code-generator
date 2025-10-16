import { BaseRequestCodeGenerator } from '@/openapi/generator/generator';
import { Language, HttpMethod, OpenAPIOperation, ExampleOpenAPIParameter, CodeGenerateContext } from '@/types';

/**
 * Go fasthttp HTTP请求代码生成器
 */
export class FasthttpGoRequestCodeGenerator extends BaseRequestCodeGenerator {
  
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
    return 'fasthttp';
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
    "github.com/valyala/fasthttp"
)

/*
${operation.summary || operation.description || 'API请求'}
${operation.description ? ` * ${operation.description}` : ''}
*/

func ${operationId}() (map[string]interface{}, error) {
    url := "${url}"
    ${this.buildQueryParamsCode(queryParams)}
    
    req := fasthttp.AcquireRequest()
    defer fasthttp.ReleaseRequest(req)
    
    resp := fasthttp.AcquireResponse()
    defer fasthttp.ReleaseResponse(resp)
    
    req.Header.SetMethod("${method.toUpperCase()}")
    req.SetRequestURI(url)
    
    ${this.buildCookiesCode(cookies, 'req')}
    ${this.buildHeadersCode(headers, 'req')}
    ${this.buildRequestBodyCode(method, requestBody, 'req')}
    
    err := fasthttp.Do(req, resp)
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
      `${reqVar}.Header.Set("Cookie", "${cookie.name}=${cookie.value}")`
    );
    
    return cookieEntries.join('\n    ');
  }

  /**
   * 构建查询参数代码
   */
  private buildQueryParamsCode(queryParams: ExampleOpenAPIParameter[]): string {
    if (queryParams.length === 0) {
      return '';
    }
    
    const paramEntries = queryParams.map(param => 
      `url += "?" + "${param.name}=" + "${param.value}"`
    );
    
    return paramEntries.join('\n    ');
  }

  /**
   * 构建请求头代码
   */
  private buildHeadersCode(headers: ExampleOpenAPIParameter[], reqVar: string): string {
    if (headers.length === 0) {
      return `${reqVar}.Header.Set("Content-Type", "application/json")`;
    }
    
    const headerEntries = headers.map(header => 
      `${reqVar}.Header.Set("${header.name}", "${header.value}")`
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
    
    return `body, _ := json.Marshal(${JSON.stringify(requestBody, null, 8)})\n    ${reqVar}.SetBody(body)`;
  }
}