import { AiohttpPythonRequestCodeGenerator } from '../../../../src/openapi/generator/languages/python/aiohttp';
import { HttpxPythonRequestCodeGenerator } from '../../../../src/openapi/generator/languages/python/httpx';
import { RequestsPythonRequestCodeGenerator } from '../../../../src/openapi/generator/languages/python/requests';
import {
  CodeGenerateContext,
  ExampleOpenAPIParameter,
  HttpMethod,
  OpenAPIOperation,
} from '../../../../src/types';
import { BASE_TEST_CONFIG, TEST_OPERATION } from './test-data';

type GeneratorCase = {
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

describe('python query parameter serialization', () => {
  const queryParams: ExampleOpenAPIParameter[] = [
    {
      name: 'tags',
      in: 'query',
      required: false,
      schema: {
        type: 'array',
        items: { type: 'string' },
      },
      value: ['red', 'blue green'],
    },
    {
      name: 'filter',
      in: 'query',
      required: false,
      schema: {
        type: 'object',
        properties: {
          role: { type: 'string' },
          name: { type: 'string' },
        },
      },
      value: {
        role: 'admin',
        name: 'Alex Smith',
      },
    },
  ];
  const context: CodeGenerateContext = {
    ...BASE_TEST_CONFIG.context,
  };

  const cases: GeneratorCase[] = [
    {
      name: 'python/requests',
      generator: new RequestsPythonRequestCodeGenerator(),
      includes: [
        "params=[('tags', 'red'), ('tags', 'blue green'), ('role', 'admin'), ('name', 'Alex Smith')]",
      ],
      excludes: [
        "'tags': 'red,blue green'",
        `"filter": "{'role': 'admin', 'name': 'Alex Smith'}"`,
      ],
    },
    {
      name: 'python/aiohttp',
      generator: new AiohttpPythonRequestCodeGenerator(),
      includes: [
        "url += ('?' if '?' not in url else '&') + 'tags=' + quote('red', safe='')",
        "url += ('?' if '?' not in url else '&') + 'tags=' + quote('blue green', safe='')",
        "url += ('?' if '?' not in url else '&') + 'role=' + quote('admin', safe='')",
        "url += ('?' if '?' not in url else '&') + 'name=' + quote('Alex Smith', safe='')",
      ],
      excludes: [
        "quote('red,blue green', safe='')",
        `quote("{'role': 'admin', 'name': 'Alex Smith'}", safe='')`,
      ],
    },
    {
      name: 'python/httpx',
      generator: new HttpxPythonRequestCodeGenerator(),
      includes: [
        "url += ('?' if '?' not in url else '&') + 'tags=' + quote('red', safe='')",
        "url += ('?' if '?' not in url else '&') + 'tags=' + quote('blue green', safe='')",
        "url += ('?' if '?' not in url else '&') + 'role=' + quote('admin', safe='')",
        "url += ('?' if '?' not in url else '&') + 'name=' + quote('Alex Smith', safe='')",
      ],
      excludes: [
        "quote('red,blue green', safe='')",
        `quote("{'role': 'admin', 'name': 'Alex Smith'}", safe='')`,
      ],
    },
  ];

  test.each(cases)(
    '$name expands array and object query parameters using form-style defaults',
    ({ generator, includes, excludes }) => {
      const code = generator.generateCode(
        BASE_TEST_CONFIG.path,
        'GET',
        BASE_TEST_CONFIG.baseUrl,
        TEST_OPERATION,
        [],
        [],
        queryParams,
        undefined,
        context
      );

      includes.forEach((snippet) => expect(code).toContain(snippet));
      excludes.forEach((snippet) => expect(code).not.toContain(snippet));
    }
  );
});
