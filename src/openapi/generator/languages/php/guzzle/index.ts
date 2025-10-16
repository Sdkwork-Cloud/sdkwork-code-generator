import { BaseRequestCodeGenerator } from '@/openapi/generator/generator';
import { Language, HttpMethod, OpenAPIOperation, ExampleOpenAPIParameter, CodeGenerateContext } from '@/types';

/**
 * PHP Guzzle HTTP请求代码生成器
 */
export class GuzzlePhpRequestCodeGenerator extends BaseRequestCodeGenerator {
  
  /**
   * 获取目标编程语言
   * @returns 编程语言标识符
   */
  getLanguage(): Language {
    return 'php';
  }

  /**
   * 获取使用的HTTP库名称
   * @returns HTTP库名称
   */
  getLibrary(): string {
    return 'guzzle';
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
    
    // 构建请求选项
    const options = this.buildRequestOptions(method, cookies, headers, queryParams, requestBody);
    
    return `<?php
require_once 'vendor/autoload.php';

use GuzzleHttp\\Client;
use GuzzleHttp\\Exception\\RequestException;

/**
 * ${operation.summary || operation.description || 'API请求'}
 */
function ${operationId}() {
    $client = new Client();
    
    $url = "${url}";
    ${this.buildQueryParamsCode(queryParams)}
    
    $options = [
        ${options}
    ];
    
    try {
        $response = $client->request('${method}', $url, $options);
        
        echo "Status: " . $response->getStatusCode() . "\\n";
        echo "Response: " . $response->getBody() . "\\n";
        
        return json_decode($response->getBody(), true);
    } catch (RequestException $e) {
        echo "Error: " . $e->getMessage() . "\\n";
        throw $e;
    }
}

// 调用示例
${operationId}();
?>`;
  }

  /**
   * 构建请求选项
   */
  private buildRequestOptions(
    method: HttpMethod,
    cookies: ExampleOpenAPIParameter[],
    headers: ExampleOpenAPIParameter[],
    queryParams: ExampleOpenAPIParameter[],
    requestBody: any
  ): string {
    const options: string[] = [];

    // 添加cookies
    if (cookies.length > 0) {
      options.push(`'cookies' => ${this.buildCookiesObject(cookies)}`);
    }

    // 添加请求头
    if (headers.length > 0) {
      const headersObj = this.buildHeadersObject(headers);
      options.push(`'headers' => ${headersObj}`);
    }

    // 添加查询参数（在URL中处理）
    if (queryParams.length > 0) {
      options.push(`'query' => ${this.buildQueryParamsObject(queryParams)}`);
    }

    // 添加请求体
    if (['POST', 'PUT', 'PATCH'].includes(method) && requestBody) {
      options.push(`'json' => ${JSON.stringify(requestBody, null, 2)}`);
    }

    return options.join(',\n        ');
  }

  /**
   * 构建cookies对象
   */
  private buildCookiesObject(cookies: ExampleOpenAPIParameter[]): string {
    const cookieEntries = cookies.map(cookie => 
      `'${cookie.name}' => '${cookie.value}'`
    );
    return `[\n            ${cookieEntries.join(',\n            ')}\n        ]`;
  }

  /**
   * 构建请求头对象
   */
  private buildHeadersObject(headers: ExampleOpenAPIParameter[]): string {
    const headerEntries = headers.map(header => 
      `'${header.name}' => '${header.value}'`
    );
    return `[\n            ${headerEntries.join(',\n            ')}\n        ]`;
  }

  /**
   * 构建查询参数对象
   */
  private buildQueryParamsObject(queryParams: ExampleOpenAPIParameter[]): string {
    const paramEntries = queryParams.map(param => 
      `'${param.name}' => '${param.value}'`
    );
    return `[\n            ${paramEntries.join(',\n            ')}\n        ]`;
  }

  /**
   * 构建查询参数代码
   */
  private buildQueryParamsCode(queryParams: ExampleOpenAPIParameter[]): string {
    if (queryParams.length === 0) {
      return '';
    }
    
    const paramEntries = queryParams.map(param => 
      `$url .= (strpos($url, '?') === false ? '?' : '&') . '${param.name}=' . urlencode('${param.value}');`
    );
    
    return paramEntries.join('\n    ');
  }
}