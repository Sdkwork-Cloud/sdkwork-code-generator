import { BaseRequestCodeGenerator } from '../../../../src/openapi/generator/generator';
import {
  ApiRequestDefinition,
  CodeGenerateContext,
  HttpMethod,
  Language,
  OpenAPIOperation,
  OpenAPIPathItem,
} from '../../../../src/types';
import {
  BASE_TEST_CONFIG,
  TEST_OPERATION,
  TEST_PATH_VARIABLES,
  TEST_HEADERS,
  TEST_QUERY_PARAMS,
  TEST_REQUEST_BODY,
} from './test-data';

/**
 * 测试基类实现
 */
class TestBaseGenerator extends BaseRequestCodeGenerator {
  getLanguage(): Language {
    return 'javascript';
  }

  getLibrary(): string {
    return 'test';
  }

  generateCode(
    path: string,
    method: HttpMethod,
    baseUrl: string,
    operation: any,
    cookies: any[],
    headers: any[],
    queryParams: any[],
    requestBody: any,
    context: any
  ): string {
    return `Test code for ${method} ${path}`;
  }
}

class RecordingBaseGenerator extends BaseRequestCodeGenerator {
  getLanguage(): Language {
    return 'javascript';
  }

  getLibrary(): string {
    return 'recording';
  }

  generateCode(
    path: string,
    method: HttpMethod,
    baseUrl: string,
    operation: OpenAPIOperation,
    cookies: any[],
    headers: any[],
    queryParams: any[],
    requestBody: any,
    context: CodeGenerateContext
  ): string {
    return JSON.stringify({
      path,
      method,
      baseUrl,
      operationId: operation.operationId,
      cookies,
      headers,
      queryParams,
      requestBody,
      requestContentType: (
        context as CodeGenerateContext & { requestContentType?: string }
      ).requestContentType,
      responseContentType: (
        context as CodeGenerateContext & { responseContentType?: string }
      ).responseContentType,
      responseBodySchema: (
        context as CodeGenerateContext & { responseBodySchema?: unknown }
      ).responseBodySchema,
      responseStatusCode: (
        context as CodeGenerateContext & { responseStatusCode?: string }
      ).responseStatusCode,
    });
  }
}

describe('BaseRequestCodeGenerator', () => {
  let generator: TestBaseGenerator;

  beforeEach(() => {
    generator = new TestBaseGenerator();
  });

  test('should implement abstract methods correctly', () => {
    expect(generator.getLanguage()).toBe('javascript');
    expect(generator.getLibrary()).toBe('test');
  });

  test('should generate code with all parameters', () => {
    const code = generator.generateCode(
      BASE_TEST_CONFIG.path,
      BASE_TEST_CONFIG.method,
      BASE_TEST_CONFIG.baseUrl,
      TEST_OPERATION,
      TEST_PATH_VARIABLES,
      TEST_HEADERS,
      TEST_QUERY_PARAMS,
      TEST_REQUEST_BODY,
      BASE_TEST_CONFIG.context
    );

    expect(code).toContain('Test code for GET');
    expect(code).toContain(BASE_TEST_CONFIG.path);
  });

  test('should handle empty parameters correctly', () => {
    const code = generator.generateCode(
      BASE_TEST_CONFIG.path,
      BASE_TEST_CONFIG.method,
      BASE_TEST_CONFIG.baseUrl,
      TEST_OPERATION,
      [],
      [],
      [],
      null,
      BASE_TEST_CONFIG.context
    );

    expect(code).toBeDefined();
    expect(typeof code).toBe('string');
  });

  test('should handle different HTTP methods', () => {
    const methods: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

    methods.forEach((method) => {
      const code = generator.generateCode(
        BASE_TEST_CONFIG.path,
        method,
        BASE_TEST_CONFIG.baseUrl,
        TEST_OPERATION,
        TEST_PATH_VARIABLES,
        TEST_HEADERS,
        TEST_QUERY_PARAMS,
        TEST_REQUEST_BODY,
        BASE_TEST_CONFIG.context
      );

      expect(code).toContain(`Test code for ${method}`);
    });
  });

  test('should merge path item parameters and keep cookies separate from headers', () => {
    const recordingGenerator = new RecordingBaseGenerator();
    const context: CodeGenerateContext = {
      baseUrl: 'https://api.example.com',
      language: 'javascript',
      library: 'recording',
      openAPISpec: {
        openapi: '3.0.0',
        info: {
          title: 'Recording API',
          version: '1.0.0',
        },
        paths: {},
        components: {
          parameters: {
            TenantId: {
              name: 'tenantId',
              in: 'path',
              required: true,
              schema: {
                type: 'string',
                example: 'tenant-123',
              },
            },
            SessionCookie: {
              name: 'sessionId',
              in: 'cookie',
              required: false,
              schema: {
                type: 'string',
                example: 'session-abc',
              },
            },
          },
        },
      },
    };

    const operation: OpenAPIOperation = {
      operationId: 'listUsers',
      parameters: [
        { $ref: '#/components/parameters/SessionCookie' } as any,
        {
          name: 'page',
          in: 'query',
          schema: { type: 'integer', default: 2 },
        },
        {
          name: 'X-Trace-Id',
          in: 'header',
          schema: { type: 'string', example: 'trace-1' },
        },
      ],
      responses: {
        '200': {
          description: 'ok',
        },
      },
    };

    const pathItem: OpenAPIPathItem = {
      parameters: [{ $ref: '#/components/parameters/TenantId' } as any],
    };

    const requestDefinition: ApiRequestDefinition = {
      path: '/tenants/{tenantId}/users',
      method: 'GET',
      operation,
      pathItem,
    };

    const result = recordingGenerator.generate(requestDefinition, context);
    const payload = JSON.parse(result.code);

    expect(payload.path).toBe('/tenants/tenant-123/users');
    expect(payload.cookies).toEqual([
      expect.objectContaining({
        name: 'sessionId',
        in: 'cookie',
        value: 'session-abc',
      }),
    ]);
    expect(payload.headers).toEqual([
      expect.objectContaining({
        name: 'X-Trace-Id',
        in: 'header',
        value: 'trace-1',
      }),
    ]);
    expect(payload.queryParams).toEqual([
      expect.objectContaining({
        name: 'page',
        in: 'query',
        value: 2,
      }),
    ]);
  });

  test('should percent-encode path parameter values as URL path segments', () => {
    const recordingGenerator = new RecordingBaseGenerator();
    const context: CodeGenerateContext = {
      baseUrl: 'https://api.example.com',
      language: 'javascript',
      library: 'recording',
      openAPISpec: {
        openapi: '3.0.0',
        info: {
          title: 'Path Encoding API',
          version: '1.0.0',
        },
        paths: {},
      },
    };

    const operation: OpenAPIOperation = {
      operationId: 'getFileVersion',
      parameters: [
        {
          name: 'filePath',
          in: 'path',
          required: true,
          schema: {
            type: 'string',
            example: 'folder/name with spaces',
          },
        },
        {
          name: 'versionId',
          in: 'path',
          required: true,
          schema: {
            type: 'string',
            example: 'v 1/2',
          },
        },
      ],
      responses: {
        '200': {
          description: 'ok',
        },
      },
    };

    const requestDefinition: ApiRequestDefinition = {
      path: '/files/{filePath}/versions/{versionId}',
      method: 'GET',
      operation,
      pathItem: {},
    };

    const result = recordingGenerator.generate(requestDefinition, context);
    const payload = JSON.parse(result.code);

    expect(payload.path).toBe(
      '/files/folder%2Fname%20with%20spaces/versions/v%201%2F2'
    );
    expect(payload.path).not.toContain('folder/name with spaces');
    expect(payload.path).not.toContain('v 1/2');
  });

  test('should serialize simple-style array path parameters without encoding their comma separators', () => {
    const recordingGenerator = new RecordingBaseGenerator();
    const context: CodeGenerateContext = {
      baseUrl: 'https://api.example.com',
      language: 'javascript',
      library: 'recording',
      openAPISpec: {
        openapi: '3.0.0',
        info: {
          title: 'Path Array API',
          version: '1.0.0',
        },
        paths: {},
      },
    };

    const operation: OpenAPIOperation = {
      operationId: 'getPalette',
      parameters: [
        {
          name: 'colors',
          in: 'path',
          required: true,
          schema: {
            type: 'array',
            items: { type: 'string' },
            example: ['red', 'blue green'],
          },
        },
      ],
      responses: {
        '200': {
          description: 'ok',
        },
      },
    };

    const requestDefinition: ApiRequestDefinition = {
      path: '/palettes/{colors}',
      method: 'GET',
      operation,
      pathItem: {},
    };

    const result = recordingGenerator.generate(requestDefinition, context);
    const payload = JSON.parse(result.code);

    expect(payload.path).toBe('/palettes/red,blue%20green');
    expect(payload.path).not.toContain('red%2Cblue%20green');
  });

  test('should serialize simple-style object path parameters as key-value tuples', () => {
    const recordingGenerator = new RecordingBaseGenerator();
    const context: CodeGenerateContext = {
      baseUrl: 'https://api.example.com',
      language: 'javascript',
      library: 'recording',
      openAPISpec: {
        openapi: '3.0.0',
        info: {
          title: 'Path Object API',
          version: '1.0.0',
        },
        paths: {},
      },
    };

    const operation: OpenAPIOperation = {
      operationId: 'getScopedUser',
      parameters: [
        {
          name: 'user',
          in: 'path',
          required: true,
          schema: {
            type: 'object',
            properties: {
              role: { type: 'string' },
              name: { type: 'string' },
            },
            example: {
              role: 'admin',
              name: 'Alex Smith',
            },
          },
        },
      ],
      responses: {
        '200': {
          description: 'ok',
        },
      },
    };

    const requestDefinition: ApiRequestDefinition = {
      path: '/users/{user}',
      method: 'GET',
      operation,
      pathItem: {},
    };

    const result = recordingGenerator.generate(requestDefinition, context);
    const payload = JSON.parse(result.code);

    expect(payload.path).toBe('/users/role,admin,name,Alex%20Smith');
    expect(payload.path).not.toContain('[object%20Object]');
  });

  test('should infer auth placeholders and support non-json request body media types', () => {
    const recordingGenerator = new RecordingBaseGenerator();
    const context: CodeGenerateContext = {
      baseUrl: 'https://api.example.com',
      language: 'javascript',
      library: 'recording',
      openAPISpec: {
        openapi: '3.0.0',
        info: {
          title: 'Security API',
          version: '1.0.0',
        },
        paths: {},
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
            },
            apiKeyQuery: {
              type: 'apiKey',
              in: 'query',
              name: 'api_key',
            },
            apiKeyCookie: {
              type: 'apiKey',
              in: 'cookie',
              name: 'session_id',
            },
          },
        },
      },
    };

    const operation: OpenAPIOperation = {
      operationId: 'createNote',
      security: [{ bearerAuth: [], apiKeyQuery: [], apiKeyCookie: [] }],
      requestBody: {
        required: true,
        content: {
          'text/plain': {
            schema: {
              type: 'string',
              example: 'hello world',
            },
          },
        },
      },
      responses: {
        '201': {
          description: 'created',
        },
      },
    };

    const requestDefinition: ApiRequestDefinition = {
      path: '/notes',
      method: 'POST',
      operation,
      pathItem: {},
    };

    const result = recordingGenerator.generate(requestDefinition, context);
    const payload = JSON.parse(result.code);

    expect(payload.requestContentType).toBe('text/plain');
    expect(payload.requestBody).toBe('hello world');
    expect(payload.headers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'Authorization',
          in: 'header',
          value: 'Bearer <token>',
        }),
      ])
    );
    expect(payload.queryParams).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'api_key',
          in: 'query',
          value: '<api_key>',
        }),
      ])
    );
    expect(payload.cookies).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'session_id',
          in: 'cookie',
          value: '<session_id>',
        }),
      ])
    );
  });

  test('should prioritize custom +json request body media types over plain text', () => {
    const recordingGenerator = new RecordingBaseGenerator();
    const context: CodeGenerateContext = {
      baseUrl: 'https://api.example.com',
      language: 'javascript',
      library: 'recording',
      openAPISpec: {
        openapi: '3.0.0',
        info: {
          title: 'JSON API',
          version: '1.0.0',
        },
        paths: {},
      },
    };

    const operation: OpenAPIOperation = {
      operationId: 'createArticle',
      requestBody: {
        required: true,
        content: {
          'text/plain': {
            schema: {
              type: 'string',
              example: 'fallback body',
            },
          },
          'application/vnd.api+json': {
            schema: {
              type: 'object',
              properties: {
                data: {
                  type: 'object',
                  properties: {
                    type: { type: 'string', example: 'articles' },
                  },
                },
              },
            },
          },
        },
      },
      responses: {
        '201': {
          description: 'created',
        },
      },
    };

    const requestDefinition: ApiRequestDefinition = {
      path: '/articles',
      method: 'POST',
      operation,
      pathItem: {},
    };

    const result = recordingGenerator.generate(requestDefinition, context);
    const payload = JSON.parse(result.code);

    expect(payload.requestContentType).toBe('application/vnd.api+json');
    expect(payload.requestBody).toEqual(
      expect.objectContaining({
        data: expect.any(Object),
      })
    );
    expect(payload.requestBody).not.toBe('fallback body');
  });

  test('should prioritize application/xml request body media types over plain text', () => {
    const recordingGenerator = new RecordingBaseGenerator();
    const context: CodeGenerateContext = {
      baseUrl: 'https://api.example.com',
      language: 'javascript',
      library: 'recording',
      openAPISpec: {
        openapi: '3.0.0',
        info: {
          title: 'XML API',
          version: '1.0.0',
        },
        paths: {},
      },
    };

    const operation: OpenAPIOperation = {
      operationId: 'createXmlMessage',
      requestBody: {
        required: true,
        content: {
          'text/plain': {
            schema: {
              type: 'string',
              example: 'fallback body',
            },
          },
          'application/xml': {
            schema: {
              type: 'string',
              example: '<message>Hello XML</message>',
            },
          },
        },
      },
      responses: {
        '201': {
          description: 'created',
        },
      },
    };

    const requestDefinition: ApiRequestDefinition = {
      path: '/xml/messages',
      method: 'POST',
      operation,
      pathItem: {},
    };

    const result = recordingGenerator.generate(requestDefinition, context);
    const payload = JSON.parse(result.code);

    expect(payload.requestContentType).toBe('application/xml');
    expect(payload.requestBody).toBe('<message>Hello XML</message>');
  });

  test('should prioritize custom +xml request body media types over plain text', () => {
    const recordingGenerator = new RecordingBaseGenerator();
    const context: CodeGenerateContext = {
      baseUrl: 'https://api.example.com',
      language: 'javascript',
      library: 'recording',
      openAPISpec: {
        openapi: '3.0.0',
        info: {
          title: 'Structured XML API',
          version: '1.0.0',
        },
        paths: {},
      },
    };

    const operation: OpenAPIOperation = {
      operationId: 'createSoapEnvelope',
      requestBody: {
        required: true,
        content: {
          'text/plain': {
            schema: {
              type: 'string',
              example: 'fallback body',
            },
          },
          'application/soap+xml': {
            schema: {
              type: 'string',
              example: '<Envelope><Body>Hello SOAP</Body></Envelope>',
            },
          },
        },
      },
      responses: {
        '201': {
          description: 'created',
        },
      },
    };

    const requestDefinition: ApiRequestDefinition = {
      path: '/soap/messages',
      method: 'POST',
      operation,
      pathItem: {},
    };

    const result = recordingGenerator.generate(requestDefinition, context);
    const payload = JSON.parse(result.code);

    expect(payload.requestContentType).toBe('application/soap+xml');
    expect(payload.requestBody).toBe(
      '<Envelope><Body>Hello SOAP</Body></Envelope>'
    );
  });

  test('should treat multipart request media types case-insensitively', () => {
    const recordingGenerator = new RecordingBaseGenerator();
    const context: CodeGenerateContext = {
      baseUrl: 'https://api.example.com',
      language: 'javascript',
      library: 'recording',
      openAPISpec: {
        openapi: '3.0.0',
        info: {
          title: 'Upload API',
          version: '1.0.0',
        },
        paths: {},
      },
    };

    const operation: OpenAPIOperation = {
      operationId: 'uploadAttachment',
      requestBody: {
        required: true,
        content: {
          'Text/Plain': {
            schema: {
              type: 'string',
              example: 'fallback body',
            },
          },
          'Multipart/Form-Data': {
            schema: {
              type: 'object',
              properties: {
                description: {
                  type: 'string',
                  example: 'Quarterly report',
                },
                file: {
                  type: 'string',
                  format: 'binary',
                  example: 'report.pdf',
                },
              },
            },
          },
        },
      },
      responses: {
        '201': {
          description: 'uploaded',
        },
      },
    };

    const requestDefinition: ApiRequestDefinition = {
      path: '/attachments',
      method: 'POST',
      operation,
      pathItem: {},
    };

    const result = recordingGenerator.generate(requestDefinition, context);
    const payload = JSON.parse(result.code);

    expect(payload.requestContentType).toBe('Multipart/Form-Data');
    expect(payload.requestBody).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'description',
          kind: 'field',
        }),
        expect.objectContaining({
          name: 'file',
          kind: 'file',
          filename: 'report.pdf',
        }),
      ])
    );
  });

  test('should select non-json success response media types into generation context', () => {
    const recordingGenerator = new RecordingBaseGenerator();
    const context: CodeGenerateContext = {
      baseUrl: 'https://api.example.com',
      language: 'javascript',
      library: 'recording',
      openAPISpec: {
        openapi: '3.0.0',
        info: {
          title: 'Response API',
          version: '1.0.0',
        },
        paths: {},
      },
    };

    const operation: OpenAPIOperation = {
      operationId: 'downloadMessage',
      responses: {
        '200': {
          description: 'plain text response',
          content: {
            'text/plain': {
              schema: {
                type: 'string',
                example: 'hello world',
              },
            },
          },
        },
        '400': {
          description: 'validation error',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: { type: 'string' },
                },
              },
            },
          },
        },
      },
    };

    const requestDefinition: ApiRequestDefinition = {
      path: '/messages/latest',
      method: 'GET',
      operation,
      pathItem: {},
    };

    const result = recordingGenerator.generate(requestDefinition, context);
    const payload = JSON.parse(result.code);

    expect(payload.responseContentType).toBe('text/plain');
    expect(payload.responseStatusCode).toBe('200');
    expect(payload.responseBodySchema).toEqual(
      expect.objectContaining({
        type: 'string',
        example: 'hello world',
      })
    );
  });

  test('should prioritize custom +json success response media types over plain text', () => {
    const recordingGenerator = new RecordingBaseGenerator();
    const context: CodeGenerateContext = {
      baseUrl: 'https://api.example.com',
      language: 'javascript',
      library: 'recording',
      openAPISpec: {
        openapi: '3.0.0',
        info: {
          title: 'Problem API',
          version: '1.0.0',
        },
        paths: {},
      },
    };

    const operation: OpenAPIOperation = {
      operationId: 'getArticle',
      responses: {
        '200': {
          description: 'problem details or resource',
          content: {
            'text/plain': {
              schema: {
                type: 'string',
                example: 'fallback response',
              },
            },
            'application/problem+json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string', example: 'Bad Request' },
                  status: { type: 'integer', example: 400 },
                },
              },
            },
          },
        },
      },
    };

    const requestDefinition: ApiRequestDefinition = {
      path: '/articles/current',
      method: 'GET',
      operation,
      pathItem: {},
    };

    const result = recordingGenerator.generate(requestDefinition, context);
    const payload = JSON.parse(result.code);

    expect(payload.responseContentType).toBe('application/problem+json');
    expect(payload.responseStatusCode).toBe('200');
    expect(payload.responseBodySchema).toEqual(
      expect.objectContaining({
        type: 'object',
      })
    );
  });

  test('should prioritize application/xml success response media types over plain text', () => {
    const recordingGenerator = new RecordingBaseGenerator();
    const context: CodeGenerateContext = {
      baseUrl: 'https://api.example.com',
      language: 'javascript',
      library: 'recording',
      openAPISpec: {
        openapi: '3.0.0',
        info: {
          title: 'XML Response API',
          version: '1.0.0',
        },
        paths: {},
      },
    };

    const operation: OpenAPIOperation = {
      operationId: 'getXmlMessage',
      responses: {
        '200': {
          description: 'xml or text response',
          content: {
            'text/plain': {
              schema: {
                type: 'string',
                example: 'fallback response',
              },
            },
            'application/xml': {
              schema: {
                type: 'string',
                example: '<message>Hello XML</message>',
              },
            },
          },
        },
      },
    };

    const requestDefinition: ApiRequestDefinition = {
      path: '/xml/messages/current',
      method: 'GET',
      operation,
      pathItem: {},
    };

    const result = recordingGenerator.generate(requestDefinition, context);
    const payload = JSON.parse(result.code);

    expect(payload.responseContentType).toBe('application/xml');
    expect(payload.responseStatusCode).toBe('200');
    expect(payload.responseBodySchema).toEqual(
      expect.objectContaining({
        type: 'string',
        example: '<message>Hello XML</message>',
      })
    );
  });

  test('should prioritize custom +xml success response media types over plain text', () => {
    const recordingGenerator = new RecordingBaseGenerator();
    const context: CodeGenerateContext = {
      baseUrl: 'https://api.example.com',
      language: 'javascript',
      library: 'recording',
      openAPISpec: {
        openapi: '3.0.0',
        info: {
          title: 'Structured XML Response API',
          version: '1.0.0',
        },
        paths: {},
      },
    };

    const operation: OpenAPIOperation = {
      operationId: 'getSoapEnvelope',
      responses: {
        '200': {
          description: 'soap or text response',
          content: {
            'text/plain': {
              schema: {
                type: 'string',
                example: 'fallback response',
              },
            },
            'application/soap+xml': {
              schema: {
                type: 'string',
                example: '<Envelope><Body>Hello SOAP</Body></Envelope>',
              },
            },
          },
        },
      },
    };

    const requestDefinition: ApiRequestDefinition = {
      path: '/soap/messages/current',
      method: 'GET',
      operation,
      pathItem: {},
    };

    const result = recordingGenerator.generate(requestDefinition, context);
    const payload = JSON.parse(result.code);

    expect(payload.responseContentType).toBe('application/soap+xml');
    expect(payload.responseStatusCode).toBe('200');
    expect(payload.responseBodySchema).toEqual(
      expect.objectContaining({
        type: 'string',
        example: '<Envelope><Body>Hello SOAP</Body></Envelope>',
      })
    );
  });

  test('should select created success status codes into generation context', () => {
    const recordingGenerator = new RecordingBaseGenerator();
    const context: CodeGenerateContext = {
      baseUrl: 'https://api.example.com',
      language: 'javascript',
      library: 'recording',
      openAPISpec: {
        openapi: '3.0.0',
        info: {
          title: 'Create API',
          version: '1.0.0',
        },
        paths: {},
      },
    };

    const operation: OpenAPIOperation = {
      operationId: 'createMessage',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                message: { type: 'string' },
              },
            },
          },
        },
      },
      responses: {
        '201': {
          description: 'created',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                },
              },
            },
          },
        },
      },
    };

    const requestDefinition: ApiRequestDefinition = {
      path: '/messages',
      method: 'POST',
      operation,
      pathItem: {},
    };

    const result = recordingGenerator.generate(requestDefinition, context);
    const payload = JSON.parse(result.code);

    expect(payload.responseStatusCode).toBe('201');
    expect(payload.responseContentType).toBe('application/json');
  });

  test('should preserve wildcard success status codes in generation context', () => {
    const recordingGenerator = new RecordingBaseGenerator();
    const context: CodeGenerateContext = {
      baseUrl: 'https://api.example.com',
      language: 'javascript',
      library: 'recording',
      openAPISpec: {
        openapi: '3.0.0',
        info: {
          title: 'Wildcard API',
          version: '1.0.0',
        },
        paths: {},
      },
    };

    const operation: OpenAPIOperation = {
      operationId: 'createMessageAsync',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                message: { type: 'string' },
              },
            },
          },
        },
      },
      responses: {
        '2XX': {
          description: 'success',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                },
              },
            },
          },
        },
      },
    };

    const requestDefinition: ApiRequestDefinition = {
      path: '/messages',
      method: 'POST',
      operation,
      pathItem: {},
    };

    const result = recordingGenerator.generate(requestDefinition, context);
    const payload = JSON.parse(result.code);

    expect(payload.responseStatusCode).toBe('2XX');
    expect(payload.responseContentType).toBe('application/json');
  });

  test('should preserve default response status codes in generation context', () => {
    const recordingGenerator = new RecordingBaseGenerator();
    const context: CodeGenerateContext = {
      baseUrl: 'https://api.example.com',
      language: 'javascript',
      library: 'recording',
      openAPISpec: {
        openapi: '3.0.0',
        info: {
          title: 'Default API',
          version: '1.0.0',
        },
        paths: {},
      },
    };

    const operation: OpenAPIOperation = {
      operationId: 'getFallbackMessage',
      responses: {
        default: {
          description: 'generic response',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: { type: 'string' },
                },
              },
            },
          },
        },
      },
    };

    const requestDefinition: ApiRequestDefinition = {
      path: '/messages/fallback',
      method: 'GET',
      operation,
      pathItem: {},
    };

    const result = recordingGenerator.generate(requestDefinition, context);
    const payload = JSON.parse(result.code);

    expect(payload.responseStatusCode).toBe('default');
    expect(payload.responseContentType).toBe('application/json');
  });

  test('should keep explicit no-content success responses ahead of default error payloads', () => {
    const recordingGenerator = new RecordingBaseGenerator();
    const context: CodeGenerateContext = {
      baseUrl: 'https://api.example.com',
      language: 'javascript',
      library: 'recording',
      openAPISpec: {
        openapi: '3.0.0',
        info: {
          title: 'Fallback API',
          version: '1.0.0',
        },
        paths: {},
      },
    };

    const operation: OpenAPIOperation = {
      operationId: 'deleteMessage',
      responses: {
        '204': {
          description: 'deleted',
        },
        default: {
          description: 'error payload',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: { type: 'string' },
                },
              },
            },
          },
        },
      },
    };

    const requestDefinition: ApiRequestDefinition = {
      path: '/messages/current',
      method: 'DELETE',
      operation,
      pathItem: {},
    };

    const result = recordingGenerator.generate(requestDefinition, context);
    const payload = JSON.parse(result.code);

    expect(payload.responseStatusCode).toBe('204');
    expect(payload.responseContentType).toBeUndefined();
    expect(payload.responseBodySchema).toBeUndefined();
  });
});
