import { BaseRequestCodeGenerator } from '@/openapi/generator/generator';
import { Language, HttpMethod, OpenAPIOperation, ExampleOpenAPIParameter, CodeGenerateContext } from '@/types';

/**
 * Java Unirest HTTP请求代码生成器
 */
export class UnirestJavaRequestCodeGenerator extends BaseRequestCodeGenerator {
  
  /**
   * 获取目标编程语言
   * @returns 编程语言标识符
   */
  getLanguage(): Language {
    return 'java';
  }

  /**
   * 获取使用的HTTP库名称
   * @returns HTTP库名称
   */
  getLibrary(): string {
    return 'unirest';
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
    const className = this.toPascalCase(operationId);
    const url = `${baseUrl}${path}`;
    
    return `import kong.unirest.HttpResponse;
import kong.unirest.JsonNode;
import kong.unirest.Unirest;
import kong.unirest.json.JSONObject;

/**
 * ${operation.summary || operation.description || 'API请求'}
 * ${operation.description ? ` * ${operation.description}` : ''}
 */
public class ${className} {
    
    public static void main(String[] args) {
        try {
            ${operationId}();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
    
    public static void ${operationId}() throws Exception {
        String url = "${url}";
        
        HttpResponse<JsonNode> response = Unirest.${method.toLowerCase()}("${url}")
            ${this.buildCookiesCode(cookies)}
            ${this.buildQueryParamsCode(queryParams)}
            ${this.buildHeadersCode(headers)}
            ${this.buildRequestBodyCode(method, requestBody)}
            .asJson();
        
        if (response.getStatus() != 200) {
            throw new RuntimeException("HTTP error! status: " + response.getStatus());
        }
        
        JSONObject data = response.getBody().getObject();
        System.out.println("Response: " + data);
    }
}`;
  }

  /**
   * 构建cookies代码
   */
  private buildCookiesCode(cookies: ExampleOpenAPIParameter[]): string {
    if (cookies.length === 0) {
      return '';
    }
    
    const cookieEntries = cookies.map(cookie => 
      `"${cookie.name}=${cookie.value}"`
    );
    
    return `.header("Cookie", "${cookieEntries.join('; ')}")`;
  }

  /**
   * 构建查询参数代码
   */
  private buildQueryParamsCode(queryParams: ExampleOpenAPIParameter[]): string {
    if (queryParams.length === 0) {
      return '';
    }
    
    const paramEntries = queryParams.map(param => 
      `.queryString("${param.name}", "${param.value}")`
    );
    
    return paramEntries.join('\n            ');
  }

  /**
   * 构建请求头代码
   */
  private buildHeadersCode(headers: ExampleOpenAPIParameter[]): string {
    if (headers.length === 0) {
      return `.header("Content-Type", "application/json")`;
    }
    
    const headerEntries = headers.map(header => 
      `.header("${header.name}", "${header.value}")`
    );
    
    return headerEntries.join('\n            ');
  }

  /**
   * 构建请求体代码
   */
  private buildRequestBodyCode(method: HttpMethod, requestBody: any): string {
    if (!['POST', 'PUT', 'PATCH'].includes(method) || !requestBody) {
      return '';
    }
    
    return `.body(${JSON.stringify(requestBody, null, 12)})`;
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