import { BaseRequestCodeGenerator } from '@/openapi/generator/generator';
import { Language, HttpMethod, OpenAPIOperation, ExampleOpenAPIParameter, CodeGenerateContext } from '@/types';

/**
 * TypeScript Got HTTP请求代码生成器
 */
export class GotTypeScriptRequestCodeGenerator extends BaseRequestCodeGenerator {
  
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
    return 'got';
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
    
    return `import got from 'got';

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
    
    const options = {
        method: '${method.toUpperCase()}' as const,
        ${this.buildCookiesCode(cookies)}
        ${this.buildHeadersCode(headers)}
        ${this.buildRequestBodyCode(method, requestBody)}
    };
    
    try {
        const response = await got(url, options);
        
        if (response.statusCode !== 200) {
            throw new Error(\`HTTP error! status: \${response.statusCode}\`);
        }
        
        const data = JSON.parse(response.body);
        console.log('Response:', data);
        
        return {
            data,
            status: response.statusCode
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
  private buildCookiesCode(cookies: ExampleOpenAPIParameter[]): string {
    if (cookies.length === 0) {
      return '';
    }
    
    const cookieEntries = cookies.map(cookie => 
      `'${cookie.name}=${cookie.value}'`
    );
    
    return `cookie: '${cookieEntries.join('; ')}',`;
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
  private buildHeadersCode(headers: ExampleOpenAPIParameter[]): string {
    if (headers.length === 0) {
      return 'headers: {\n            \'Content-Type\': \'application/json\'\n        },';
    }
    
    const headerEntries = headers.map(header => 
      `'${header.name}': '${header.value}'`
    );
    
    return `headers: {\n            ${headerEntries.join(',\n            ')}\n        },`;
  }

  /**
   * 构建请求体代码
   */
  private buildRequestBodyCode(method: HttpMethod, requestBody: any): string {
    if (!['POST', 'PUT', 'PATCH'].includes(method) || !requestBody) {
      return '';
    }
    
    return `json: ${JSON.stringify(requestBody, null, 8)},`;
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