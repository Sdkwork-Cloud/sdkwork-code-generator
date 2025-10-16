import { BaseRequestCodeGenerator } from '@/openapi/generator/generator';
import { Language, HttpMethod, OpenAPIOperation, ExampleOpenAPIParameter, CodeGenerateContext } from '@/types';

/**
 * Java Apache HttpClient HTTP请求代码生成器
 */
export class ApacheHttpClientJavaRequestCodeGenerator extends BaseRequestCodeGenerator {
  
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
    return 'apache-httpclient';
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
    
    return `import org.apache.http.HttpEntity;
import org.apache.http.HttpResponse;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.Http${method.charAt(0).toUpperCase() + method.slice(1).toLowerCase()};
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.util.EntityUtils;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/**
 * ${operation.summary || operation.description || 'API请求'}
 */
public class ${className} {
    
    private static final ObjectMapper objectMapper = new ObjectMapper();
    
    public static ${className}Response ${operationId}() throws Exception {
        String url = "${baseUrl}${path}";
        ${this.buildQueryParamsCode(queryParams)}
        
        HttpClient httpClient = HttpClients.createDefault();
        Http${method.charAt(0).toUpperCase() + method.slice(1).toLowerCase()} request = new Http${method.charAt(0).toUpperCase() + method.slice(1).toLowerCase()}();
        request.setURI(new URI(url));
        
        ${this.buildHeadersCode(headers, 'request')}
        ${this.buildRequestBodyCode(method, requestBody, 'request')}
        
        HttpResponse response = httpClient.execute(request);
        HttpEntity entity = response.getEntity();
        
        if (response.getStatusLine().getStatusCode() != 200) {
            throw new RuntimeException("HTTP error! status: " + response.getStatusLine().getStatusCode());
        }
        
        String responseBody = EntityUtils.toString(entity);
        Object result = objectMapper.readValue(responseBody, Object.class);
        
        System.out.println("Response: " + result);
        
        return new ${className}Response(result, response.getStatusLine().getStatusCode());
    }
    
    public static class ${className}Response {
        private Object data;
        private int status;
        
        public ${className}Response(Object data, int status) {
            this.data = data;
            this.status = status;
        }
        
        // Getters and setters
        public Object getData() { return data; }
        public void setData(Object data) { this.data = data; }
        public int getStatus() { return status; }
        public void setStatus(int status) { this.status = status; }
    }
    
    public static void main(String[] args) {
        try {
            ${className}Response result = ${operationId}();
            System.out.println("Success: " + result.getData());
        } catch (Exception e) {
            System.err.println("Error: " + e.getMessage());
            e.printStackTrace();
        }
    }
}`;
  }

  /**
   * 构建查询参数代码
   */
  private buildQueryParamsCode(queryParams: ExampleOpenAPIParameter[]): string {
    if (queryParams.length === 0) {
      return '';
    }
    
    const paramEntries = queryParams.map(param => 
      `url += "?" + "${param.name}=" + URLEncoder.encode("${param.value}", StandardCharsets.UTF_8.toString())`
    );
    
    return paramEntries.join('\n        ');
  }

  /**
   * 构建请求头代码
   */
  private buildHeadersCode(headers: ExampleOpenAPIParameter[], requestVar: string): string {
    if (headers.length === 0) {
      return `${requestVar}.setHeader("Content-Type", "application/json")`;
    }
    
    const headerEntries = headers.map(header => 
      `${requestVar}.setHeader("${header.name}", "${header.value}")`
    );
    
    return headerEntries.join('\n        ');
  }

  /**
   * 构建请求体代码
   */
  private buildRequestBodyCode(method: HttpMethod, requestBody: any, requestVar: string): string {
    if (!['POST', 'PUT', 'PATCH'].includes(method) || !requestBody) {
      return '';
    }
    
    return `String requestBody = objectMapper.writeValueAsString(${JSON.stringify(requestBody, null, 8)});
        ${requestVar}.setEntity(new StringEntity(requestBody, StandardCharsets.UTF_8))`;
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