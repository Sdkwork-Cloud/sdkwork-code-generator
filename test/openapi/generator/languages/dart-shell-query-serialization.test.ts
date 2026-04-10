import { HttpDartRequestCodeGenerator } from '../../../../src/openapi/generator/languages/dart/http';
import { CurlShellRequestCodeGenerator } from '../../../../src/openapi/generator/languages/shell/curl';
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

describe('dart/shell query parameter serialization', () => {
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
      name: 'dart/http',
      generator: new HttpDartRequestCodeGenerator(),
      includes: [
        "queryParts.add(Uri.encodeQueryComponent('tags') + '=' + Uri.encodeQueryComponent('red'));",
        "queryParts.add(Uri.encodeQueryComponent('tags') + '=' + Uri.encodeQueryComponent('blue green'));",
        "queryParts.add(Uri.encodeQueryComponent('role') + '=' + Uri.encodeQueryComponent('admin'));",
        "queryParts.add(Uri.encodeQueryComponent('name') + '=' + Uri.encodeQueryComponent('Alex Smith'));",
      ],
      excludes: ['"tags": "red,blue green"', '"filter": "[object Object]"'],
    },
    {
      name: 'shell/curl',
      generator: new CurlShellRequestCodeGenerator(),
      includes: [
        'https://api.example.com/api/v1/users?tags=red&tags=blue+green&role=admin&name=Alex+Smith',
      ],
      excludes: ['tags=red%2Cblue+green', 'filter=%5Bobject+Object%5D'],
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
