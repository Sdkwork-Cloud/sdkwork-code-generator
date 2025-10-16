import { BaseRequestCodeGenerator } from '@/openapi/generator/generator';
import { Language, HttpMethod, OpenAPIOperation, ExampleOpenAPIParameter, CodeGenerateContext } from '@/types';

/**
 * Kotlin Retrofit HTTP请求代码生成器
 */
export class RetrofitKotlinRequestCodeGenerator extends BaseRequestCodeGenerator {
  
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
    return 'retrofit';
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
    
    return `import retrofit2.Call
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.*
import com.google.gson.Gson
import okhttp3.OkHttpClient
import okhttp3.Request

/**
 * ${operation.summary || operation.description || 'API请求'}
 * ${operation.description ? ` * ${operation.description}` : ''}
 */

interface ApiService {
    @${method.toUpperCase()}("${path}")
    fun ${operationId}(
        ${this.buildRetrofitAnnotations(cookies, queryParams, headers, requestBody)}
    ): Call<Any>
}

fun main() {
    ${operationId}()
}

fun ${operationId}() {
    ${this.buildCookiesCode(cookies)}
    
    val retrofit = Retrofit.Builder()
        .baseUrl("${baseUrl}")
        .addConverterFactory(GsonConverterFactory.create())
        .build()
        
    val service = retrofit.create(ApiService::class.java)
    val call = service.${operationId}(
        ${this.buildRetrofitParameters(cookies, queryParams, headers, requestBody)}
    )
    
    val response = call.execute()
    if (!response.isSuccessful) {
        throw RuntimeException("HTTP error! status: \${response.code()}")
    }
    
    val data = response.body()
    println("Response: \${Gson().toJson(data)}")
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
    
    return `val cookieHeader = "${cookieEntries.join('; ')}"`;
  }

  /**
   * 构建Retrofit注解
   */
  private buildRetrofitAnnotations(
    cookies: ExampleOpenAPIParameter[],
    queryParams: ExampleOpenAPIParameter[], 
    headers: ExampleOpenAPIParameter[], 
    requestBody: any
  ): string {
    const annotations: string[] = [];
    
    if (cookies.length > 0) {
      annotations.push(`@Header("Cookie") cookie: String`);
    }
    
    if (queryParams.length > 0) {
      queryParams.forEach(param => {
        annotations.push(`@Query("${param.name}") ${param.name}: String`);
      });
    }
    
    if (headers.length > 0) {
      headers.forEach(header => {
        annotations.push(`@Header("${header.name}") ${header.name}: String`);
      });
    }
    
    if (requestBody) {
      annotations.push(`@Body body: Any`);
    }
    
    return annotations.join(',\n        ');
  }

  /**
   * 构建Retrofit参数
   */
  private buildRetrofitParameters(
    cookies: ExampleOpenAPIParameter[],
    queryParams: ExampleOpenAPIParameter[], 
    headers: ExampleOpenAPIParameter[], 
    requestBody: any
  ): string {
    const params: string[] = [];
    
    if (cookies.length > 0) {
      params.push(`cookieHeader`);
    }
    
    if (queryParams.length > 0) {
      queryParams.forEach(param => {
        params.push(`"${param.value}"`);
      });
    }
    
    if (headers.length > 0) {
      headers.forEach(header => {
        params.push(`"${header.value}"`);
      });
    }
    
    if (requestBody) {
      params.push(`Gson().toJsonTree(${JSON.stringify(requestBody, null, 12)})`);
    }
    
    return params.join(',\n        ');
  }
}