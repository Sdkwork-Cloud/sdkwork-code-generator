import { BaseRequestCodeGenerator } from '@/openapi/generator/generator';
import { Language, HttpMethod, OpenAPIOperation, ExampleOpenAPIParameter, CodeGenerateContext } from '@/types';

/**
 * Dart Dio HTTP请求代码生成器
 */
export class DioDartRequestCodeGenerator extends BaseRequestCodeGenerator {
  
  /**
   * 获取目标编程语言
   * @returns 编程语言标识符
   */
  getLanguage(): Language {
    return 'dart';
  }

  /**
   * 获取使用的HTTP库名称
   * @returns HTTP库名称
   */
  getLibrary(): string {
    return 'dio';
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
    
    return `import 'package:dio/dio.dart';

/**
 * ${operation.summary || operation.description || 'API请求'}
 * ${operation.description ? ` * ${operation.description}` : ''}
 */

Future<void> ${operationId}() async {
  final dio = Dio();
  String url = "${url}";
  ${this.buildQueryParamsCode(queryParams)}
  
  ${this.buildCookiesCode(cookies)}
  
  final options = Options(
    method: '${method.toUpperCase()}',
    headers: {
      ${this.buildHeadersCode(headers)}
    },
  );
  
  ${this.buildRequestBodyCode(method, requestBody)}
  
  try {
    final response = await dio.request(
      url,
      options: options,
      ${this.buildCookiesParamCode(cookies)}
      ${this.buildRequestDataCode(method, requestBody)}
    );
    
    if (response.statusCode != 200) {
      throw Exception('HTTP error! status: \${response.statusCode}');
    }
    
    final data = response.data;
    print('Response: \$data');
  } catch (e) {
    print('Error: \$e');
  }
}

void main() {
  ${operationId}();
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
      `'${cookie.name}': '${cookie.value}'`
    );
    
    return `final cookies = {\n  ${cookieEntries.join(',\n  ')}\n};`;
  }

  /**
   * 构建cookies参数代码
   */
  private buildCookiesParamCode(cookies: ExampleOpenAPIParameter[]): string {
    if (cookies.length === 0) {
      return '';
    }
    
    return 'cookies: cookies,';
  }

  /**
   * 构建查询参数代码
   */
  private buildQueryParamsCode(queryParams: ExampleOpenAPIParameter[]): string {
    if (queryParams.length === 0) {
      return '';
    }
    
    const paramEntries = queryParams.map(param => 
      `url += (url.contains('?') ? '&' : '?') + '${param.name}=' + Uri.encodeComponent('${param.value}');`
    );
    
    return paramEntries.join('\n  ');
  }

  /**
   * 构建请求头代码
   */
  private buildHeadersCode(headers: ExampleOpenAPIParameter[]): string {
    if (headers.length === 0) {
      return `'Content-Type': 'application/json',`;
    }
    
    const headerEntries = headers.map(header => 
      `'${header.name}': '${header.value}',`
    );
    
    return headerEntries.join('\n      ');
  }

  /**
   * 构建请求体代码
   */
  private buildRequestBodyCode(method: HttpMethod, requestBody: any): string {
    if (!['POST', 'PUT', 'PATCH'].includes(method) || !requestBody) {
      return '';
    }
    
    return `final requestBody = ${JSON.stringify(requestBody, null, 6)};`;
  }

  /**
   * 构建请求数据代码
   */
  private buildRequestDataCode(method: HttpMethod, requestBody: any): string {
    if (!['POST', 'PUT', 'PATCH'].includes(method) || !requestBody) {
      return '';
    }
    
    return 'data: requestBody,';
  }
}