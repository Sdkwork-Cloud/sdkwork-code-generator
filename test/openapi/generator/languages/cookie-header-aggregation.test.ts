import { HttpClientCSharpRequestCodeGenerator } from '../../../../src/openapi/generator/languages/csharp/httpclient';
import { FasthttpGoRequestCodeGenerator } from '../../../../src/openapi/generator/languages/go/fasthttp';
import { NetHttpGoRequestCodeGenerator } from '../../../../src/openapi/generator/languages/go/net_http';
import { OkHttpJavaRequestCodeGenerator } from '../../../../src/openapi/generator/languages/java/okhttp';
import { SuperagentJavaScriptRequestCodeGenerator } from '../../../../src/openapi/generator/languages/javascript/superagent';
import { SuperagentTypeScriptRequestCodeGenerator } from '../../../../src/openapi/generator/languages/typescript/superagent';
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
  expectedCookieHeader: string;
  countPattern: RegExp;
  excludedSnippets: string[];
};

describe('cookie header aggregation', () => {
  const cookies: ExampleOpenAPIParameter[] = [
    {
      name: 'session',
      in: 'cookie',
      required: false,
      schema: { type: 'string' },
      value: 'abc123',
    },
    {
      name: 'theme',
      in: 'cookie',
      required: false,
      schema: { type: 'string' },
      value: 'dark',
    },
  ];
  const context: CodeGenerateContext = {
    ...BASE_TEST_CONFIG.context,
  };

  const cases: GeneratorCase[] = [
    {
      name: 'csharp/httpclient',
      generator: new HttpClientCSharpRequestCodeGenerator(),
      expectedCookieHeader:
        'request.Headers.Add("Cookie", "session=abc123; theme=dark");',
      countPattern: /request\.Headers\.Add\("Cookie",/g,
      excludedSnippets: [
        'request.Headers.Add("Cookie", "session=abc123");',
        'request.Headers.Add("Cookie", "theme=dark");',
      ],
    },
    {
      name: 'go/fasthttp',
      generator: new FasthttpGoRequestCodeGenerator(),
      expectedCookieHeader:
        'req.Header.Set("Cookie", "session=abc123; theme=dark")',
      countPattern: /req\.Header\.Set\("Cookie",/g,
      excludedSnippets: [
        'req.Header.Set("Cookie", "session=abc123")',
        'req.Header.Set("Cookie", "theme=dark")',
      ],
    },
    {
      name: 'go/net_http',
      generator: new NetHttpGoRequestCodeGenerator(),
      expectedCookieHeader:
        'req.Header.Set("Cookie", "session=abc123; theme=dark")',
      countPattern: /req\.Header\.Set\("Cookie",/g,
      excludedSnippets: [
        'req.Header.Set("Cookie", "session=abc123")',
        'req.Header.Set("Cookie", "theme=dark")',
      ],
    },
    {
      name: 'java/okhttp',
      generator: new OkHttpJavaRequestCodeGenerator(),
      expectedCookieHeader:
        'requestBuilder.addHeader("Cookie", "session=abc123; theme=dark");',
      countPattern: /requestBuilder\.addHeader\("Cookie",/g,
      excludedSnippets: [
        'requestBuilder.addHeader("Cookie", "session=abc123");',
        'requestBuilder.addHeader("Cookie", "theme=dark");',
      ],
    },
    {
      name: 'javascript/superagent',
      generator: new SuperagentJavaScriptRequestCodeGenerator(),
      expectedCookieHeader:
        "request.set('Cookie', 'session=abc123; theme=dark');",
      countPattern: /request\.set\('Cookie',/g,
      excludedSnippets: [
        "request.set('Cookie', 'session=abc123');",
        "request.set('Cookie', 'theme=dark');",
      ],
    },
    {
      name: 'typescript/superagent',
      generator: new SuperagentTypeScriptRequestCodeGenerator(),
      expectedCookieHeader:
        "request.set('Cookie', 'session=abc123; theme=dark');",
      countPattern: /request\.set\('Cookie',/g,
      excludedSnippets: [
        "request.set('Cookie', 'session=abc123');",
        "request.set('Cookie', 'theme=dark');",
      ],
    },
  ];

  test.each(cases)(
    '$name generates a single aggregated Cookie header for multiple cookie parameters',
    ({ generator, expectedCookieHeader, countPattern, excludedSnippets }) => {
      const code = generator.generateCode(
        BASE_TEST_CONFIG.path,
        'GET',
        BASE_TEST_CONFIG.baseUrl,
        TEST_OPERATION,
        cookies,
        [],
        [],
        undefined,
        context
      );

      expect(code).toContain(expectedCookieHeader);
      expect(code.match(countPattern)).toHaveLength(1);
      excludedSnippets.forEach((snippet) => expect(code).not.toContain(snippet));
    }
  );
});
