import {
  CodeGenerateContext,
  ExampleGenerator,
  ExampleOpenAPIParameter,
  OpenAPIOperation,
  OpenAPIParameter,
  OpenAPISchema,
} from '@/types';

export abstract class BaseExampleGenerator implements ExampleGenerator {
  /**
   * 生成所有参数示例
   */
  abstract generateParameters(
    parameters: OpenAPIParameter[],
    operation: OpenAPIOperation,
    context: CodeGenerateContext
  ): ExampleOpenAPIParameter[];
  /**
   * 生成请求头示例
   */
  abstract generateHeaders(
    headers: OpenAPIParameter[],
    operation: OpenAPIOperation,
    context: CodeGenerateContext
  ): ExampleOpenAPIParameter[];
  /**
   * 生成Cookie参数示例
   */
  abstract generateCookies(
    cookies: OpenAPIParameter[],
    operation: OpenAPIOperation,
    context: CodeGenerateContext
  ): ExampleOpenAPIParameter[];

  /**
   * 生成查询参数示例
   */
  abstract generateQueryParams(
    parameters: OpenAPIParameter[],
    operation: OpenAPIOperation,
    context: CodeGenerateContext
  ): ExampleOpenAPIParameter[];

  /**
   * 生成请求体示例
   */
  abstract generateBody(
    schema: OpenAPISchema | undefined,
    operation: OpenAPIOperation,
    context: CodeGenerateContext
  ): any;

  /**
   * 生成参数示例值（基础实现）
   */
  protected generateParameterExample(param: OpenAPIParameter, context: CodeGenerateContext): ExampleOpenAPIParameter {
    const value = param.example !== undefined
      ? param.example
      : this.generateSchemaExample(param.schema as OpenAPISchema, context);

    return { ...param, value };
  }

  /**
   * 根据schema生成示例数据（基础实现）
   * @param schema 当前需要生成示例的schema
   * @param context 代码生成上下文，包含完整的OpenAPI文档信息
   */
  protected generateSchemaExample(schema: OpenAPISchema, context: CodeGenerateContext): any {
    // 如果schema有example直接使用
    if (schema.example !== undefined) {
      return schema.example;
    }

    // 处理引用类型
    if (schema.$ref) {
      return this.resolveRef(schema.$ref, context);
    }

    switch (schema.type) {
      case 'string':
        return this.generateStringExample(schema);
      case 'number':
      case 'integer':
        return this.generateNumberExample(schema);
      case 'boolean':
        return true;
      case 'array':
        return this.generateArrayExample(schema, context);
      case 'object':
        return this.generateObjectExample(schema, context);
      default:
        return 'example-value';
    }
  }

  /**
   * 解析$ref引用
   */
  private resolveRef(ref: string, context: CodeGenerateContext): any {
    // 简单实现：从上下文中查找引用的schema
    const refParts = ref.split('/');
    const schemaName = refParts[refParts.length - 1];
    const components = context.openAPISpec?.components;
    const referencedSchema = components?.schemas?.[schemaName];

    if (referencedSchema) {
      return this.generateSchemaExample(referencedSchema, context);
    }

    // 如果找不到引用，返回占位值
    return { [schemaName || 'ref']: 'example-ref-value' };
  }

  /**
   * 生成字符串类型示例
   */
  private generateStringExample(schema: OpenAPISchema): string {
    switch (schema.format) {
      case 'email':
        return 'example@example.com';
      case 'uuid':
        return 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
      case 'date':
        return '2023-10-01';
      case 'date-time':
        return '2023-10-01T12:00:00Z';
      default:
        return 'example-string';
    }
  }

  /**
   * 生成数字类型示例
   */
  private generateNumberExample(schema: OpenAPISchema): number {
    return schema.minimum !== undefined ? schema.minimum : 123;
  }

  /**
   * 生成数组类型示例
   */
  private generateArrayExample(schema: OpenAPISchema, context: CodeGenerateContext): any[] {
    const items = this.generateSchemaExample(schema.items as OpenAPISchema, context);
    // 生成包含1-3个元素的数组
    return Array(Math.floor(Math.random() * 3) + 1).fill(items);
  }

  /**
   * 生成对象类型示例
   */
  private generateObjectExample(schema: OpenAPISchema, context: CodeGenerateContext): Record<string, any> {
    if (!schema.properties) return {};

    const obj: Record<string, any> = {};
    for (const [key, propSchema] of Object.entries(schema.properties)) {
      // 跳过只读属性
      if ((propSchema as OpenAPISchema).readOnly) continue;
      obj[key] = this.generateSchemaExample(propSchema as OpenAPISchema, context);
    }
    return obj;
  }
}
