import { BaseRequestCodeGenerator } from '@/openapi/generator/generator';
import { Language, HttpMethod, OpenAPIOperation, ExampleOpenAPIParameter, CodeGenerateContext } from '@/types';

/**
 * Java Retrofit HTTP请求代码生成器
 */
export class RetrofitJavaRequestCodeGenerator extends BaseRequestCodeGenerator {
  
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
    return 'retrofit';
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
    const className = this.toPascalCase(operationId);
    const url = `${baseUrl}${path}`;
    
    return `import retrofit2.Call;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;
import retrofit2.http.*;
import com.google.gson.Gson;

/**
 * ${operation.summary || operation.description || 'API请求'}
 * ${operation.description ? ` * ${operation.description}` : ''}
 */
public class ${className} {
    
    public interface ApiService {
        @${method.toUpperCase()}("${path}")
        Call<Object> ${operationId}(
            ${this.buildRetrofitAnnotations(queryParams, headers, requestBody)}
        );
    }
    
    public static void main(String[] args) {
        try {
            ${operationId}();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
    
    public static void ${operationId}() throws Exception {
        Retrofit retrofit = new Retrofit.Builder()
            .baseUrl("${baseUrl}")
            .addConverterFactory(GsonConverterFactory.create())
            .build();
            
        ApiService service = retrofit.create(ApiService.class);
        Call<Object> call = service.${operationId}(
            ${this.buildRetrofitParameters(queryParams, headers, requestBody)}
        );
        
        retrofit2.Response<Object> response = call.execute();
        if (!response.isSuccessful()) {
            throw new RuntimeException("HTTP error! status: " + response.code());
        }
        
        Object data = response.body();
        System.out.println("Response: " + data);
    }
}`;
  }

  /**
   * 构建Retrofit注解
   */
  private buildRetrofitAnnotations(
    queryParams: ExampleOpenAPIParameter[], 
    headers: ExampleOpenAPIParameter[], 
    requestBody: any
  ): string {
    const annotations: string[] = [];
    
    if (queryParams.length > 0) {
      queryParams.forEach(param => {
        annotations.push(`@Query("${param.name}") String ${param.name}`);
      });
    }
    
    if (headers.length > 0) {
      headers.forEach(header => {
        annotations.push(`@Header("${header.name}") String ${header.name}`);
      });
    }
    
    if (requestBody) {
      annotations.push(`@Body Object body`);
    }
    
    return annotations.join(',\n            ');
  }

  /**
   * 构建Retrofit参数
   */
  private buildRetrofitParameters(
    queryParams: ExampleOpenAPIParameter[], 
    headers: ExampleOpenAPIParameter[], 
    requestBody: any
  ): string {
    const params: string[] = [];
    
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
      params.push(`new Gson().toJsonTree(${JSON.stringify(requestBody, null, 12)})`);
    }
    
    return params.join(',\n            ');
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