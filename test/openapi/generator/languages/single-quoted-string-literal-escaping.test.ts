import { AxiosJavaScriptRequestCodeGenerator } from '../../../../src/openapi/generator/languages/javascript/axios';
import { FetchJavaScriptRequestCodeGenerator } from '../../../../src/openapi/generator/languages/javascript/fetch';
import { GotJavaScriptRequestCodeGenerator } from '../../../../src/openapi/generator/languages/javascript/got';
import { SuperagentJavaScriptRequestCodeGenerator } from '../../../../src/openapi/generator/languages/javascript/superagent';
import { AxiosTypeScriptRequestCodeGenerator } from '../../../../src/openapi/generator/languages/typescript/axios';
import { FetchTypeScriptRequestCodeGenerator } from '../../../../src/openapi/generator/languages/typescript/fetch';
import { GotTypeScriptRequestCodeGenerator } from '../../../../src/openapi/generator/languages/typescript/got';
import { SuperagentTypeScriptRequestCodeGenerator } from '../../../../src/openapi/generator/languages/typescript/superagent';
import { RequestsPythonRequestCodeGenerator } from '../../../../src/openapi/generator/languages/python/requests';
import { AiohttpPythonRequestCodeGenerator } from '../../../../src/openapi/generator/languages/python/aiohttp';
import { HttpxPythonRequestCodeGenerator } from '../../../../src/openapi/generator/languages/python/httpx';
import { HttpDartRequestCodeGenerator } from '../../../../src/openapi/generator/languages/dart/http';
import { DioDartRequestCodeGenerator } from '../../../../src/openapi/generator/languages/dart/dio';
import {
  CodeGenerateContext,
  ExampleOpenAPIParameter,
  HttpMethod,
  OpenAPIOperation,
} from '../../../../src/types';
import { CurlPhpRequestCodeGenerator } from '../../../../src/openapi/generator/languages/php/curl';
import { GuzzlePhpRequestCodeGenerator } from '../../../../src/openapi/generator/languages/php/guzzle';
import { FaradayRubyRequestCodeGenerator } from '../../../../src/openapi/generator/languages/ruby/faraday';
import { HttpartyRubyRequestCodeGenerator } from '../../../../src/openapi/generator/languages/ruby/httparty';
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
};

describe('single-quoted string literal escaping', () => {
  const requestBody = "line 1\nline '2'";
  const escapedBody = "'line 1\\nline \\'2\\''";
  const unescapedBody = "'line 1\nline \\'2\\''";
  const context: CodeGenerateContext = {
    ...BASE_TEST_CONFIG.context,
    requestContentType: 'text/plain',
  };

  const cases: GeneratorCase[] = [
    { name: 'javascript/axios', generator: new AxiosJavaScriptRequestCodeGenerator() },
    { name: 'javascript/fetch', generator: new FetchJavaScriptRequestCodeGenerator() },
    { name: 'javascript/got', generator: new GotJavaScriptRequestCodeGenerator() },
    {
      name: 'javascript/superagent',
      generator: new SuperagentJavaScriptRequestCodeGenerator(),
    },
    { name: 'typescript/axios', generator: new AxiosTypeScriptRequestCodeGenerator() },
    { name: 'typescript/fetch', generator: new FetchTypeScriptRequestCodeGenerator() },
    { name: 'typescript/got', generator: new GotTypeScriptRequestCodeGenerator() },
    {
      name: 'typescript/superagent',
      generator: new SuperagentTypeScriptRequestCodeGenerator(),
    },
    { name: 'python/requests', generator: new RequestsPythonRequestCodeGenerator() },
    { name: 'python/aiohttp', generator: new AiohttpPythonRequestCodeGenerator() },
    { name: 'python/httpx', generator: new HttpxPythonRequestCodeGenerator() },
    { name: 'dart/http', generator: new HttpDartRequestCodeGenerator() },
    { name: 'dart/dio', generator: new DioDartRequestCodeGenerator() },
    { name: 'php/curl', generator: new CurlPhpRequestCodeGenerator() },
    { name: 'php/guzzle', generator: new GuzzlePhpRequestCodeGenerator() },
    { name: 'ruby/faraday', generator: new FaradayRubyRequestCodeGenerator() },
    { name: 'ruby/httparty', generator: new HttpartyRubyRequestCodeGenerator() },
  ];

  test.each(cases)(
    '$name escapes multiline text request bodies inside quoted literals',
    ({ generator }) => {
      const code = generator.generateCode(
        BASE_TEST_CONFIG.path,
        'POST',
        BASE_TEST_CONFIG.baseUrl,
        POST_TEST_OPERATION,
        [],
        [],
        [],
        requestBody,
        context
      );

      expect(code).toContain(escapedBody);
      expect(code).not.toContain(unescapedBody);
    }
  );
});
