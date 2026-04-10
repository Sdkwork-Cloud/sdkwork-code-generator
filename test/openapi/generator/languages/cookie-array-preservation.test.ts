import { AiohttpPythonRequestCodeGenerator } from '../../../../src/openapi/generator/languages/python/aiohttp';
import { HttpxPythonRequestCodeGenerator } from '../../../../src/openapi/generator/languages/python/httpx';
import { RequestsPythonRequestCodeGenerator } from '../../../../src/openapi/generator/languages/python/requests';
import { HttpartyRubyRequestCodeGenerator } from '../../../../src/openapi/generator/languages/ruby/httparty';
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
  excludes: string[];
};

describe('cookie array preservation', () => {
  const cookies: ExampleOpenAPIParameter[] = [
    {
      name: 'tag',
      in: 'cookie',
      required: false,
      schema: {
        type: 'array',
        items: { type: 'string' },
      },
      value: ['one', 'two'],
    },
  ];

  const cases: GeneratorCase[] = [
    {
      name: 'python/requests',
      generator: new RequestsPythonRequestCodeGenerator(),
      includes: [`'Cookie': 'tag=one; tag=two'`],
      excludes: ['cookies={', 'cookies = {', 'cookies=cookies'],
    },
    {
      name: 'python/httpx',
      generator: new HttpxPythonRequestCodeGenerator(),
      includes: [`'Cookie': 'tag=one; tag=two'`],
      excludes: ['cookies = {', 'cookies=cookies'],
    },
    {
      name: 'python/aiohttp',
      generator: new AiohttpPythonRequestCodeGenerator(),
      includes: [`'Cookie': 'tag=one; tag=two'`],
      excludes: ['cookies = {', 'cookies=cookies'],
    },
    {
      name: 'ruby/httparty',
      generator: new HttpartyRubyRequestCodeGenerator(),
      includes: [`'Cookie' => 'tag=one; tag=two'`],
      excludes: ['cookies: {'],
    },
  ];

  test.each(cases)(
    '$name preserves exploded cookie arrays without collapsing duplicate names',
    ({ generator, includes, excludes }) => {
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
      excludes.forEach((snippet) => expect(code).not.toContain(snippet));
    }
  );
});
