import { BaseRequestCodeGenerator } from '@/openapi/generator/generator';
import { Language, HttpMethod, OpenAPIOperation, ExampleOpenAPIParameter, CodeGenerateContext } from '@/types';

/**
 * TypeScript Axios HTTP请求代码生成器
 */
export class AxiosTypeScriptRequestCodeGenerator extends BaseRequestCodeGenerator {
  
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
    return 'axios';
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
    // 构建请求配置
    const config = this.buildRequestConfig(method, cookies, headers, queryParams, requestBody);
    
    // 生成TypeScript接口定义
    const interfaceCode = this.generateTypeScriptInterfaces(operation, requestBody);
    
    // 生成完整的请求代码
    const requestCode = this.generateAxiosRequestCode(baseUrl, path, config, operation);
    
    return `${interfaceCode}

${requestCode}`;
  }

  /**
   * 构建Axios请求配置
   */
  private buildRequestConfig(
    method: HttpMethod,
    cookies: ExampleOpenAPIParameter[],
    headers: ExampleOpenAPIParameter[],
    queryParams: ExampleOpenAPIParameter[],
    requestBody: any
  ): string {
    const configParts: string[] = [];

    configParts.push(`method: '${method.toLowerCase()}'`);

    // 添加cookies
    if (cookies.length > 0) {
      configParts.push(`withCredentials: true`);
      const cookiesHeader = this.buildCookiesHeader(cookies);
      configParts.push(`headers: { 'Cookie': '${cookiesHeader}' }`);
    }

    // 添加请求头
    if (headers.length > 0) {
      const headersObj = this.buildHeadersObject(headers);
      configParts.push(`headers: ${headersObj}`);
    }

    // 添加查询参数
    if (queryParams.length > 0) {
      const paramsObj = this.buildQueryParamsObject(queryParams);
      configParts.push(`params: ${paramsObj}`);
    }

    // 添加请求体
    if (['POST', 'PUT', 'PATCH'].includes(method) && requestBody) {
      configParts.push(`data: ${JSON.stringify(requestBody, null, 2)}`);
    }

    return `{\n  ${configParts.join(',\n  ')}\n}`;
  }

  /**
   * 构建请求头对象
   */
  private buildHeadersObject(headers: ExampleOpenAPIParameter[]): string {
    const headerEntries = headers.map(header => 
      `'${header.name}': '${header.value}'`
    );
    return `{\n    ${headerEntries.join(',\n    ')}\n  }`;
  }

  /**
   * 构建查询参数对象
   */
  private buildQueryParamsObject(queryParams: ExampleOpenAPIParameter[]): string {
    const paramEntries = queryParams.map(param => 
      `'${param.name}': '${param.value}'`
    );
    return `{\n    ${paramEntries.join(',\n    ')}\n  }`;
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
   * 生成TypeScript接口定义
   */
  private generateTypeScriptInterfaces(operation: OpenAPIOperation, requestBody: any): string {
    const operationId = operation.operationId || 'ApiRequest';
    const requestInterface = `${operationId}Request`;
    const responseInterface = `${operationId}Response`;
    
    let interfaces = `interface ${requestInterface} {
  // 请求参数接口定义
`;

    if (requestBody && typeof requestBody === 'object') {
      Object.keys(requestBody).forEach(key => {
        const value = requestBody[key];
        interfaces += `  ${key}: ${typeof value};\n`;
      });
    }

    interfaces += `}

interface ${responseInterface} {
  // 响应数据接口定义
  data: any;
  status: number;
  statusText: string;
}`;

    return interfaces;
  }

  /**
   * 生成完整的Axios请求代码
   */
  private generateAxiosRequestCode(
    baseUrl: string,
    path: string,
    config: string,
    operation: OpenAPIOperation
  ): string {
    const url = `${baseUrl}${path}`;
    const operationId = operation.operationId || 'apiRequest';
    
    return `/**
 * ${operation.summary || operation.description || 'API请求'}
 */
async function ${operationId}(): Promise<${operation.operationId || 'ApiRequest'}Response> {
  try {
    const response = await axios<${operation.operationId || 'ApiRequest'}Response>(${JSON.stringify(url)}, ${config});
    console.log('Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    throw error;
  }
}

// 调用示例
// ${operationId}();`;
  }
}