import { BaseRequestCodeGenerator } from '@/openapi/generator/generator';
import { Language, HttpMethod, OpenAPIOperation, ExampleOpenAPIParameter, CodeGenerateContext } from '@/types';

/**
 * Dart HTTP请求代码生成器
 */
export class HttpDartRequestCodeGenerator extends BaseRequestCodeGenerator {
  
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
    return 'http';
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
    const requestCode = this.buildDartRequestCode(method, cookies, headers, queryParams, requestBody, url, operationId);
    
    return `import 'dart:convert';
import 'package:http/http.dart' as http;

// ${operation.summary || operation.description || 'API请求'}
Future<void> ${operationId}() async {
  ${requestCode}
  
  try {
    final response = await http.${method.toLowerCase()}(${['POST', 'PUT', 'PATCH'].includes(method) && requestBody ? 'uri, headers: headers, body: body' : 'uri, headers: headers'});
    
    if (response.statusCode == 200) {
      print('Status: \${response.statusCode}');
      print('Response: \${response.body}');
    } else {
      throw Exception('Request failed with status: \${response.statusCode}');
    }
  } catch (e) {
    print('Error: \$e');
    rethrow;
  }
}

void main() async {
  await ${operationId}();
}`;
  }

  /**
   * 构建Dart请求代码
   */
  private buildDartRequestCode(
    method: HttpMethod,
    cookies: ExampleOpenAPIParameter[],
    headers: ExampleOpenAPIParameter[],
    queryParams: ExampleOpenAPIParameter[],
    requestBody: any,
    url: string,
    operationId: string
  ): string {
    // 构建URI
    let uriCode = 'final uri = Uri.parse("${url}")';
    
    // 构建查询参数
    if (queryParams.length > 0) {
      const paramEntries = queryParams.map(param => 
        `"${param.name}": "${param.value}"`
      );
      uriCode = `final uri = Uri.parse("${url}").replace(queryParameters: {
    ${paramEntries.join(',\n    ')}
  })`;
    }
    
    // 构建cookies
    let cookiesCode = '';
    if (cookies.length > 0) {
      const cookieEntries = cookies.map(cookie => 
        `"${cookie.name}": "${cookie.value}"`
      );
      cookiesCode = `final cookies = {
    ${cookieEntries.join(',\n    ')}
  };`;
    }
    
    // 构建请求头
    let headersCode = '';
    if (headers.length > 0) {
      const headerEntries = headers.map(header => 
        `"${header.name}": "${header.value}"`
      );
      headersCode = `final headers = {
    ${headerEntries.join(',\n    ')}
  };`;
    } else {
      headersCode = 'final headers = {};';
    }
    
    // 构建请求体
    let bodyCode = '';
    if (['POST', 'PUT', 'PATCH'].includes(method) && requestBody) {
      const jsonBody = JSON.stringify(requestBody, null, 2);
      bodyCode = `final body = jsonEncode(${jsonBody});`;
    }
    
    return `${uriCode};
  ${cookiesCode}
  ${headersCode}
  ${bodyCode ? bodyCode : ''}`;
  }
}