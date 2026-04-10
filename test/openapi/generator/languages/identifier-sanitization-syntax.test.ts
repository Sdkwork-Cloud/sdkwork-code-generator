import * as ts from 'typescript';
import { AxiosJavaScriptRequestCodeGenerator } from '../../../../src/openapi/generator/languages/javascript/axios';
import { FetchJavaScriptRequestCodeGenerator } from '../../../../src/openapi/generator/languages/javascript/fetch';
import { GotJavaScriptRequestCodeGenerator } from '../../../../src/openapi/generator/languages/javascript/got';
import { SuperagentJavaScriptRequestCodeGenerator } from '../../../../src/openapi/generator/languages/javascript/superagent';
import { AxiosTypeScriptRequestCodeGenerator } from '../../../../src/openapi/generator/languages/typescript/axios';
import { FetchTypeScriptRequestCodeGenerator } from '../../../../src/openapi/generator/languages/typescript/fetch';
import { GotTypeScriptRequestCodeGenerator } from '../../../../src/openapi/generator/languages/typescript/got';
import { SuperagentTypeScriptRequestCodeGenerator } from '../../../../src/openapi/generator/languages/typescript/superagent';
import {
  CodeGenerateContext,
  OpenAPIOperation,
  RequestCodeGenerator,
} from '../../../../src/types';

type SyntaxCase = {
  name: string;
  generator: RequestCodeGenerator;
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
            'user-name': { type: 'string' },
            active: { type: 'boolean' },
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

const IDENTIFIER_CONTEXT: CodeGenerateContext = {
  baseUrl: 'https://api.example.com',
  language: 'javascript',
  library: 'axios',
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
      'user-name': { type: 'string' },
      active: { type: 'boolean' },
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

const REQUEST_BODY = {
  'user-name': 'John Doe',
  active: true,
};

function getTypeScriptDiagnostics(code: string): string[] {
  const result = ts.transpileModule(code, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
    },
    reportDiagnostics: true,
  });

  return (result.diagnostics || []).map((diagnostic) =>
    ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')
  );
}

describe('generator identifier sanitization syntax', () => {
  const javascriptCases: SyntaxCase[] = [
    {
      name: 'javascript/fetch',
      generator: new FetchJavaScriptRequestCodeGenerator(),
    },
    {
      name: 'javascript/axios',
      generator: new AxiosJavaScriptRequestCodeGenerator(),
    },
    {
      name: 'javascript/got',
      generator: new GotJavaScriptRequestCodeGenerator(),
    },
    {
      name: 'javascript/superagent',
      generator: new SuperagentJavaScriptRequestCodeGenerator(),
    },
  ];

  for (const testCase of javascriptCases) {
    test(`sanitizes invalid operation identifiers for ${testCase.name}`, () => {
      const result = testCase.generator.generate(
        {
          path: '/users',
          method: 'POST',
          operation: INVALID_IDENTIFIER_OPERATION,
          pathItem: {},
        },
        IDENTIFIER_CONTEXT
      );
      const code = result.code;

      expect(() => new Function(code)).not.toThrow();
      expect(code).toContain('async function createUserV2()');
      expect(code).not.toContain('async function create-user-v2()');
    });
  }

  const typescriptCases: SyntaxCase[] = [
    {
      name: 'typescript/fetch',
      generator: new FetchTypeScriptRequestCodeGenerator(),
    },
    {
      name: 'typescript/axios',
      generator: new AxiosTypeScriptRequestCodeGenerator(),
    },
    {
      name: 'typescript/got',
      generator: new GotTypeScriptRequestCodeGenerator(),
    },
    {
      name: 'typescript/superagent',
      generator: new SuperagentTypeScriptRequestCodeGenerator(),
    },
  ];

  for (const testCase of typescriptCases) {
    test(`sanitizes invalid operation identifiers and request keys for ${testCase.name}`, () => {
      const result = testCase.generator.generate(
        {
          path: '/users',
          method: 'POST',
          operation: INVALID_IDENTIFIER_OPERATION,
          pathItem: {},
        },
        IDENTIFIER_CONTEXT
      );
      const code = result.code;

      expect(getTypeScriptDiagnostics(code)).toEqual([]);
      expect(code).toContain('interface CreateUserV2Request');
      expect(code).toContain('interface CreateUserV2Response');
      expect(code).toContain('async function createUserV2()');
      expect(code).toContain('"user-name": string;');
      expect(code).not.toContain('async function create-user-v2()');
      expect(code).not.toContain('user-name: string;');
    });
  }
});
