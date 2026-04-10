import { FetchJavaScriptRequestCodeGenerator } from '../../../../src/openapi/generator/languages/javascript/fetch';
import { GotTypeScriptRequestCodeGenerator } from '../../../../src/openapi/generator/languages/typescript/got';
import { RequestsPythonRequestCodeGenerator } from '../../../../src/openapi/generator/languages/python/requests';
import { RestyGoRequestCodeGenerator } from '../../../../src/openapi/generator/languages/go/resty';
import { UnirestJavaRequestCodeGenerator } from '../../../../src/openapi/generator/languages/java/unirest';
import { GuzzlePhpRequestCodeGenerator } from '../../../../src/openapi/generator/languages/php/guzzle';
import {
  ApiRequestDefinition,
  CodeGenerateContext,
  OpenAPIOperation,
  RequestCodeGenerator,
} from '../../../../src/types';

type JsonResponseCase = {
  name: string;
  generator: RequestCodeGenerator;
  includes: string[];
  excludes: string[];
};

const JSON_RESPONSE_OPERATION: OpenAPIOperation = {
  operationId: 'getProblem',
  summary: 'Get problem details',
  description: 'Returns structured problem details payloads',
  responses: {
    '200': {
      description: 'problem details',
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

describe('custom +json response media type selection support', () => {
  const context: CodeGenerateContext = {
    baseUrl: 'https://api.example.com',
    language: 'javascript',
    library: 'axios',
    openAPISpec: {
      openapi: '3.0.0',
      info: {
        title: 'Problem API',
        version: '1.0.0',
      },
      paths: {},
    },
  };

  const requestDefinition: ApiRequestDefinition = {
    path: '/problems/current',
    method: 'GET',
    operation: JSON_RESPONSE_OPERATION,
    pathItem: {},
  };

  const cases: JsonResponseCase[] = [
    {
      name: 'javascript/fetch',
      generator: new FetchJavaScriptRequestCodeGenerator(),
      includes: ['const data = await response.json();'],
      excludes: ['response.text()'],
    },
    {
      name: 'typescript/got',
      generator: new GotTypeScriptRequestCodeGenerator(),
      includes: ['const data = JSON.parse(response.body);'],
      excludes: ['const data = response.body;'],
    },
    {
      name: 'python/requests',
      generator: new RequestsPythonRequestCodeGenerator(),
      includes: ['data = response.json()', 'return data'],
      excludes: ['data = response.text'],
    },
    {
      name: 'go/resty',
      generator: new RestyGoRequestCodeGenerator(),
      includes: [
        'func getProblem() (map[string]interface{}, error) {',
        'json.Unmarshal(resp.Body(), &data)',
      ],
      excludes: ['data := string(resp.Body())'],
    },
    {
      name: 'java/unirest',
      generator: new UnirestJavaRequestCodeGenerator(),
      includes: [
        'HttpResponse<JsonNode> response',
        '.asJson();',
        'JSONObject data = response.getBody().getObject();',
      ],
      excludes: ['.asString();', 'String data = response.getBody();'],
    },
    {
      name: 'php/guzzle',
      generator: new GuzzlePhpRequestCodeGenerator(),
      includes: ['$data = json_decode($response->getBody(), true);'],
      excludes: ['$data = (string) $response->getBody();'],
    },
  ];

  for (const testCase of cases) {
    test(`selects JSON response handling for ${testCase.name}`, () => {
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
