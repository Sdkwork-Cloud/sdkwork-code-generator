import { BaseRequestCodeGenerator } from '@/openapi/generator/generator';
import { Language, HttpMethod, OpenAPIOperation, ExampleOpenAPIParameter, CodeGenerateContext } from '@/types';

/**
 * Kotlin OkHttp HTTP请求代码生成器
 */
export class OkHttpKotlinRequestCodeGenerator extends BaseRequestCodeGenerator {
  
  /**
   * 获取目标编程语言
   * @returns 编程语言标识符
   */
  getLanguage(): Language {
    return 'kotlin';
  }

  /**
   * 获取使用的HTTP库名称
   * @returns HTTP库名称
   */
  getLibrary(): string {
    return 'okhttp';
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
    const requestCode = this.buildKotlinRequestCode(method, cookies, headers, queryParams, requestBody, url, operationId);
    
    return `import okhttp3.*
import java.io.IOException

// ${operation.summary || operation.description || 'API请求'}
fun ${operationId}() {
    val client = OkHttpClient()
    
    ${requestCode}
    
    client.newCall(request).execute().use { response ->
        if (!response.isSuccessful) throw IOException("Unexpected code \$response")
        
        println("Status: \${response.code}")
        println("Response: \${response.body?.string()}")
    }
}

fun main() {
    ${operationId}()
}`;
  }

  /**
   * 构建Kotlin请求代码
   */
  private buildKotlinRequestCode(
    method: HttpMethod,
    cookies: ExampleOpenAPIParameter[],
    headers: ExampleOpenAPIParameter[],
    queryParams: ExampleOpenAPIParameter[],
    requestBody: any,
    url: string,
    operationId: string
  ): string {
    // 构建URL
    let urlCode = `val url = "${url}"`;
    
    // 构建查询参数
    if (queryParams.length > 0) {
      const paramEntries = queryParams.map(param => 
        `url += "?${param.name}=\${param.value}"`
      );
      urlCode += `\n    ${paramEntries.join('\n    ')}`;
    }
    
    // 构建请求体
    let bodyCode = '';
    if (['POST', 'PUT', 'PATCH'].includes(method) && requestBody) {
      const jsonBody = JSON.stringify(requestBody, null, 2);
      bodyCode = `val requestBody = RequestBody.create(
        MediaType.parse("application/json"), 
        """${jsonBody}""".trimIndent()
    )`;
    }
    
    // 构建cookies
    let cookiesCode = '';
    if (cookies.length > 0) {
      const cookieEntries = cookies.map(cookie => 
        `"${cookie.name}=${cookie.value}"`
      );
      cookiesCode = `.addHeader("Cookie", "${cookieEntries.join('; ')}")`;
    }
    
    // 构建请求头
    let headersCode = '';
    if (headers.length > 0 || cookies.length > 0) {
      const headerBuilder = headers.map(header => 
        `.addHeader("${header.name}", "${header.value}")`
      );
      
      if (cookiesCode) {
        headerBuilder.push(cookiesCode);
      }
      
      headersCode = `val request = Request.Builder()
        .url(url)
        .${method.toLowerCase()}(${bodyCode ? 'requestBody' : ''})
        ${headerBuilder.join('\n        ')}
        .build()`;
    } else {
      headersCode = `val request = Request.Builder()
        .url(url)
        .${method.toLowerCase()}(${bodyCode ? 'requestBody' : ''})
        .build()`;
    }
    
    return `${urlCode}
    ${bodyCode ? bodyCode + '\n    ' : ''}
    ${headersCode}`;
  }
}