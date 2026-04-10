import { CodeGeneratorFactory } from '../../../../src/openapi/generator/factory';
import {
  ApiRequestDefinition,
  CodeGenerateContext,
  Language,
  OpenAPIOperation,
} from '../../../../src/types';
import { BASE_TEST_CONFIG } from './test-data';

type MultipartByteFieldCase = {
  name: string;
  language: Language;
  library: string;
  includes: string[];
  excludes: string[];
};

const BASE64_EXAMPLE = 'ZXhhbXBsZS1ieXRlcw==';

const MULTIPART_BYTE_FIELD_OPERATION: OpenAPIOperation = {
  operationId: 'uploadBase64Payload',
  summary: 'Upload a base64 payload',
  description: 'Sends a base64 string as a multipart field',
  requestBody: {
    required: true,
    content: {
      'multipart/form-data': {
        schema: {
          type: 'object',
          example: {
            payload: BASE64_EXAMPLE,
          },
          properties: {
            payload: {
              type: 'string',
              format: 'byte',
            },
          },
          required: ['payload'],
        },
      },
    },
  },
  responses: {
    '200': {
      description: 'Upload completed',
    },
  },
};

const MULTIPART_BYTE_REQUEST_DEFINITION: ApiRequestDefinition = {
  path: '/api/v1/uploads/base64',
  method: 'POST',
  operation: MULTIPART_BYTE_FIELD_OPERATION,
  pathItem: {},
};

describe('multipart/form-data byte field support', () => {
  const cases: MultipartByteFieldCase[] = [
    {
      name: 'javascript/superagent',
      language: 'javascript',
      library: 'superagent',
      includes: ["request.field('payload', 'ZXhhbXBsZS1ieXRlcw==');"],
      excludes: ["request.attach('payload', 'ZXhhbXBsZS1ieXRlcw==');"],
    },
    {
      name: 'python/requests',
      language: 'python',
      library: 'requests',
      includes: ["data = {'payload': 'ZXhhbXBsZS1ieXRlcw=='}"],
      excludes: ["open('ZXhhbXBsZS1ieXRlcw==', 'rb')"],
    },
    {
      name: 'shell/curl',
      language: 'shell',
      library: 'curl',
      includes: ["-F 'payload=ZXhhbXBsZS1ieXRlcw=='"],
      excludes: [
        "-F 'payload=@ZXhhbXBsZS1ieXRlcw==;type=application/octet-stream'",
      ],
    },
  ];

  for (const testCase of cases) {
    test(`treats format byte as a multipart field for ${testCase.name}`, () => {
      const context: CodeGenerateContext = {
        ...BASE_TEST_CONFIG.context,
        language: testCase.language,
        library: testCase.library,
      };

      const result = CodeGeneratorFactory.generate(
        MULTIPART_BYTE_REQUEST_DEFINITION,
        context
      );

      testCase.includes.forEach((pattern) => {
        expect(result.code).toContain(pattern);
      });

      testCase.excludes.forEach((pattern) => {
        expect(result.code).not.toContain(pattern);
      });
    });
  }
});
