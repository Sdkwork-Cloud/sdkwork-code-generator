import { BaseRequestCodeGenerator } from '@/openapi/generator/generator';
import { Language, HttpMethod, OpenAPIOperation, ExampleOpenAPIParameter, CodeGenerateContext } from '@/types';

/**
 * Swift Alamofire HTTP请求代码生成器
 */
export class AlamofireSwiftRequestCodeGenerator extends BaseRequestCodeGenerator {
  
  /**
   * 获取目标编程语言
   * @returns 编程语言标识符
   */
  getLanguage(): Language {
    return 'swift';
  }

  /**
   * 获取使用的HTTP库名称
   * @returns HTTP库名称
   */
  getLibrary(): string {
    return 'alamofire';
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
    
    // 构建请求参数
    const parameters = this.buildRequestParameters(method, cookies, headers, queryParams, requestBody);
    
    return `import Alamofire

// ${operation.summary || operation.description || 'API请求'}
func ${operationId}() {
    let url = "${url}"
    ${this.buildQueryParamsCode(queryParams)}
    
    AF.request(url, method: .${method.toLowerCase()}${parameters ? ', ' + parameters : ''})
        .validate()
        .responseJSON { response in
            switch response.result {
            case .success(let value):
                print("Success: \\(value)")
            case .failure(let error):
                print("Error: \\(error.localizedDescription)")
            }
        }
}

// 调用示例
${operationId}()`;
  }

  /**
   * 构建请求参数
   */
  private buildRequestParameters(
    method: HttpMethod,
    cookies: ExampleOpenAPIParameter[],
    headers: ExampleOpenAPIParameter[],
    queryParams: ExampleOpenAPIParameter[],
    requestBody: any
  ): string {
    const params: string[] = [];

    // 添加cookies
    if (cookies.length > 0) {
      const cookiesDict = this.buildCookiesDict(cookies);
      params.push(`cookies: ${cookiesDict}`);
    }

    // 添加请求头
    if (headers.length > 0) {
      const headersDict = this.buildHeadersDict(headers);
      params.push(`headers: ${headersDict}`);
    }

    // 添加查询参数
    if (queryParams.length > 0) {
      const parametersDict = this.buildParametersDict(queryParams);
      params.push(`parameters: ${parametersDict}`);
    }

    // 添加请求体
    if (['POST', 'PUT', 'PATCH'].includes(method) && requestBody) {
      params.push(`parameters: ${JSON.stringify(requestBody, null, 2)}`);
    }

    return params.length > 0 ? `[${params.join(', ')}]` : '';
  }

  /**
   * 构建cookies字典
   */
  private buildCookiesDict(cookies: ExampleOpenAPIParameter[]): string {
    const cookieEntries = cookies.map(cookie => 
      `"${cookie.name}": "${cookie.value}"`
    );
    return `[${cookieEntries.join(', ')}]`;
  }

  /**
   * 构建请求头字典
   */
  private buildHeadersDict(headers: ExampleOpenAPIParameter[]): string {
    const headerEntries = headers.map(header => 
      `"${header.name}": "${header.value}"`
    );
    return `[${headerEntries.join(', ')}]`;
  }

  /**
   * 构建参数字典
   */
  private buildParametersDict(queryParams: ExampleOpenAPIParameter[]): string {
    const paramEntries = queryParams.map(param => 
      `"${param.name}": "${param.value}"`
    );
    return `[${paramEntries.join(', ')}]`;
  }

  /**
   * 构建查询参数代码
   */
  private buildQueryParamsCode(queryParams: ExampleOpenAPIParameter[]): string {
    if (queryParams.length === 0) {
      return '';
    }
    
    const paramEntries = queryParams.map(param => 
      `url += "?${param.name}=\\(param.value)"`
    );
    
    return paramEntries.join('\n    ');
  }
}