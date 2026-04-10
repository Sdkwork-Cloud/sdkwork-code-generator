import { FetchJavaScriptRequestCodeGenerator } from '../../../../src/openapi/generator/languages/javascript/fetch';
import { RequestsPythonRequestCodeGenerator } from '../../../../src/openapi/generator/languages/python/requests';
import { RestyGoRequestCodeGenerator } from '../../../../src/openapi/generator/languages/go/resty';
import { UnirestJavaRequestCodeGenerator } from '../../../../src/openapi/generator/languages/java/unirest';
import {
  ApiRequestDefinition,
  CodeGenerateContext,
  OpenAPIOperation,
  RequestCodeGenerator,
} from '../../../../src/types';

type DefaultFallbackCase = {
  name: string;
  generator: RequestCodeGenerator;
  includes: string[];
  excludes: string[];
};

const NO_CONTENT_WITH_DEFAULT_OPERATION: OpenAPIOperation = {
  operationId: 'deleteJob',
  summary: 'Delete a job',
  description: 'Deletes a job and only returns an error payload for fallback responses',
  responses: {
    '204': {
      description: 'deleted',
    },
    default: {
      description: 'unexpected error',
      content: {
        'application/problem+json': {
          schema: {
            type: 'object',
            properties: {
              title: { type: 'string', example: 'Unexpected Error' },
              status: { type: 'integer', example: 500 },
            },
          },
        },
      },
    },
  },
};

describe('default error response fallback selection support', () => {
  const context: CodeGenerateContext = {
    baseUrl: 'https://api.example.com',
    language: 'javascript',
    library: 'axios',
    openAPISpec: {
      openapi: '3.0.0',
      info: {
        title: 'Fallback API',
        version: '1.0.0',
      },
      paths: {},
    },
  };

  const requestDefinition: ApiRequestDefinition = {
    path: '/jobs/current',
    method: 'DELETE',
    operation: NO_CONTENT_WITH_DEFAULT_OPERATION,
    pathItem: {},
  };

  const cases: DefaultFallbackCase[] = [
    {
      name: 'javascript/fetch',
      generator: new FetchJavaScriptRequestCodeGenerator(),
      includes: [
        'if (response.status !== 204) {',
        'const data = await response.text();',
      ],
      excludes: ['if (!response.ok) {', 'await response.json()'],
    },
    {
      name: 'python/requests',
      generator: new RequestsPythonRequestCodeGenerator(),
      includes: [
        'if response.status_code != 204:',
        'data = response.text',
        'return data',
      ],
      excludes: ['response.raise_for_status()', 'return response.json()'],
    },
    {
      name: 'go/resty',
      generator: new RestyGoRequestCodeGenerator(),
      includes: [
        'func deleteJob() (string, error) {',
        'if resp.StatusCode() != 204 {',
        'data := string(resp.Body())',
      ],
      excludes: ['if resp.StatusCode() < 200 || resp.StatusCode() >= 300 {', 'json.Unmarshal(resp.Body(), &data)'],
    },
    {
      name: 'java/unirest',
      generator: new UnirestJavaRequestCodeGenerator(),
      includes: [
        'HttpResponse<String> response',
        '.asString();',
        'if (response.getStatus() != 204) {',
      ],
      excludes: ['.asJson();', 'JSONObject data = response.getBody().getObject();'],
    },
  ];

  for (const testCase of cases) {
    test(`keeps no-content success handling for ${testCase.name}`, () => {
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
