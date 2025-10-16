import {
  ExampleGenerator,
  OpenAPIParameter,
  OpenAPIOperation,
  CodeGenerateContext,
  ExampleOpenAPIParameter,
} from '@/types';
import { OpenAPISchema } from '@/types/openapi';
import { BaseExampleGenerator } from '../../example-generator';

/**
 * 默认请求示例生成器实现
 * 根据OpenAPI参数定义生成模拟请求数据
 */
export class DefaultExampleGenerator extends BaseExampleGenerator {
  /**
   * 生成请求头示例
   */
  generateHeaders(
    headers: OpenAPIParameter[],
    operation: OpenAPIOperation,
    context: CodeGenerateContext
  ): ExampleOpenAPIParameter[] {
    return headers.map((header) =>
      this.generateParameterExample(header, context)
    );
  }
  /**
   * 获取Cookie参数示例
   */
  generateCookies(
    cookies: OpenAPIParameter[],
    operation: OpenAPIOperation,
    context: CodeGenerateContext
  ): ExampleOpenAPIParameter[] {
    return cookies.map((cookie) =>
      this.generateParameterExample(cookie, context)
    );
  }
  /**
   * 生成查询参数示例
   */
  generateQueryParams(
    parameters: OpenAPIParameter[],
    operation: OpenAPIOperation,
    context: CodeGenerateContext
  ): ExampleOpenAPIParameter[] {
    return parameters.map((param) =>
      this.generateParameterExample(param, context)
    );
  }

  /**
   * 生成请求体示例
   */
  generateBody(
    schema: OpenAPISchema | undefined,
    operation: OpenAPIOperation,
    context: CodeGenerateContext
  ): any {
    if (!schema) return {};
    return this.generateSchemaExample(schema, context);
  }

  /**
   * 生成参数示例（包含原始参数属性）
   */
  generateParameterExample(
    param: OpenAPIParameter,
    context: CodeGenerateContext
  ): ExampleOpenAPIParameter {
    const example = super.generateParameterExample(param, context);
    return { ...param, ...example };
  }

  /**
   * 生成所有参数示例
   */
  generateParameters(
    parameters: OpenAPIParameter[],
    operation: OpenAPIOperation,
    context: CodeGenerateContext
  ): ExampleOpenAPIParameter[] {
    return parameters.map((param) =>
      this.generateParameterExample(param, context)
    );
  }
}
