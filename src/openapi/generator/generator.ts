import { OpenAPIOperation, OpenAPIParameter, OpenAPISpec } from '@/types';
import {
  ApiRequestDefinition,
  CodeGenerateContext,
  CodeGenerateResult,
  ExampleOpenAPIParameter,
  HttpMethod,
  Language,
  RequestCodeGenerator,
} from '@/types/code';
import { DefaultExampleGenerator } from './languages/example';

/**
 * 基础HTTP请求代码生成器抽象类
 * 实现了RequestCodeGenerator接口，提供通用的代码生成逻辑
 * 子类需要实现具体的编程语言和HTTP库的代码生成逻辑
 */
export abstract class BaseRequestCodeGenerator implements RequestCodeGenerator {
  /** 示例数据生成器实例 */
  protected exampleGenerator = new DefaultExampleGenerator();
  /**
   * 生成HTTP请求代码的主方法
   * @param requestDefinition - API请求定义，包含路径、方法和操作信息
   * @param context - 代码生成上下文，包含语言、库和OpenAPI规范等信息
   * @returns 生成的代码结果，包含代码字符串、语言和库信息
   */
  generate(
    requestDefinition: ApiRequestDefinition,
    context: CodeGenerateContext
  ): CodeGenerateResult {
    const operation: OpenAPIOperation = requestDefinition.operation;
    // 提取各种参数类型
    const pathVariables = this.pathVariables(operation, context);
    const headers = this.headers(operation, context);
    const cookies = this.cookies(operation, context);
    const queryParams = this.queryParams(operation, context);
    const requestBody = this.requestBody(operation, context);
    
    // 调用具体的代码生成逻辑
    return this.handleGenerate(
      requestDefinition.path,
      requestDefinition.method,
      pathVariables,
      headers,
      cookies,
      queryParams,
      requestBody,
      operation,
      context
    );
  }
  /**
   * 处理代码生成的具体逻辑
   * @param path - API路径，可能包含路径参数占位符
   * @param method - HTTP方法（GET、POST、PUT、DELETE等）
   * @param pathVariables - 路径参数列表
   * @param headers - 请求头参数列表
   * @param cookies - Cookie参数列表
   * @param queryParams - 查询参数列表
   * @param requestBody - 请求体数据
   * @param operation - OpenAPI操作定义
   * @param context - 代码生成上下文
   * @returns 生成的代码结果
   */
  handleGenerate(
    path: string,
    method: HttpMethod,
    pathVariables: OpenAPIParameter[],
    headers: OpenAPIParameter[],
    cookies: OpenAPIParameter[],
    queryParams: OpenAPIParameter[],
    requestBody: any,
    operation: OpenAPIOperation,
    context: CodeGenerateContext
  ): CodeGenerateResult {
    // 生成示例数据用于代码模板
    const examplePathVariables = this.exampleGenerator.generateParameters(pathVariables, operation, context);
    const exampleHeaders = this.exampleGenerator.generateHeaders(headers, operation, context);
    const exampleCookies = this.exampleGenerator.generateCookies(headers, operation, context);
    const exampleQueryParams = this.exampleGenerator.generateQueryParams(queryParams, operation, context);
    const exampleRequestBody = this.exampleGenerator.generateBody(requestBody, operation, context);
    
    // 构建完整的URL（替换路径参数）
    const fullPath = this.completePath(path, examplePathVariables, exampleQueryParams);

    // 调用子类实现的代码生成逻辑
    const code = this.generateCode( 
      fullPath,
      method,
      context.baseUrl,
      operation,
      exampleCookies,
      exampleHeaders,
      exampleQueryParams,
      exampleRequestBody,
      context
    );

    return {
      code,
      language: this.getLanguage(),
      library: this.getLibrary()
    };
  }
  /**
   * 构建完整的URL，替换路径参数和添加查询参数
   * @param path - 原始API路径，包含路径参数占位符
   * @param pathVariables - 路径参数列表（已包含示例值）
   * @param queryParams - 查询参数列表（已包含示例值）
   * @returns 构建完成的URL字符串
   */
  protected completePath(path: string, pathVariables: ExampleOpenAPIParameter[], queryParams: ExampleOpenAPIParameter[]): string {
    let url = path;

    // 替换路径参数占位符为实际值
    pathVariables.forEach(param => {
      url = url.replace(`{${param.name}}`, param.value);
    });

    return url;
  }
  /**
   * 获取目标编程语言
   * @returns 编程语言标识符
   */
  abstract getLanguage(): Language;

  /**
   * 获取使用的HTTP库名称
   * @returns HTTP库名称
   */
  abstract getLibrary(): string;

  /**
   * 生成具体的HTTP请求代码（由子类实现）
   * @param path - 完整的请求Path
   * @param method - 请求方法
   * @param baseUrl - baseUrl
   * @param operation - OpenAPI操作定义
   * @param cookies - 路径参数示例数据
   * @param headers - 请求头示例数据
   * @param queryParams - 查询参数示例数据
   * @param requestBody - 请求体示例数据
   * @param context - 代码生成上下文
   * @returns 生成的代码字符串
   */
  abstract generateCode(
    path: string,
    method: HttpMethod,
    baseUrl: string, 
    operation: OpenAPIOperation,
    cookies: ExampleOpenAPIParameter[],
    headers: ExampleOpenAPIParameter[],
    queryParams: ExampleOpenAPIParameter[],
    requestBody: any,
    context: CodeGenerateContext
  ): string;
  /**
   * 提取路径参数
   * @param operation - OpenAPI操作定义
   * @param context - 代码生成上下文
   * @returns 路径参数列表
   */
  pathVariables(
    operation: OpenAPIOperation,
    context: CodeGenerateContext
  ): OpenAPIParameter[] {
    return (operation.parameters || []).filter((param) => param.in === 'path');
  }

  /**
   * 提取请求头参数
   * @param operation - OpenAPI操作定义
   * @param context - 代码生成上下文
   * @returns 请求头参数列表
   */
  headers(
    operation: OpenAPIOperation,
    context: CodeGenerateContext
  ): OpenAPIParameter[] {
    return (operation.parameters || []).filter(
      (param) => param.in === 'header'
    );
  }

  /**
   * 提取Cookie参数
   * @param operation - OpenAPI操作定义
   * @param context - 代码生成上下文
   * @returns Cookie参数列表
   */
  cookies(
    operation: OpenAPIOperation,
    context: CodeGenerateContext
  ): OpenAPIParameter[] {
    return (operation.parameters || []).filter(
      (param) => param.in === 'cookie'
    );
  }

  /**
   * 提取查询参数
   * @param operation - OpenAPI操作定义
   * @param context - 代码生成上下文
   * @returns 查询参数列表
   */
  queryParams(
    operation: OpenAPIOperation,
    context: CodeGenerateContext
  ): OpenAPIParameter[] {
    return (operation.parameters || []).filter((param) => param.in === 'query');
  }
  /**
   * 提取请求体schema
   * @param operation - OpenAPI操作定义
   * @param context - 代码生成上下文
   * @returns 请求体schema对象（已解析引用）
   */
  requestBody(operation: OpenAPIOperation, context: CodeGenerateContext) {
    const schema = operation.requestBody?.content['application/json']?.schema;
    return this.resolveSchemaRef(schema, context.openAPISpec);
  }

  /**
   * 递归解析schema中的$ref引用
   * @param schema - 待解析的schema对象
   * @param spec - OpenAPI规范文档
   * @returns 解析后的schema对象
   */
  private resolveSchemaRef(schema: any, spec: OpenAPISpec | undefined): any {
    if (!schema || !spec) return schema;

    // 如果是引用类型，解析引用
    if (schema.$ref) {
      const refPath = schema.$ref.split('/');
      if (refPath[0] !== '#') return schema; // 只处理内部引用

      // 遍历引用路径解析schema
      let current: any = spec;
      for (let i = 1; i < refPath.length; i++) {
        const part = refPath[i];
        current = current[part];
        if (!current) break;
      }
      return current ? this.resolveSchemaRef(current, spec) : schema;
    }

    // 递归处理嵌套schema中的引用
    if (schema.type === 'object' && schema.properties) {
      Object.keys(schema.properties).forEach((key) => {
        schema.properties[key] = this.resolveSchemaRef(
          schema.properties[key],
          spec
        );
      });
    }

    // 处理数组类型的schema
    if (schema.items) {
      schema.items = this.resolveSchemaRef(schema.items, spec);
    }

    return schema;
  }
}
