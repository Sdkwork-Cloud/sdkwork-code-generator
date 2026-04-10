import { HttpClientCSharpRequestCodeGenerator } from '../../../../src/openapi/generator/languages/csharp/httpclient';
import { DioDartRequestCodeGenerator } from '../../../../src/openapi/generator/languages/dart/dio';
import { OkHttpJavaRequestCodeGenerator } from '../../../../src/openapi/generator/languages/java/okhttp';
import { OkHttpKotlinRequestCodeGenerator } from '../../../../src/openapi/generator/languages/kotlin/okhttp';
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

describe('static client query parameter serialization', () => {
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
      name: 'dart/dio',
      generator: new DioDartRequestCodeGenerator(),
      includes: [
        "url += (url.contains('?') ? '&' : '?') + 'tags=' + Uri.encodeComponent('red');",
        "url += (url.contains('?') ? '&' : '?') + 'tags=' + Uri.encodeComponent('blue green');",
        "url += (url.contains('?') ? '&' : '?') + 'role=' + Uri.encodeComponent('admin');",
        "url += (url.contains('?') ? '&' : '?') + 'name=' + Uri.encodeComponent('Alex Smith');",
      ],
      excludes: [
        "Uri.encodeComponent('red,blue green')",
        "Uri.encodeComponent('[object Object]')",
      ],
    },
    {
      name: 'java/okhttp',
      generator: new OkHttpJavaRequestCodeGenerator(),
      includes: [
        'urlBuilder.addQueryParameter("tags", "red");',
        'urlBuilder.addQueryParameter("tags", "blue green");',
        'urlBuilder.addQueryParameter("role", "admin");',
        'urlBuilder.addQueryParameter("name", "Alex Smith");',
      ],
      excludes: [
        'urlBuilder.addQueryParameter("tags", "red,blue green");',
        'urlBuilder.addQueryParameter("filter", "[object Object]");',
      ],
    },
    {
      name: 'kotlin/okhttp',
      generator: new OkHttpKotlinRequestCodeGenerator(),
      includes: [
        'url += "?tags=" + URLEncoder.encode("red", StandardCharsets.UTF_8.toString())',
        'url += "&tags=" + URLEncoder.encode("blue green", StandardCharsets.UTF_8.toString())',
        'url += "&role=" + URLEncoder.encode("admin", StandardCharsets.UTF_8.toString())',
        'url += "&name=" + URLEncoder.encode("Alex Smith", StandardCharsets.UTF_8.toString())',
      ],
      excludes: [
        'URLEncoder.encode("red,blue green", StandardCharsets.UTF_8.toString())',
        'URLEncoder.encode("[object Object]", StandardCharsets.UTF_8.toString())',
      ],
    },
    {
      name: 'csharp/httpclient',
      generator: new HttpClientCSharpRequestCodeGenerator(),
      includes: [
        'url += "?tags=" + Uri.EscapeDataString("red");',
        'url += "&tags=" + Uri.EscapeDataString("blue green");',
        'url += "&role=" + Uri.EscapeDataString("admin");',
        'url += "&name=" + Uri.EscapeDataString("Alex Smith");',
      ],
      excludes: [
        'Uri.EscapeDataString("red,blue green")',
        'Uri.EscapeDataString("[object Object]")',
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
