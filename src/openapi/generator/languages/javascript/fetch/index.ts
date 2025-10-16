import { BaseRequestCodeGenerator } from '@/openapi/generator/generator';
import { Language, HttpMethod, OpenAPIOperation, ExampleOpenAPIParameter, CodeGenerateContext } from '@/types';

/**
 * JavaScript Fetch API HTTP请求代码生成器
 */
export class FetchJavaScriptRequestCodeGenerator extends BaseRequestCodeGenerator {
  
  /**
   * 获取目标编程语言
   * @returns 编程语言标识符
   */
  getLanguage(): Language {
    return 'javascript';
  }

  /**
   * 获取使用的HTTP库名称
   * @returns HTTP库名称
   */
  getLibrary(): string {
    return 'fetch';
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
    const operationId = operation.operationId || 'apiRequest';
    const url = `${baseUrl}${path}`;
    
    // 构建请求配置
    const config = this.buildFetchConfig(method, cookies, headers, queryParams, requestBody);
    
    return `/**
 * ${operation.summary || operation.description || 'API请求'}
 * ${operation.description ? ` * ${operation.description}` : ''}
 */
async function ${operationId}() {
    const url = "${url}";
    ${this.buildQueryParamsCode(queryParams)}
    
    try {
        const response = await fetch(url, ${config});
        
        if (!response.ok) {
            throw new Error(\`HTTP error! status: \${response.status}\`);
        }
        
        const data = await response.json();
        console.log('Response:', data);
        return data;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

// 调用示例
${operationId}();`;
  }

  /**
   * 构建Fetch请求配置
   */
  private buildFetchConfig(
    method: HttpMethod,
    cookies: ExampleOpenAPIParameter[],
    headers: ExampleOpenAPIParameter[],
    queryParams: ExampleOpenAPIParameter[],
    requestBody: any
  ): string {
    const configParts: string[] = [];

    configParts.push(`method: '${method}'`);

    // 添加cookies
    if (cookies.length > 0) {
      configParts.push(`credentials: 'include'`);
      const cookiesHeader = this.buildCookiesHeader(cookies);
      configParts.push(`headers: { 'Cookie': '${cookiesHeader}' }`);
    }

    // 添加请求头
    if (headers.length > 0) {
      const headersObj = this.buildHeadersObject(headers);
      configParts.push(`headers: ${headersObj}`);
    }

    // 添加请求体
    if (['POST', 'PUT', 'PATCH'].includes(method) && requestBody) {
      configParts.push(`body: JSON.stringify(${JSON.stringify(requestBody, null, 2)})`);
    }

    return `{\n        ${configParts.join(',\n        ')}\n    }`;
  }

  /**
   * 构建请求头对象
   */
  private buildHeadersObject(headers: ExampleOpenAPIParameter[]): string {
    const headerEntries = headers.map(header => 
      `'${header.name}': '${header.value}'`
    );
    return `{\n            ${headerEntries.join(',\n            ')}\n        }`;
  }

  /**
   * 构建cookies字符串
   */
  private buildCookiesHeader(cookies: ExampleOpenAPIParameter[]): string {
    const cookieEntries = cookies.map(cookie => 
      `${cookie.name}=${cookie.value}`
    );
    return cookieEntries.join('; ');
  }

  /**
   * 构建查询参数代码
   */
  private buildQueryParamsCode(queryParams: ExampleOpenAPIParameter[]): string {
    if (queryParams.length === 0) {
      return '';
    }
    
    const paramEntries = queryParams.map(param => 
      `url += (url.includes('?') ? '&' : '?') + '${param.name}=' + encodeURIComponent('${param.value}');`
    );
    
    return paramEntries.join('\n    ');
  }
}