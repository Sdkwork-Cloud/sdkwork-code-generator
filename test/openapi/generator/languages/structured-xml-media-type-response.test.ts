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

type StructuredXmlResponseCase = {
  name: string;
  generator: RequestCodeGenerator;
  includes: string[];
  excludes: string[];
};

const STRUCTURED_XML_RESPONSE_OPERATION: OpenAPIOperation = {
  operationId: 'getSoapEnvelope',
  summary: 'Get SOAP envelope',
  description: 'Returns a structured XML payload',
  responses: {
    '200': {
      description: 'soap envelope',
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

describe('custom +xml response media type selection support', () => {
  const context: CodeGenerateContext = {
    baseUrl: 'https://api.example.com',
    language: 'javascript',
    library: 'axios',
    openAPISpec: {
      openapi: '3.0.0',
      info: {
        title: 'Structured XML API',
        version: '1.0.0',
      },
      paths: {},
    },
  };

  const requestDefinition: ApiRequestDefinition = {
    path: '/soap/messages/current',
    method: 'GET',
    operation: STRUCTURED_XML_RESPONSE_OPERATION,
    pathItem: {},
  };

  const cases: StructuredXmlResponseCase[] = [
    {
      name: 'javascript/fetch',
      generator: new FetchJavaScriptRequestCodeGenerator(),
      includes: ['const data = await response.text();'],
      excludes: ['response.json()'],
    },
    {
      name: 'typescript/got',
      generator: new GotTypeScriptRequestCodeGenerator(),
      includes: ['const data = response.body;'],
      excludes: ['JSON.parse(response.body)'],
    },
    {
      name: 'python/requests',
      generator: new RequestsPythonRequestCodeGenerator(),
      includes: ['data = response.text', 'return data'],
      excludes: ['return response.json()'],
    },
    {
      name: 'go/resty',
      generator: new RestyGoRequestCodeGenerator(),
      includes: [
        'func getSoapEnvelope() (string, error) {',
        'data := string(resp.Body())',
      ],
      excludes: ['json.Unmarshal(resp.Body(), &data)'],
    },
    {
      name: 'java/unirest',
      generator: new UnirestJavaRequestCodeGenerator(),
      includes: [
        'HttpResponse<String> response',
        '.asString();',
        'String data = response.getBody();',
      ],
      excludes: [
        '.asJson();',
        'JSONObject data = response.getBody().getObject();',
      ],
    },
    {
      name: 'php/guzzle',
      generator: new GuzzlePhpRequestCodeGenerator(),
      includes: ['$data = (string) $response->getBody();'],
      excludes: ['json_decode($response->getBody(), true)'],
    },
  ];

  for (const testCase of cases) {
    test(`selects XML string response handling for ${testCase.name}`, () => {
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
