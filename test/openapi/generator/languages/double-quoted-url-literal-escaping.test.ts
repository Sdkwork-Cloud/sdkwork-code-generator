import { HttpClientCSharpRequestCodeGenerator } from '../../../../src/openapi/generator/languages/csharp/httpclient';
import { DioDartRequestCodeGenerator } from '../../../../src/openapi/generator/languages/dart/dio';
import { HttpDartRequestCodeGenerator } from '../../../../src/openapi/generator/languages/dart/http';
import { FasthttpGoRequestCodeGenerator } from '../../../../src/openapi/generator/languages/go/fasthttp';
import { NetHttpGoRequestCodeGenerator } from '../../../../src/openapi/generator/languages/go/net_http';
import { RestyGoRequestCodeGenerator } from '../../../../src/openapi/generator/languages/go/resty';
import { ApacheHttpClientJavaRequestCodeGenerator } from '../../../../src/openapi/generator/languages/java/apache_httpclient';
import { OkHttpJavaRequestCodeGenerator } from '../../../../src/openapi/generator/languages/java/okhttp';
import { UnirestJavaRequestCodeGenerator } from '../../../../src/openapi/generator/languages/java/unirest';
import { AxiosJavaScriptRequestCodeGenerator } from '../../../../src/openapi/generator/languages/javascript/axios';
import { FetchJavaScriptRequestCodeGenerator } from '../../../../src/openapi/generator/languages/javascript/fetch';
import { GotJavaScriptRequestCodeGenerator } from '../../../../src/openapi/generator/languages/javascript/got';
import { SuperagentJavaScriptRequestCodeGenerator } from '../../../../src/openapi/generator/languages/javascript/superagent';
import { OkHttpKotlinRequestCodeGenerator } from '../../../../src/openapi/generator/languages/kotlin/okhttp';
import { CurlPhpRequestCodeGenerator } from '../../../../src/openapi/generator/languages/php/curl';
import { GuzzlePhpRequestCodeGenerator } from '../../../../src/openapi/generator/languages/php/guzzle';
import { AiohttpPythonRequestCodeGenerator } from '../../../../src/openapi/generator/languages/python/aiohttp';
import { HttpxPythonRequestCodeGenerator } from '../../../../src/openapi/generator/languages/python/httpx';
import { RequestsPythonRequestCodeGenerator } from '../../../../src/openapi/generator/languages/python/requests';
import { HttpartyRubyRequestCodeGenerator } from '../../../../src/openapi/generator/languages/ruby/httparty';
import { ReqwestRustRequestCodeGenerator } from '../../../../src/openapi/generator/languages/rust/reqwest';
import { AlamofireSwiftRequestCodeGenerator } from '../../../../src/openapi/generator/languages/swift/alamofire';
import { UrlsessionSwiftRequestCodeGenerator } from '../../../../src/openapi/generator/languages/swift/urlsession';
import { AxiosTypeScriptRequestCodeGenerator } from '../../../../src/openapi/generator/languages/typescript/axios';
import { FetchTypeScriptRequestCodeGenerator } from '../../../../src/openapi/generator/languages/typescript/fetch';
import { GotTypeScriptRequestCodeGenerator } from '../../../../src/openapi/generator/languages/typescript/got';
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
};

describe('double-quoted URL literal escaping', () => {
  const path = '/users/"special"';
  const context: CodeGenerateContext = {
    ...BASE_TEST_CONFIG.context,
  };
  const escapedUrlFragment = 'https://api.example.com/users/\\"special\\"';
  const rawUrlFragment = 'https://api.example.com/users/"special"';

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
    { name: 'ruby/httparty', generator: new HttpartyRubyRequestCodeGenerator() },
    { name: 'csharp/httpclient', generator: new HttpClientCSharpRequestCodeGenerator() },
    { name: 'go/resty', generator: new RestyGoRequestCodeGenerator() },
    { name: 'go/net_http', generator: new NetHttpGoRequestCodeGenerator() },
    { name: 'go/fasthttp', generator: new FasthttpGoRequestCodeGenerator() },
    { name: 'java/unirest', generator: new UnirestJavaRequestCodeGenerator() },
    { name: 'java/okhttp', generator: new OkHttpJavaRequestCodeGenerator() },
    {
      name: 'java/apache_httpclient',
      generator: new ApacheHttpClientJavaRequestCodeGenerator(),
    },
    { name: 'kotlin/okhttp', generator: new OkHttpKotlinRequestCodeGenerator() },
    { name: 'rust/reqwest', generator: new ReqwestRustRequestCodeGenerator() },
    { name: 'swift/urlsession', generator: new UrlsessionSwiftRequestCodeGenerator() },
    { name: 'swift/alamofire', generator: new AlamofireSwiftRequestCodeGenerator() },
  ];

  test.each(cases)(
    '$name escapes double quotes in URL literals derived from the request path',
    ({ generator }) => {
      const code = generator.generateCode(
        path,
        'GET',
        BASE_TEST_CONFIG.baseUrl,
        TEST_OPERATION,
        [],
        [],
        [],
        undefined,
        context
      );

      expect(code).toContain(escapedUrlFragment);
      expect(code).not.toContain(rawUrlFragment);
    }
  );
});
