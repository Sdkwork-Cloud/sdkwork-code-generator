import { SuperagentJavaScriptRequestCodeGenerator } from '../../../../src/openapi/generator/languages/javascript/superagent';
import { SuperagentTypeScriptRequestCodeGenerator } from '../../../../src/openapi/generator/languages/typescript/superagent';
import { RequestsPythonRequestCodeGenerator } from '../../../../src/openapi/generator/languages/python/requests';
import { CpprestCppRequestCodeGenerator } from '../../../../src/openapi/generator/languages/cpp/cpprest';
import { CurlShellRequestCodeGenerator } from '../../../../src/openapi/generator/languages/shell/curl';
import {
  CodeGenerateContext,
  ExampleOpenAPIParameter,
  HttpMethod,
  OpenAPIOperation,
} from '../../../../src/types';
import { BASE_TEST_CONFIG } from './test-data';

type ByteFormatResponseCase = {
  name: string;
  generator: {
    generateCode: (
      path: string,
      method: HttpMethod,
      baseUrl: string,
      operation: OpenAPIOperation,
      cookies: ExampleOpenAPIParameter[],
      headers: ExampleOpenAPIParameter[],
      queryParams: ExampleOpenAPIParameter[],
      requestBody: any,
      context: CodeGenerateContext
    ) => string;
  };
  includes: string[];
  excludes: string[];
};

const BASE64_EXAMPLE = 'ZXhhbXBsZS1ieXRlcw==';

const BYTE_RESPONSE_OPERATION: OpenAPIOperation = {
  operationId: 'getBase64Payload',
  summary: 'Get base64 payload',
  description: 'Returns a base64-encoded payload as a string',
  responses: {
    '200': {
      description: 'Base64 payload response',
      content: {
        'text/plain': {
          schema: {
            type: 'string',
            format: 'byte',
            example: BASE64_EXAMPLE,
          },
        },
      },
    },
  },
};

describe('string/byte response support', () => {
  const context: CodeGenerateContext = {
    ...BASE_TEST_CONFIG.context,
    responseContentType: 'text/plain',
    responseBodySchema: {
      type: 'string',
      format: 'byte',
      example: BASE64_EXAMPLE,
    },
  };

  const cases: ByteFormatResponseCase[] = [
    {
      name: 'javascript/superagent',
      generator: new SuperagentJavaScriptRequestCodeGenerator(),
      includes: ['const data = response.text;'],
      excludes: [
        'request = request.buffer(true).parse(binaryParser);',
        'const data = response.body;',
        'Response bytes:',
      ],
    },
    {
      name: 'typescript/superagent',
      generator: new SuperagentTypeScriptRequestCodeGenerator(),
      includes: ['const data = response.text;'],
      excludes: [
        'request = request.buffer(true).parse(binaryParser);',
        'const data = response.body;',
        'Response bytes:',
      ],
    },
    {
      name: 'python/requests',
      generator: new RequestsPythonRequestCodeGenerator(),
      includes: ['data = response.text', 'return data'],
      excludes: ['data = response.content', 'Response bytes:'],
    },
    {
      name: 'cpp/cpprest',
      generator: new CpprestCppRequestCodeGenerator(),
      includes: ['return response.extract_string();', 'std::string body'],
      excludes: [
        'return response.extract_vector();',
        'std::vector<unsigned char>',
      ],
    },
    {
      name: 'shell/curl',
      generator: new CurlShellRequestCodeGenerator(),
      includes: ['response_file=$(mktemp)', 'cat "$response_file"'],
      excludes: [
        'Saved binary response to $output_file',
        'Response bytes: $(wc -c < "$output_file")',
      ],
    },
  ];

  for (const testCase of cases) {
    test(`treats format byte as a string response for ${testCase.name}`, () => {
      const code = testCase.generator.generateCode(
        BASE_TEST_CONFIG.path,
        'GET',
        BASE_TEST_CONFIG.baseUrl,
        BYTE_RESPONSE_OPERATION,
        [],
        [],
        [],
        undefined,
        context
      );

      testCase.includes.forEach((pattern) => {
        expect(code).toContain(pattern);
      });

      testCase.excludes.forEach((pattern) => {
        expect(code).not.toContain(pattern);
      });
    });
  }
});
