import { RefitCsharpRequestCodeGenerator } from '../../../../src/openapi/generator/languages/csharp/refit';
import { RestsharpCsharpRequestCodeGenerator } from '../../../../src/openapi/generator/languages/csharp/restsharp';
import { NetHttpGoRequestCodeGenerator } from '../../../../src/openapi/generator/languages/go/net_http';
import { RequestsPythonRequestCodeGenerator } from '../../../../src/openapi/generator/languages/python/requests';
import { HttpartyRubyRequestCodeGenerator } from '../../../../src/openapi/generator/languages/ruby/httparty';
import { CurlShellRequestCodeGenerator } from '../../../../src/openapi/generator/languages/shell/curl';
import {
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
      context: typeof BASE_TEST_CONFIG.context
    ) => string;
  };
  includes: string[];
};

describe('cookie object serialization', () => {
  const cookies: ExampleOpenAPIParameter[] = [
    {
      name: 'prefs',
      in: 'cookie',
      required: false,
      schema: {
        type: 'object',
        properties: {
          greeting: { type: 'string' },
          code: { type: 'integer' },
        },
      },
      value: {
        greeting: 'Hello',
        code: 42,
      },
    },
  ];

  const cases: GeneratorCase[] = [
    {
      name: 'go/net_http',
      generator: new NetHttpGoRequestCodeGenerator(),
      includes: ['req.Header.Set("Cookie", "greeting=Hello; code=42")'],
    },
    {
      name: 'csharp/restsharp',
      generator: new RestsharpCsharpRequestCodeGenerator(),
      includes: [
        'request.AddCookie("greeting", "Hello");',
        'request.AddCookie("code", "42");',
      ],
    },
    {
      name: 'csharp/refit',
      generator: new RefitCsharpRequestCodeGenerator(),
      includes: [
        '[Header("Cookie")] string greetingCookie',
        '[Header("Cookie")] string codeCookie',
        '"greeting=Hello"',
        '"code=42"',
      ],
    },
    {
      name: 'python/requests',
      generator: new RequestsPythonRequestCodeGenerator(),
      includes: [`'Cookie': 'greeting=Hello; code=42'`],
    },
    {
      name: 'ruby/httparty',
      generator: new HttpartyRubyRequestCodeGenerator(),
      includes: [`'Cookie' => 'greeting=Hello; code=42'`],
    },
    {
      name: 'shell/curl',
      generator: new CurlShellRequestCodeGenerator(),
      includes: [`--cookie 'greeting=Hello; code=42' \\`],
    },
  ];

  test.each(cases)(
    '$name serializes object cookies as cookie pairs instead of stringifying the object',
    ({ generator, includes }) => {
      const code = generator.generateCode(
        BASE_TEST_CONFIG.path,
        'GET',
        BASE_TEST_CONFIG.baseUrl,
        TEST_OPERATION,
        cookies,
        [],
        [],
        undefined,
        BASE_TEST_CONFIG.context
      );

      includes.forEach((snippet) => expect(code).toContain(snippet));
      expect(code).not.toContain('[object Object]');
    }
  );
});
