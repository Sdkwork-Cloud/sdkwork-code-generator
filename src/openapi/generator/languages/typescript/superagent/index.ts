import { BaseRequestCodeGenerator } from '@/openapi/generator/generator';
import { Language, HttpMethod, OpenAPIOperation, ExampleOpenAPIParameter, CodeGenerateContext } from '@/types';

/**
 * TypeScript Superagent HTTP请求代码生成器
 */
export class SuperagentTypeScriptRequestCodeGenerator extends BaseRequestCodeGenerator {
  
  /**
   * 获取目标编程语言
   * @returns 编程语言标识符
   */
  getLanguage(): Language {
    return 'typescript';
  }

  /**
   * 获取使用的HTTP库名称
   * @returns HTTP库名称
   */
  getLibrary(): string {
    return 'superagent';
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
    const interfaceName = this.toPascalCase(operationId);
    const url = `${baseUrl}${path}`;
    
    return `import * as superagent from 'superagent';

/**
 * ${operation.summary || operation.description || 'API请求'}
 * ${operation.description ? ` * ${operation.description}` : ''}
 */

interface ${interfaceName}Request {
    ${this.buildRequestInterface(requestBody)}
}

interface ${interfaceName}Response {
    data: any;
    status: number;
}

/**
 * ${operation.summary || 'API请求函数'}
 */
async function ${operationId}(): Promise<${interfaceName}Response> {
    const url = "${url}";
    ${this.buildQueryParamsCode(queryParams)}
    
    try {
        let request = superagent('${method.toUpperCase()}', url);
        
        ${this.buildCookiesCode(cookies, 'request')}
        ${this.buildHeadersCode(headers, 'request')}
        ${this.buildRequestBodyCode(method, requestBody, 'request')}
        
        const response = await request;
        
        if (response.status !== 200) {
            throw new Error(\`HTTP error! status: \${response.status}\`);
        }
        
        const data = response.body;
        console.log('Response:', data);
        
        return {
            data,
            status: response.status
        };
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

// 调用示例
${operationId}();`;
  }

  /**
   * 构建cookies代码
   */
  private buildCookiesCode(cookies: ExampleOpenAPIParameter[], requestVar: string): string {
    if (cookies.length === 0) {
      return '';
    }
    
    const cookieEntries = cookies.map(cookie => 
      `${requestVar}.set('Cookie', '${cookie.name}=${cookie.value}');`
    );
    
    return cookieEntries.join('\n        ');
  }

  /**
   * 构建请求接口定义
   */
  private buildRequestInterface(requestBody: any): string {
    if (!requestBody || typeof requestBody !== 'object') {
      return '// 请求参数定义';
    }
    
    const properties = Object.keys(requestBody).map(key => {
      const value = requestBody[key];
      return `${key}: ${this.getTypeScriptType(value)};`;
    });
    
    return properties.join('\n    ');
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

  /**
   * 构建请求头代码
   */
  private buildHeadersCode(headers: ExampleOpenAPIParameter[], requestVar: string): string {
    if (headers.length === 0) {
      return `${requestVar}.set('Content-Type', 'application/json');`;
    }
    
    const headerEntries = headers.map(header => 
      `${requestVar}.set('${header.name}', '${header.value}');`
    );
    
    return headerEntries.join('\n        ');
  }

  /**
   * 构建请求体代码
   */
  private buildRequestBodyCode(method: HttpMethod, requestBody: any, requestVar: string): string {
    if (!['POST', 'PUT', 'PATCH'].includes(method) || !requestBody) {
      return '';
    }
    
    return `${requestVar}.send(${JSON.stringify(requestBody, null, 8)});`;
  }

  /**
   * 获取TypeScript类型
   */
  private getTypeScriptType(value: any): string {
    if (typeof value === 'string') return 'string';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    if (Array.isArray(value)) return 'any[]';
    return 'any';
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