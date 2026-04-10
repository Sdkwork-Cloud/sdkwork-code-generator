import {
  CodeGenerateContext,
  ExampleGenerator,
  ExampleOpenAPIParameter,
  OpenAPIOperation,
  OpenAPIParameter,
  OpenAPISchema,
} from '@/types';

export abstract class BaseExampleGenerator implements ExampleGenerator {
  abstract generateParameters(
    parameters: OpenAPIParameter[],
    operation: OpenAPIOperation,
    context: CodeGenerateContext
  ): ExampleOpenAPIParameter[];

  abstract generateHeaders(
    headers: OpenAPIParameter[],
    operation: OpenAPIOperation,
    context: CodeGenerateContext
  ): ExampleOpenAPIParameter[];

  abstract generateCookies(
    cookies: OpenAPIParameter[],
    operation: OpenAPIOperation,
    context: CodeGenerateContext
  ): ExampleOpenAPIParameter[];

  abstract generateQueryParams(
    parameters: OpenAPIParameter[],
    operation: OpenAPIOperation,
    context: CodeGenerateContext
  ): ExampleOpenAPIParameter[];

  abstract generateBody(
    schema: OpenAPISchema | undefined,
    operation: OpenAPIOperation,
    context: CodeGenerateContext
  ): any;

  protected generateParameterExample(
    param: OpenAPIParameter,
    context: CodeGenerateContext
  ): ExampleOpenAPIParameter {
    const exampleFromNamedExamples = param.examples
      ? Object.values(param.examples).find(
          (example) => example?.value !== undefined
        )?.value
      : undefined;
    const value =
      param.example !== undefined
        ? param.example
        : exampleFromNamedExamples !== undefined
        ? exampleFromNamedExamples
        : this.generateSchemaExample(param.schema as OpenAPISchema, context);

    return { ...param, value };
  }

  protected generateSchemaExample(
    schema: OpenAPISchema | undefined,
    context: CodeGenerateContext
  ): any {
    if (!schema) {
      return undefined;
    }

    if (schema.example !== undefined) {
      return schema.example;
    }

    if (schema.const !== undefined) {
      return schema.const;
    }

    if (schema.default !== undefined) {
      return schema.default;
    }

    if (schema.enum && schema.enum.length > 0) {
      return schema.enum[0];
    }

    if (schema.$ref) {
      return this.resolveRef(schema.$ref, context);
    }

    if (schema.allOf && schema.allOf.length > 0) {
      return this.generateAllOfExample(schema.allOf, context);
    }

    if (schema.anyOf && schema.anyOf.length > 0) {
      return this.generateSchemaExample(schema.anyOf[0], context);
    }

    if (schema.oneOf && schema.oneOf.length > 0) {
      return this.generateSchemaExample(schema.oneOf[0], context);
    }

    if (schema.type === 'object' || schema.properties) {
      return this.generateObjectExample(schema, context);
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
      case 'null':
        return null;
      default:
        return 'example-value';
    }
  }

  private resolveRef(ref: string, context: CodeGenerateContext): any {
    const resolved = this.resolveDocumentRef(ref, context);

    if (resolved) {
      return this.generateSchemaExample(resolved as OpenAPISchema, context);
    }

    const refParts = ref.split('/');
    const schemaName = refParts[refParts.length - 1];
    return { [schemaName || 'ref']: 'example-ref-value' };
  }

  private resolveDocumentRef(
    ref: string,
    context: CodeGenerateContext
  ): unknown {
    if (!ref.startsWith('#/')) {
      return undefined;
    }

    const pathParts = ref
      .slice(2)
      .split('/')
      .map((part) => part.replace(/~1/g, '/').replace(/~0/g, '~'));

    let current: any = context.openAPISpec;
    for (const part of pathParts) {
      current = current?.[part];
      if (current === undefined) {
        return undefined;
      }
    }

    return current;
  }

  private generateAllOfExample(
    schemas: OpenAPISchema[],
    context: CodeGenerateContext
  ): any {
    const examples = schemas.map((part) =>
      this.generateSchemaExample(part, context)
    );

    if (examples.every((example) => this.isPlainObject(example))) {
      return Object.assign({}, ...examples);
    }

    return examples[examples.length - 1];
  }

  private isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private generateStringExample(schema: OpenAPISchema): string {
    switch (schema.format) {
      case 'binary':
        return 'example-file.bin';
      case 'byte':
        return 'ZXhhbXBsZS1ieXRlcw==';
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

  private generateNumberExample(schema: OpenAPISchema): number {
    if (schema.minimum !== undefined) {
      return schema.minimum;
    }

    return 123;
  }

  private generateArrayExample(
    schema: OpenAPISchema,
    context: CodeGenerateContext
  ): any[] {
    const count =
      schema.minItems && schema.minItems > 0 ? Math.min(schema.minItems, 3) : 1;

    return Array.from({ length: count }, () =>
      this.generateSchemaExample(schema.items as OpenAPISchema, context)
    );
  }

  private generateObjectExample(
    schema: OpenAPISchema,
    context: CodeGenerateContext
  ): Record<string, any> {
    if (!schema.properties) {
      return {};
    }

    const obj: Record<string, any> = {};
    for (const [key, propSchema] of Object.entries(schema.properties)) {
      if ((propSchema as OpenAPISchema).readOnly) {
        continue;
      }

      obj[key] = this.generateSchemaExample(
        propSchema as OpenAPISchema,
        context
      );
    }

    return obj;
  }
}
