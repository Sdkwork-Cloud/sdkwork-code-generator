import { CurlPhpRequestCodeGenerator } from '../../../../src/openapi/generator/languages/php/curl';
import { GuzzlePhpRequestCodeGenerator } from '../../../../src/openapi/generator/languages/php/guzzle';
import { FaradayRubyRequestCodeGenerator } from '../../../../src/openapi/generator/languages/ruby/faraday';
import { HttpartyRubyRequestCodeGenerator } from '../../../../src/openapi/generator/languages/ruby/httparty';
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

describe('php/ruby query parameter serialization', () => {
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
      name: 'php/curl',
      generator: new CurlPhpRequestCodeGenerator(),
      includes: [
        "$url .= (strpos($url, '?') !== false ? '&' : '?') . 'tags=' . urlencode('red');",
        "$url .= (strpos($url, '?') !== false ? '&' : '?') . 'tags=' . urlencode('blue green');",
        "$url .= (strpos($url, '?') !== false ? '&' : '?') . 'role=' . urlencode('admin');",
        "$url .= (strpos($url, '?') !== false ? '&' : '?') . 'name=' . urlencode('Alex Smith');",
      ],
      excludes: ["urlencode('red,blue green')", "urlencode('[object Object]')"],
    },
    {
      name: 'php/guzzle',
      generator: new GuzzlePhpRequestCodeGenerator(),
      includes: [
        "$url .= (strpos($url, '?') !== false ? '&' : '?') . 'tags=' . urlencode('red');",
        "$url .= (strpos($url, '?') !== false ? '&' : '?') . 'tags=' . urlencode('blue green');",
        "$url .= (strpos($url, '?') !== false ? '&' : '?') . 'role=' . urlencode('admin');",
        "$url .= (strpos($url, '?') !== false ? '&' : '?') . 'name=' . urlencode('Alex Smith');",
      ],
      excludes: ["urlencode('red,blue green')", "urlencode('[object Object]')"],
    },
    {
      name: 'ruby/faraday',
      generator: new FaradayRubyRequestCodeGenerator(),
      includes: [
        "request_url += (request_url.include?('?') ? '&' : '?') + 'tags=' + URI.encode_www_form_component('red')",
        "request_url += (request_url.include?('?') ? '&' : '?') + 'tags=' + URI.encode_www_form_component('blue green')",
        "request_url += (request_url.include?('?') ? '&' : '?') + 'role=' + URI.encode_www_form_component('admin')",
        "request_url += (request_url.include?('?') ? '&' : '?') + 'name=' + URI.encode_www_form_component('Alex Smith')",
      ],
      excludes: [
        "URI.encode_www_form_component('red,blue green')",
        "URI.encode_www_form_component('[object Object]')",
      ],
    },
    {
      name: 'ruby/httparty',
      generator: new HttpartyRubyRequestCodeGenerator(),
      includes: [
        "url += (url.include?('?') ? '&' : '?') + 'tags=' + URI.encode_www_form_component('red')",
        "url += (url.include?('?') ? '&' : '?') + 'tags=' + URI.encode_www_form_component('blue green')",
        "url += (url.include?('?') ? '&' : '?') + 'role=' + URI.encode_www_form_component('admin')",
        "url += (url.include?('?') ? '&' : '?') + 'name=' + URI.encode_www_form_component('Alex Smith')",
      ],
      excludes: [
        "URI.encode_www_form_component('red,blue green')",
        "URI.encode_www_form_component('[object Object]')",
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
