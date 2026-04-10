import { RequestsPythonRequestCodeGenerator } from '../../../../src/openapi/generator/languages/python/requests';
import { AiohttpPythonRequestCodeGenerator } from '../../../../src/openapi/generator/languages/python/aiohttp';
import { HttpxPythonRequestCodeGenerator } from '../../../../src/openapi/generator/languages/python/httpx';
import {
  CodeGenerateContext,
  OpenAPIOperation,
  RequestCodeGenerator,
} from '../../../../src/types';

type PythonSyntaxCase = {
  name: string;
  generator: RequestCodeGenerator;
  entrypoint: string;
};

const INVALID_IDENTIFIER_OPERATION: OpenAPIOperation = {
  operationId: 'create-user-v2',
  summary: 'Create user',
  description: 'Creates a user with a non-identifier operation id',
  requestBody: {
    required: true,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
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

const PYTHON_CONTEXT: CodeGenerateContext = {
  baseUrl: 'https://api.example.com',
  language: 'python',
  library: 'requests',
  openAPISpec: {
    openapi: '3.0.0',
    info: {
      title: 'Identifier API',
      version: '1.0.0',
    },
    paths: {},
  },
  requestContentType: 'application/json',
  requestBodySchema: {
    type: 'object',
    properties: {
      name: { type: 'string' },
    },
  },
  responseContentType: 'application/json',
  responseBodySchema: {
    type: 'object',
    properties: {
      id: { type: 'string' },
    },
  },
  responseStatusCode: '201',
};

describe('python generator identifier sanitization syntax', () => {
  const cases: PythonSyntaxCase[] = [
    {
      name: 'python/requests',
      generator: new RequestsPythonRequestCodeGenerator(),
      entrypoint: 'result = create_user_v2()',
    },
    {
      name: 'python/aiohttp',
      generator: new AiohttpPythonRequestCodeGenerator(),
      entrypoint: 'asyncio.run(create_user_v2())',
    },
    {
      name: 'python/httpx',
      generator: new HttpxPythonRequestCodeGenerator(),
      entrypoint: 'asyncio.run(create_user_v2())',
    },
  ];

  for (const testCase of cases) {
    test(`sanitizes invalid operation identifiers for ${testCase.name}`, () => {
      const result = testCase.generator.generate(
        {
          path: '/users',
          method: 'POST',
          operation: INVALID_IDENTIFIER_OPERATION,
          pathItem: {},
        },
        PYTHON_CONTEXT
      );
      const code = result.code;

      expect(code).toContain('def create_user_v2():');
      expect(code).not.toContain('def create-user-v2():');
      expect(code).toContain(testCase.entrypoint);
      expect(code).not.toContain('create-user-v2()');
    });
  }
});
