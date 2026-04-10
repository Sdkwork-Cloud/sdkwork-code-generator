import { HttpClientCSharpRequestCodeGenerator } from '../../../../src/openapi/generator/languages/csharp/httpclient';
import { DioDartRequestCodeGenerator } from '../../../../src/openapi/generator/languages/dart/dio';
import { UnirestJavaRequestCodeGenerator } from '../../../../src/openapi/generator/languages/java/unirest';
import { FetchJavaScriptRequestCodeGenerator } from '../../../../src/openapi/generator/languages/javascript/fetch';
import { RequestsPythonRequestCodeGenerator } from '../../../../src/openapi/generator/languages/python/requests';
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

describe('allowReserved deepObject query serialization', () => {
  const queryParams: ExampleOpenAPIParameter[] = [
    {
      name: 'filter',
      in: 'query',
      required: false,
      style: 'deepObject',
      allowReserved: true,
      schema: {
        type: 'object',
        properties: {
          redirect: { type: 'string' },
          role: { type: 'string' },
        },
      },
      value: {
        redirect: 'users/admin:all ready',
        role: 'admin',
      },
    },
  ];
  const context: CodeGenerateContext = {
    ...BASE_TEST_CONFIG.context,
  };
  const expectedQueryString =
    'filter[redirect]=users/admin:all%20ready&filter[role]=admin';

  const cases: GeneratorCase[] = [
    {
      name: 'javascript/fetch',
      generator: new FetchJavaScriptRequestCodeGenerator(),
      includes: [`const queryString = '${expectedQueryString}';`],
      excludes: ['filter%5Bredirect%5D', 'filter%5Brole%5D'],
    },
    {
      name: 'python/requests',
      generator: new RequestsPythonRequestCodeGenerator(),
      includes: [
        `url += ('?' if '?' not in url else '&') + '${expectedQueryString}'`,
      ],
      excludes: ['filter%5Bredirect%5D', 'filter%5Brole%5D'],
    },
    {
      name: 'java/unirest',
      generator: new UnirestJavaRequestCodeGenerator(),
      includes: [
        `url += (url.contains(\"?\") ? \"&\" : \"?\") + \"${expectedQueryString}\";`,
      ],
      excludes: ['filter%5Bredirect%5D', 'filter%5Brole%5D'],
    },
    {
      name: 'csharp/httpclient',
      generator: new HttpClientCSharpRequestCodeGenerator(),
      includes: [
        `url += (url.Contains(\"?\") ? \"&\" : \"?\") + \"${expectedQueryString}\";`,
      ],
      excludes: ['filter%5Bredirect%5D', 'filter%5Brole%5D'],
    },
    {
      name: 'dart/dio',
      generator: new DioDartRequestCodeGenerator(),
      includes: [
        `url += (url.contains('?') ? '&' : '?') + '${expectedQueryString}';`,
      ],
      excludes: ['filter%5Bredirect%5D', 'filter%5Brole%5D'],
    },
    {
      name: 'shell/curl',
      generator: new CurlShellRequestCodeGenerator(),
      includes: [
        `'https://api.example.com/api/v1/users?${expectedQueryString}'`,
      ],
      excludes: ['filter%5Bredirect%5D', 'filter%5Brole%5D'],
    },
  ];

  test.each(cases)(
    '$name preserves deepObject bracket keys when allowReserved is true',
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
