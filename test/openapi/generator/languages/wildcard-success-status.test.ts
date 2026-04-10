import { GotJavaScriptRequestCodeGenerator } from '../../../../src/openapi/generator/languages/javascript/got';
import { SuperagentJavaScriptRequestCodeGenerator } from '../../../../src/openapi/generator/languages/javascript/superagent';
import { FetchJavaScriptRequestCodeGenerator } from '../../../../src/openapi/generator/languages/javascript/fetch';
import { AxiosJavaScriptRequestCodeGenerator } from '../../../../src/openapi/generator/languages/javascript/axios';
import { GotTypeScriptRequestCodeGenerator } from '../../../../src/openapi/generator/languages/typescript/got';
import { SuperagentTypeScriptRequestCodeGenerator } from '../../../../src/openapi/generator/languages/typescript/superagent';
import { FetchTypeScriptRequestCodeGenerator } from '../../../../src/openapi/generator/languages/typescript/fetch';
import { AxiosTypeScriptRequestCodeGenerator } from '../../../../src/openapi/generator/languages/typescript/axios';
import { AiohttpPythonRequestCodeGenerator } from '../../../../src/openapi/generator/languages/python/aiohttp';
import { HttpxPythonRequestCodeGenerator } from '../../../../src/openapi/generator/languages/python/httpx';
import { RequestsPythonRequestCodeGenerator } from '../../../../src/openapi/generator/languages/python/requests';
import { NetHttpGoRequestCodeGenerator } from '../../../../src/openapi/generator/languages/go/net_http';
import { FasthttpGoRequestCodeGenerator } from '../../../../src/openapi/generator/languages/go/fasthttp';
import { RestyGoRequestCodeGenerator } from '../../../../src/openapi/generator/languages/go/resty';
import { CpprestCppRequestCodeGenerator } from '../../../../src/openapi/generator/languages/cpp/cpprest';
import { CppHttplibCppRequestCodeGenerator } from '../../../../src/openapi/generator/languages/cpp/cpp-httplib';
import { BoostBeastCppRequestCodeGenerator } from '../../../../src/openapi/generator/languages/cpp/boost-beast';
import { HttpClientCSharpRequestCodeGenerator } from '../../../../src/openapi/generator/languages/csharp/httpclient';
import { RestsharpCsharpRequestCodeGenerator } from '../../../../src/openapi/generator/languages/csharp/restsharp';
import { RefitCsharpRequestCodeGenerator } from '../../../../src/openapi/generator/languages/csharp/refit';
import { ApacheHttpClientJavaRequestCodeGenerator } from '../../../../src/openapi/generator/languages/java/apache_httpclient';
import { UnirestJavaRequestCodeGenerator } from '../../../../src/openapi/generator/languages/java/unirest';
import { OkHttpJavaRequestCodeGenerator } from '../../../../src/openapi/generator/languages/java/okhttp';
import { RetrofitJavaRequestCodeGenerator } from '../../../../src/openapi/generator/languages/java/retrofit';
import { CurlPhpRequestCodeGenerator } from '../../../../src/openapi/generator/languages/php/curl';
import { GuzzlePhpRequestCodeGenerator } from '../../../../src/openapi/generator/languages/php/guzzle';
import { FaradayRubyRequestCodeGenerator } from '../../../../src/openapi/generator/languages/ruby/faraday';
import { HttpartyRubyRequestCodeGenerator } from '../../../../src/openapi/generator/languages/ruby/httparty';
import { ReqwestRustRequestCodeGenerator } from '../../../../src/openapi/generator/languages/rust/reqwest';
import { AlamofireSwiftRequestCodeGenerator } from '../../../../src/openapi/generator/languages/swift/alamofire';
import { UrlsessionSwiftRequestCodeGenerator } from '../../../../src/openapi/generator/languages/swift/urlsession';
import { HttpDartRequestCodeGenerator } from '../../../../src/openapi/generator/languages/dart/http';
import { DioDartRequestCodeGenerator } from '../../../../src/openapi/generator/languages/dart/dio';
import { CurlShellRequestCodeGenerator } from '../../../../src/openapi/generator/languages/shell/curl';
import { OkHttpKotlinRequestCodeGenerator } from '../../../../src/openapi/generator/languages/kotlin/okhttp';
import { RetrofitKotlinRequestCodeGenerator } from '../../../../src/openapi/generator/languages/kotlin/retrofit';
import {
  CodeGenerateContext,
  ExampleOpenAPIParameter,
  HttpMethod,
  OpenAPIOperation,
} from '../../../../src/types';
import {
  BASE_TEST_CONFIG,
  POST_TEST_OPERATION,
  TEST_REQUEST_BODY,
} from './test-data';

type WildcardSuccessCase = {
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

describe('2XX wildcard success status support', () => {
  const context: CodeGenerateContext = {
    ...BASE_TEST_CONFIG.context,
    responseStatusCode: '2XX',
    responseContentType: 'application/json',
    responseBodySchema: {
      type: 'object',
      properties: {
        id: { type: 'integer' },
      },
    },
  };

  const cases: WildcardSuccessCase[] = [
    {
      name: 'javascript/got',
      generator: new GotJavaScriptRequestCodeGenerator(),
      includes: [
        'if (response.statusCode < 200 || response.statusCode >= 300) {',
      ],
      excludes: ['if (response.statusCode !== 200) {'],
    },
    {
      name: 'javascript/axios',
      generator: new AxiosJavaScriptRequestCodeGenerator(),
      includes: ['if (response.status < 200 || response.status >= 300) {'],
      excludes: ['if (response.status !== 200) {'],
    },
    {
      name: 'javascript/fetch',
      generator: new FetchJavaScriptRequestCodeGenerator(),
      includes: ['if (response.status < 200 || response.status >= 300) {'],
      excludes: ['if (response.status !== 200) {'],
    },
    {
      name: 'javascript/superagent',
      generator: new SuperagentJavaScriptRequestCodeGenerator(),
      includes: ['if (response.status < 200 || response.status >= 300) {'],
      excludes: ['if (response.status !== 200) {'],
    },
    {
      name: 'typescript/got',
      generator: new GotTypeScriptRequestCodeGenerator(),
      includes: [
        'if (response.statusCode < 200 || response.statusCode >= 300) {',
      ],
      excludes: ['if (response.statusCode !== 200) {'],
    },
    {
      name: 'typescript/axios',
      generator: new AxiosTypeScriptRequestCodeGenerator(),
      includes: ['if (response.status < 200 || response.status >= 300) {'],
      excludes: ['if (response.status !== 200) {'],
    },
    {
      name: 'typescript/fetch',
      generator: new FetchTypeScriptRequestCodeGenerator(),
      includes: ['if (response.status < 200 || response.status >= 300) {'],
      excludes: ['if (response.status !== 200) {'],
    },
    {
      name: 'typescript/superagent',
      generator: new SuperagentTypeScriptRequestCodeGenerator(),
      includes: ['if (response.status < 200 || response.status >= 300) {'],
      excludes: ['if (response.status !== 200) {'],
    },
    {
      name: 'python/aiohttp',
      generator: new AiohttpPythonRequestCodeGenerator(),
      includes: ['if response.status < 200 or response.status >= 300:'],
      excludes: ['if response.status != 200:'],
    },
    {
      name: 'python/httpx',
      generator: new HttpxPythonRequestCodeGenerator(),
      includes: [
        'if response.status_code < 200 or response.status_code >= 300:',
      ],
      excludes: ['if response.status_code != 200:'],
    },
    {
      name: 'python/requests',
      generator: new RequestsPythonRequestCodeGenerator(),
      includes: [
        'if response.status_code < 200 or response.status_code >= 300:',
      ],
      excludes: ['if response.status_code != 200:'],
    },
    {
      name: 'go/net_http',
      generator: new NetHttpGoRequestCodeGenerator(),
      includes: ['if resp.StatusCode < 200 || resp.StatusCode >= 300 {'],
      excludes: ['if resp.StatusCode != 200 {'],
    },
    {
      name: 'go/fasthttp',
      generator: new FasthttpGoRequestCodeGenerator(),
      includes: ['if resp.StatusCode() < 200 || resp.StatusCode() >= 300 {'],
      excludes: ['if resp.StatusCode() != 200 {'],
    },
    {
      name: 'go/resty',
      generator: new RestyGoRequestCodeGenerator(),
      includes: ['if resp.StatusCode() < 200 || resp.StatusCode() >= 300 {'],
      excludes: ['if resp.StatusCode() != 200 {'],
    },
    {
      name: 'cpp/cpp-httplib',
      generator: new CppHttplibCppRequestCodeGenerator(),
      includes: ['if (response->status < 200 || response->status >= 300) {'],
      excludes: ['if (response->status != 200) {'],
    },
    {
      name: 'cpp/cpprest',
      generator: new CpprestCppRequestCodeGenerator(),
      includes: [
        'if (response.status_code() < 200 || response.status_code() >= 300) {',
      ],
      excludes: ['if (response.status_code() != 200) {'],
    },
    {
      name: 'cpp/boost-beast',
      generator: new BoostBeastCppRequestCodeGenerator(),
      includes: ['if (res.result_int() < 200 || res.result_int() >= 300) {'],
      excludes: ['if (res.result_int() != 200) {'],
    },
    {
      name: 'csharp/httpclient',
      generator: new HttpClientCSharpRequestCodeGenerator(),
      includes: [
        'if ((int)response.StatusCode < 200 || (int)response.StatusCode >= 300)',
      ],
      excludes: ['if ((int)response.StatusCode != 200)'],
    },
    {
      name: 'csharp/restsharp',
      generator: new RestsharpCsharpRequestCodeGenerator(),
      includes: [
        'if ((int)response.StatusCode < 200 || (int)response.StatusCode >= 300)',
      ],
      excludes: ['if ((int)response.StatusCode != 200)'],
    },
    {
      name: 'csharp/refit',
      generator: new RefitCsharpRequestCodeGenerator(),
      includes: [
        'if ((int)response.StatusCode < 200 || (int)response.StatusCode >= 300)',
      ],
      excludes: ['if ((int)response.StatusCode != 200)'],
    },
    {
      name: 'java/apache-httpclient',
      generator: new ApacheHttpClientJavaRequestCodeGenerator(),
      includes: [
        'if (response.getStatusLine().getStatusCode() < 200 || response.getStatusLine().getStatusCode() >= 300) {',
      ],
      excludes: ['if (response.getStatusLine().getStatusCode() != 200) {'],
    },
    {
      name: 'java/okhttp',
      generator: new OkHttpJavaRequestCodeGenerator(),
      includes: ['if (response.code() < 200 || response.code() >= 300) {'],
      excludes: ['if (response.code() != 200) {'],
    },
    {
      name: 'java/retrofit',
      generator: new RetrofitJavaRequestCodeGenerator(),
      includes: ['if (response.code() < 200 || response.code() >= 300) {'],
      excludes: ['if (response.code() != 200) {'],
    },
    {
      name: 'java/unirest',
      generator: new UnirestJavaRequestCodeGenerator(),
      includes: [
        'if (response.getStatus() < 200 || response.getStatus() >= 300) {',
      ],
      excludes: ['if (response.getStatus() != 200) {'],
    },
    {
      name: 'php/curl',
      generator: new CurlPhpRequestCodeGenerator(),
      includes: ['if ($http_code < 200 || $http_code >= 300) {'],
      excludes: ['if ($http_code != 200) {'],
    },
    {
      name: 'php/guzzle',
      generator: new GuzzlePhpRequestCodeGenerator(),
      includes: [
        'if ($response->getStatusCode() < 200 || $response->getStatusCode() >= 300) {',
      ],
      excludes: ['if ($response->getStatusCode() != 200) {'],
    },
    {
      name: 'ruby/faraday',
      generator: new FaradayRubyRequestCodeGenerator(),
      includes: ['if response.status >= 200 && response.status < 300'],
      excludes: ['if response.status == 200'],
    },
    {
      name: 'ruby/httparty',
      generator: new HttpartyRubyRequestCodeGenerator(),
      includes: ['if response.code < 200 || response.code >= 300'],
      excludes: ['if response.code != 200'],
    },
    {
      name: 'rust/reqwest',
      generator: new ReqwestRustRequestCodeGenerator(),
      includes: ['if status.as_u16() < 200 || status.as_u16() >= 300 {'],
      excludes: ['if status.as_u16() != 200 {'],
    },
    {
      name: 'swift/alamofire',
      generator: new AlamofireSwiftRequestCodeGenerator(),
      includes: ['.validate(statusCode: 200..<300)'],
      excludes: ['.validate(statusCode: [200])'],
    },
    {
      name: 'swift/urlsession',
      generator: new UrlsessionSwiftRequestCodeGenerator(),
      includes: [
        'if httpResponse.statusCode < 200 || httpResponse.statusCode >= 300 {',
      ],
      excludes: ['if httpResponse.statusCode != 200 {'],
    },
    {
      name: 'kotlin/okhttp',
      generator: new OkHttpKotlinRequestCodeGenerator(),
      includes: ['if (response.code < 200 || response.code >= 300)'],
      excludes: ['if (response.code != 200)'],
    },
    {
      name: 'kotlin/retrofit',
      generator: new RetrofitKotlinRequestCodeGenerator(),
      includes: ['if (response.code() < 200 || response.code() >= 300) {'],
      excludes: ['if (response.code() != 200) {'],
    },
    {
      name: 'dart/http',
      generator: new HttpDartRequestCodeGenerator(),
      includes: [
        'if (response.statusCode >= 200 && response.statusCode < 300) {',
      ],
      excludes: ['if (response.statusCode == 200) {'],
    },
    {
      name: 'dart/dio',
      generator: new DioDartRequestCodeGenerator(),
      includes: [
        'if (response.statusCode < 200 || response.statusCode >= 300) {',
      ],
      excludes: ['if (response.statusCode != 200) {'],
    },
    {
      name: 'shell/curl',
      generator: new CurlShellRequestCodeGenerator(),
      includes: [
        'if [ "$http_status" -lt 200 ] || [ "$http_status" -ge 300 ]; then',
      ],
      excludes: ['if [ "$http_status" -ne 200 ]; then'],
    },
  ];

  for (const testCase of cases) {
    test(`generates wildcard success handling for ${testCase.name}`, () => {
      const code = testCase.generator.generateCode(
        BASE_TEST_CONFIG.path,
        'POST',
        BASE_TEST_CONFIG.baseUrl,
        POST_TEST_OPERATION,
        [],
        [],
        [],
        TEST_REQUEST_BODY,
        context
      );

      testCase.includes.forEach((pattern) => {
        expect(code).toContain(pattern);
      });

      testCase.excludes.forEach((pattern) => {
        expect(code).not.toContain(pattern);
      });
    });
  }
});
