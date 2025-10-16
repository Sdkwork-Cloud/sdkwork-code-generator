import { BaseRequestCodeGenerator } from '@/openapi/generator/generator';
import { Language, HttpMethod, OpenAPIOperation, ExampleOpenAPIParameter, CodeGenerateContext } from '@/types';

/**
 * TypeScript Fetch API HTTP请求代码生成器
 */
export class FetchTypeScriptRequestCodeGenerator extends BaseRequestCodeGenerator {
  
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
    
    // 构建接口定义
    const interfaceName = this.toPascalCase(operationId);
    
    return `/**
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
        const response = await fetch(url, {
            method: '${method}',
            ${this.buildHeadersCode(headers)}
            ${['POST', 'PUT', 'PATCH'].includes(method) && requestBody ? `body: JSON.stringify(${JSON.stringify(requestBody, null, 2)})` : ''}
        });
        
        if (!response.ok) {
            throw new Error(\`HTTP error! status: \${response.status}\`);
        }
        
        const data = await response.json();
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
   * 构建请求头代码
   */
  private buildHeadersCode(headers: ExampleOpenAPIParameter[]): string {
    if (headers.length === 0) {
      return '';
    }
    
    const headerEntries = headers.map(header => 
      `'${header.name}': '${header.value}'`
    );
    
    return `headers: {
                ${headerEntries.join(',\n                ')}
            },`;
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