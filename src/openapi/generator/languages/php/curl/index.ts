import { BaseRequestCodeGenerator } from '@/openapi/generator/generator';
import { Language, HttpMethod, OpenAPIOperation, ExampleOpenAPIParameter, CodeGenerateContext } from '@/types';

/**
 * PHP cURL HTTP请求代码生成器
 */
export class CurlPhpRequestCodeGenerator extends BaseRequestCodeGenerator {
  
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
    return 'curl';
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
    
    return `<?php
/**
 * ${operation.summary || operation.description || 'API请求'}
 * ${operation.description ? ` * ${operation.description}` : ''}
 */

function ${operationId}() {
    $url = "${url}";
    ${this.buildQueryParamsCode(queryParams)}
    
    $ch = curl_init();
    
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, '${method.toUpperCase()}');
    
    ${this.buildCookiesCode(cookies, '$ch')}
    ${this.buildHeadersCode(headers, '$ch')}
    ${this.buildRequestBodyCode(method, requestBody, '$ch')}
    
    $response = curl_exec($ch);
    
    if (curl_errno($ch)) {
        throw new Exception('cURL Error: ' . curl_error($ch));
    }
    
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    if ($http_code != 200) {
        throw new Exception('HTTP error! status: ' . $http_code);
    }
    
    curl_close($ch);
    
    $data = json_decode($response, true);
    echo 'Response: ' . json_encode($data, JSON_PRETTY_PRINT) . PHP_EOL;
    return $data;
}

// 调用示例
${operationId}();
?>`;
  }

  /**
   * 构建cookies代码
   */
  private buildCookiesCode(cookies: ExampleOpenAPIParameter[], chVar: string): string {
    if (cookies.length === 0) {
      return '';
    }
    
    const cookieEntries = cookies.map(cookie => 
      `'${cookie.name}=${cookie.value}'`
    );
    
    return `curl_setopt(${chVar}, CURLOPT_COOKIE, '${cookieEntries.join('; ')}');`;
  }

  /**
   * 构建查询参数代码
   */
  private buildQueryParamsCode(queryParams: ExampleOpenAPIParameter[]): string {
    if (queryParams.length === 0) {
      return '';
    }
    
    const paramEntries = queryParams.map(param => 
      `$url .= (strpos($url, '?') !== false ? '&' : '?') . '${param.name}=' . urlencode('${param.value}');`
    );
    
    return paramEntries.join('\n    ');
  }

  /**
   * 构建请求头代码
   */
  private buildHeadersCode(headers: ExampleOpenAPIParameter[], chVar: string): string {
    if (headers.length === 0) {
      return `curl_setopt(${chVar}, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);`;
    }
    
    const headerEntries = headers.map(header => 
      `'${header.name}: ${header.value}'`
    );
    
    return `curl_setopt(${chVar}, CURLOPT_HTTPHEADER, [\n        ${headerEntries.join(',\n        ')}\n    ]);`;
  }

  /**
   * 构建请求体代码
   */
  private buildRequestBodyCode(method: HttpMethod, requestBody: any, chVar: string): string {
    if (!['POST', 'PUT', 'PATCH'].includes(method) || !requestBody) {
      return '';
    }
    
    return `curl_setopt(${chVar}, CURLOPT_POSTFIELDS, json_encode(${JSON.stringify(requestBody, null, 8)}));`;
  }
}