import { AiohttpPythonRequestCodeGenerator } from '../../../../src/openapi/generator/languages/python/aiohttp';
import { HttpxPythonRequestCodeGenerator } from '../../../../src/openapi/generator/languages/python/httpx';
import { FasthttpGoRequestCodeGenerator } from '../../../../src/openapi/generator/languages/go/fasthttp';
import { OkHttpKotlinRequestCodeGenerator } from '../../../../src/openapi/generator/languages/kotlin/okhttp';
import {
  CodeGenerateContext,
  ExampleOpenAPIParameter,
  HttpMethod,
  OpenAPIOperation,
} from '../../../../src/types';
import { BASE_TEST_CONFIG, POST_TEST_OPERATION } from './test-data';

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

describe('query parameter encoding', () => {
  const queryParams: ExampleOpenAPIParameter[] = [
    {
      name: 'redirect',
      in: 'query',
      required: false,
      schema: { type: 'string' },
      value: 'a b&c=/',
    },
  ];
  const context: CodeGenerateContext = {
    ...BASE_TEST_CONFIG.context,
  };

  const cases: GeneratorCase[] = [
    {
      name: 'python/aiohttp',
      generator: new AiohttpPythonRequestCodeGenerator(),
      includes: ["from urllib.parse import quote", "quote('a b&c=/', safe='')"],
      excludes: ["url += ('?' if '?' not in url else '&') + 'redirect=' + 'a b&c=/'"],
    },
    {
      name: 'python/httpx',
      generator: new HttpxPythonRequestCodeGenerator(),
      includes: ["from urllib.parse import quote", "quote('a b&c=/', safe='')"],
      excludes: ["url += ('?' if '?' not in url else '&') + 'redirect=' + 'a b&c=/'"],
    },
    {
      name: 'go/fasthttp',
      generator: new FasthttpGoRequestCodeGenerator(),
      includes: ['neturl "net/url"', 'neturl.QueryEscape("a b&c=/")'],
      excludes: ['url += "?redirect=a b&c=/"'],
    },
    {
      name: 'kotlin/okhttp',
      generator: new OkHttpKotlinRequestCodeGenerator(),
      includes: [
        'import java.net.URLEncoder',
        'import java.nio.charset.StandardCharsets',
        'URLEncoder.encode("a b&c=/", StandardCharsets.UTF_8.toString())',
      ],
      excludes: ['url += "?redirect=a b&c=/"'],
    },
  ];

  test.each(cases)(
    '$name encodes query parameter values instead of concatenating raw values',
    ({ generator, includes, excludes }) => {
      const code = generator.generateCode(
        BASE_TEST_CONFIG.path,
        'GET',
        BASE_TEST_CONFIG.baseUrl,
        POST_TEST_OPERATION,
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
