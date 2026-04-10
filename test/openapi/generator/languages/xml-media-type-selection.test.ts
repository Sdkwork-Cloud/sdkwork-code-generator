import { FetchJavaScriptRequestCodeGenerator } from '../../../../src/openapi/generator/languages/javascript/fetch';
import { RequestsPythonRequestCodeGenerator } from '../../../../src/openapi/generator/languages/python/requests';
import { OkHttpJavaRequestCodeGenerator } from '../../../../src/openapi/generator/languages/java/okhttp';
import { HttpClientCSharpRequestCodeGenerator } from '../../../../src/openapi/generator/languages/csharp/httpclient';
import {
  ApiRequestDefinition,
  CodeGenerateContext,
  RequestCodeGenerator,
} from '../../../../src/types';

type XmlRequestSelectionCase = {
  name: string;
  generator: RequestCodeGenerator;
  includes: string[];
  excludes: string[];
};

const XML_SELECTION_REQUEST = {
  operationId: 'createXmlUser',
  summary: 'Create XML user',
  description: 'Creates a user using an XML payload',
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
          example: '<user><name>John Doe</name></user>',
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

describe('application/xml request media type selection support', () => {
  const context: CodeGenerateContext = {
    baseUrl: 'https://api.example.com',
    language: 'javascript',
    library: 'axios',
    openAPISpec: {
      openapi: '3.0.0',
      info: {
        title: 'XML API',
        version: '1.0.0',
      },
      paths: {},
    },
  };

  const requestDefinition: ApiRequestDefinition = {
    path: '/xml/users',
    method: 'POST',
    operation: XML_SELECTION_REQUEST as any,
    pathItem: {},
  };

  const cases: XmlRequestSelectionCase[] = [
    {
      name: 'javascript/fetch',
      generator: new FetchJavaScriptRequestCodeGenerator(),
      includes: [
        "'Content-Type': 'application/xml'",
        "body: '<user><name>John Doe</name></user>'",
      ],
      excludes: ["'Content-Type': 'text/plain'", "body: 'fallback body'"],
    },
    {
      name: 'python/requests',
      generator: new RequestsPythonRequestCodeGenerator(),
      includes: [
        "headers={'Content-Type': 'application/xml'}",
        "data='<user><name>John Doe</name></user>'",
      ],
      excludes: ["'Content-Type': 'text/plain'", "data='fallback body'"],
    },
    {
      name: 'java/okhttp',
      generator: new OkHttpJavaRequestCodeGenerator(),
      includes: [
        'MediaType.parse("application/xml")',
        '"<user><name>John Doe</name></user>"',
      ],
      excludes: ['MediaType.parse("text/plain")', '"fallback body"'],
    },
    {
      name: 'csharp/httpclient',
      generator: new HttpClientCSharpRequestCodeGenerator(),
      includes: [
        'new StringContent("<user><name>John Doe</name></user>", Encoding.UTF8, "application/xml");',
        '<user><name>John Doe</name></user>',
      ],
      excludes: ['"text/plain"', 'fallback body'],
    },
  ];

  for (const testCase of cases) {
    test(`selects XML request handling for ${testCase.name}`, () => {
      const result = testCase.generator.generate(requestDefinition, context);
      const code = result.code;

      testCase.includes.forEach((pattern) => {
        expect(code).toContain(pattern);
      });

      testCase.excludes.forEach((pattern) => {
        expect(code).not.toContain(pattern);
      });
    });
  }
});
