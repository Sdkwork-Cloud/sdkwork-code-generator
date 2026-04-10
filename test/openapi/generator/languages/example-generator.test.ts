import { DefaultExampleGenerator } from '../../../../src/openapi/generator/languages/example';
import { CodeGenerateContext, OpenAPIOperation, OpenAPISchema } from '../../../../src/types';

describe('DefaultExampleGenerator', () => {
  const generator = new DefaultExampleGenerator();
  const operation: OpenAPIOperation = {
    operationId: 'exampleOperation',
    responses: {
      '200': {
        description: 'ok',
      },
    },
  };

  const context: CodeGenerateContext = {
    baseUrl: 'https://api.example.com',
    language: 'javascript',
    library: 'axios',
    openAPISpec: {
      openapi: '3.0.0',
      info: {
        title: 'Example API',
        version: '1.0.0',
      },
      paths: {},
      components: {
        schemas: {
          SharedTag: {
            type: 'string',
            enum: ['shared-tag'],
          },
        },
      },
    },
  };

  test('should prefer enum and default values and generate deterministic arrays', () => {
    const schema: OpenAPISchema = {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['active', 'disabled'],
        },
        role: {
          type: 'string',
          default: 'admin',
        },
        tags: {
          type: 'array',
          minItems: 2,
          items: {
            $ref: '#/components/schemas/SharedTag',
          },
        },
      },
    };

    const example = generator.generateBody(schema, operation, context);

    expect(example).toEqual({
      status: 'active',
      role: 'admin',
      tags: ['shared-tag', 'shared-tag'],
    });
  });

  test('should merge allOf object schemas', () => {
    const schema: OpenAPISchema = {
      allOf: [
        {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1001 },
          },
        },
        {
          type: 'object',
          properties: {
            name: { type: 'string', example: 'sdkwork' },
          },
        },
      ],
    };

    expect(generator.generateBody(schema, operation, context)).toEqual({
      id: 1001,
      name: 'sdkwork',
    });
  });

  test('should pick the first branch for anyOf and oneOf schemas', () => {
    const anyOfSchema: OpenAPISchema = {
      anyOf: [
        { type: 'string', example: 'first-choice' },
        { type: 'integer', example: 9 },
      ],
    };
    const oneOfSchema: OpenAPISchema = {
      oneOf: [
        { type: 'integer', example: 42 },
        { type: 'string', example: 'fallback' },
      ],
    };

    expect(generator.generateBody(anyOfSchema, operation, context)).toBe(
      'first-choice'
    );
    expect(generator.generateBody(oneOfSchema, operation, context)).toBe(42);
  });

  test('should generate stable placeholders for binary and byte string formats', () => {
    const binarySchema: OpenAPISchema = {
      type: 'string',
      format: 'binary',
    };
    const byteSchema: OpenAPISchema = {
      type: 'string',
      format: 'byte',
    };

    expect(generator.generateBody(binarySchema, operation, context)).toBe(
      'example-file.bin'
    );
    expect(generator.generateBody(byteSchema, operation, context)).toBe(
      'ZXhhbXBsZS1ieXRlcw=='
    );
  });
});
