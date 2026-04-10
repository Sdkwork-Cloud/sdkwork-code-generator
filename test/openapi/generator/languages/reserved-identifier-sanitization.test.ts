import { HttpClientCSharpRequestCodeGenerator } from '../../../../src/openapi/generator/languages/csharp/httpclient';
import { FetchJavaScriptRequestCodeGenerator } from '../../../../src/openapi/generator/languages/javascript/fetch';
import { NetHttpGoRequestCodeGenerator } from '../../../../src/openapi/generator/languages/go/net_http';
import { RequestsPythonRequestCodeGenerator } from '../../../../src/openapi/generator/languages/python/requests';
import { ReqwestRustRequestCodeGenerator } from '../../../../src/openapi/generator/languages/rust/reqwest';
import {
  CodeGenerateContext,
  OpenAPIOperation,
  RequestCodeGenerator,
} from '../../../../src/types';

type ReservedCase = {
  name: string;
  generator: RequestCodeGenerator;
  operationId: string;
  expectedFragments: string[];
  unexpectedFragments: string[];
};

const BASE_OPERATION: OpenAPIOperation = {
  operationId: 'class',
  summary: 'Reserved identifier operation',
  description: 'Uses a reserved identifier as the operation id',
  responses: {
    '200': {
      description: 'ok',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              ok: { type: 'boolean' },
            },
          },
        },
      },
    },
  },
};

const BASE_CONTEXT: CodeGenerateContext = {
  baseUrl: 'https://api.example.com',
  language: 'javascript',
  library: 'fetch',
  openAPISpec: {
    openapi: '3.0.0',
    info: {
      title: 'Reserved Identifier API',
      version: '1.0.0',
    },
    paths: {},
  },
  responseContentType: 'application/json',
  responseBodySchema: {
    type: 'object',
    properties: {
      ok: { type: 'boolean' },
    },
  },
  responseStatusCode: '200',
};

describe('reserved identifier sanitization', () => {
  const cases: ReservedCase[] = [
    {
      name: 'javascript/fetch',
      generator: new FetchJavaScriptRequestCodeGenerator(),
      operationId: 'class',
      expectedFragments: ['async function apiRequestClass()'],
      unexpectedFragments: ['async function class()'],
    },
    {
      name: 'python/requests',
      generator: new RequestsPythonRequestCodeGenerator(),
      operationId: 'class',
      expectedFragments: ['def api_request_class():', 'result = api_request_class()'],
      unexpectedFragments: ['def class():', 'result = class()'],
    },
    {
      name: 'go/net_http',
      generator: new NetHttpGoRequestCodeGenerator(),
      operationId: 'func',
      expectedFragments: ['func apiRequestFunc() error {', 'apiRequestFunc()'],
      unexpectedFragments: ['func func() error {', 'if err := func();'],
    },
    {
      name: 'rust/reqwest',
      generator: new ReqwestRustRequestCodeGenerator(),
      operationId: 'struct',
      expectedFragments: ['async fn api_request_struct()', 'api_request_struct().await'],
      unexpectedFragments: ['async fn struct()'],
    },
    {
      name: 'csharp/httpclient',
      generator: new HttpClientCSharpRequestCodeGenerator(),
      operationId: 'class',
      expectedFragments: ['apiRequestClassAsync()'],
      unexpectedFragments: [
        'public static async Task classAsync()',
        'await classAsync();',
      ],
    },
  ];

  for (const testCase of cases) {
    test(`sanitizes reserved operation identifiers for ${testCase.name}`, () => {
      const operation: OpenAPIOperation = {
        ...BASE_OPERATION,
        operationId: testCase.operationId,
      };

      const result = testCase.generator.generate(
        {
          path: '/users',
          method: 'GET',
          operation,
          pathItem: {},
        },
        BASE_CONTEXT
      );
      const code = result.code;

      for (const expectedFragment of testCase.expectedFragments) {
        expect(code).toContain(expectedFragment);
      }

      for (const unexpectedFragment of testCase.unexpectedFragments) {
        expect(code).not.toContain(unexpectedFragment);
      }
    });
  }
});
