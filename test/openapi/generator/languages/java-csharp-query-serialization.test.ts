import { RestsharpCsharpRequestCodeGenerator } from '../../../../src/openapi/generator/languages/csharp/restsharp';
import { ApacheHttpClientJavaRequestCodeGenerator } from '../../../../src/openapi/generator/languages/java/apache_httpclient';
import { UnirestJavaRequestCodeGenerator } from '../../../../src/openapi/generator/languages/java/unirest';
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

describe('java/csharp query parameter serialization', () => {
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
      name: 'java/apache-httpclient',
      generator: new ApacheHttpClientJavaRequestCodeGenerator(),
      includes: [
        'url += "?tags=" + URLEncoder.encode("red", StandardCharsets.UTF_8.toString());',
        'url += "&tags=" + URLEncoder.encode("blue green", StandardCharsets.UTF_8.toString());',
        'url += "&role=" + URLEncoder.encode("admin", StandardCharsets.UTF_8.toString());',
        'url += "&name=" + URLEncoder.encode("Alex Smith", StandardCharsets.UTF_8.toString());',
      ],
      excludes: [
        'URLEncoder.encode("red,blue green", StandardCharsets.UTF_8.toString())',
        'URLEncoder.encode("[object Object]", StandardCharsets.UTF_8.toString())',
      ],
    },
    {
      name: 'java/unirest',
      generator: new UnirestJavaRequestCodeGenerator(),
      includes: [
        '.queryString("tags", "red")',
        '.queryString("tags", "blue green")',
        '.queryString("role", "admin")',
        '.queryString("name", "Alex Smith")',
      ],
      excludes: [
        '.queryString("tags", "red,blue green")',
        '.queryString("filter", "[object Object]")',
      ],
    },
    {
      name: 'csharp/restsharp',
      generator: new RestsharpCsharpRequestCodeGenerator(),
      includes: [
        'request.AddQueryParameter("tags", "red");',
        'request.AddQueryParameter("tags", "blue green");',
        'request.AddQueryParameter("role", "admin");',
        'request.AddQueryParameter("name", "Alex Smith");',
      ],
      excludes: [
        'request.AddQueryParameter("tags", "red,blue green");',
        'request.AddQueryParameter("filter", "[object Object]");',
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
