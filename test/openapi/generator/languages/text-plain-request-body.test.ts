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
import { NetHttpGoRequestCodeGenerator } from '../../../../src/openapi/generator/languages/go/net_http';
import { FasthttpGoRequestCodeGenerator } from '../../../../src/openapi/generator/languages/go/fasthttp';
import { RestyGoRequestCodeGenerator } from '../../../../src/openapi/generator/languages/go/resty';
import { CurlShellRequestCodeGenerator } from '../../../../src/openapi/generator/languages/shell/curl';
import { ReqwestRustRequestCodeGenerator } from '../../../../src/openapi/generator/languages/rust/reqwest';
import { CpprestCppRequestCodeGenerator } from '../../../../src/openapi/generator/languages/cpp/cpprest';
import { CppHttplibCppRequestCodeGenerator } from '../../../../src/openapi/generator/languages/cpp/cpp-httplib';
import { BoostBeastCppRequestCodeGenerator } from '../../../../src/openapi/generator/languages/cpp/boost-beast';
import { HttpClientCSharpRequestCodeGenerator } from '../../../../src/openapi/generator/languages/csharp/httpclient';
import { RestsharpCsharpRequestCodeGenerator } from '../../../../src/openapi/generator/languages/csharp/restsharp';
import { RefitCsharpRequestCodeGenerator } from '../../../../src/openapi/generator/languages/csharp/refit';
import { OkHttpJavaRequestCodeGenerator } from '../../../../src/openapi/generator/languages/java/okhttp';
import { ApacheHttpClientJavaRequestCodeGenerator } from '../../../../src/openapi/generator/languages/java/apache_httpclient';
import { UnirestJavaRequestCodeGenerator } from '../../../../src/openapi/generator/languages/java/unirest';
import { RetrofitJavaRequestCodeGenerator } from '../../../../src/openapi/generator/languages/java/retrofit';
import { OkHttpKotlinRequestCodeGenerator } from '../../../../src/openapi/generator/languages/kotlin/okhttp';
import { RetrofitKotlinRequestCodeGenerator } from '../../../../src/openapi/generator/languages/kotlin/retrofit';
import { CurlPhpRequestCodeGenerator } from '../../../../src/openapi/generator/languages/php/curl';
import { GuzzlePhpRequestCodeGenerator } from '../../../../src/openapi/generator/languages/php/guzzle';
import { FaradayRubyRequestCodeGenerator } from '../../../../src/openapi/generator/languages/ruby/faraday';
import { HttpartyRubyRequestCodeGenerator } from '../../../../src/openapi/generator/languages/ruby/httparty';
import { AlamofireSwiftRequestCodeGenerator } from '../../../../src/openapi/generator/languages/swift/alamofire';
import { UrlsessionSwiftRequestCodeGenerator } from '../../../../src/openapi/generator/languages/swift/urlsession';
import { HttpDartRequestCodeGenerator } from '../../../../src/openapi/generator/languages/dart/http';
import { DioDartRequestCodeGenerator } from '../../../../src/openapi/generator/languages/dart/dio';
import {
  CodeGenerateContext,
  ExampleOpenAPIParameter,
  HttpMethod,
  OpenAPIOperation,
} from '../../../../src/types';
import { BASE_TEST_CONFIG, POST_TEST_OPERATION } from './test-data';

type TextPlainCase = {
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

describe('text/plain request body support', () => {
  const context: CodeGenerateContext = {
    ...BASE_TEST_CONFIG.context,
    requestContentType: 'text/plain',
  };

  const cases: TextPlainCase[] = [
    {
      name: 'javascript/axios',
      generator: new AxiosJavaScriptRequestCodeGenerator(),
      includes: ["'Content-Type': 'text/plain'", "data: 'hello world'"],
      excludes: ['application/json', 'JSON.stringify('],
    },
    {
      name: 'javascript/fetch',
      generator: new FetchJavaScriptRequestCodeGenerator(),
      includes: ["'Content-Type': 'text/plain'", "body: 'hello world'"],
      excludes: ['application/json', 'JSON.stringify('],
    },
    {
      name: 'javascript/got',
      generator: new GotJavaScriptRequestCodeGenerator(),
      includes: ["'Content-Type': 'text/plain'", "body: 'hello world'"],
      excludes: ['application/json', 'json:'],
    },
    {
      name: 'javascript/superagent',
      generator: new SuperagentJavaScriptRequestCodeGenerator(),
      includes: [
        "request.set('Content-Type', 'text/plain');",
        "request.send('hello world');",
      ],
      excludes: ['application/json', 'request.send({'],
    },
    {
      name: 'typescript/axios',
      generator: new AxiosTypeScriptRequestCodeGenerator(),
      includes: ["'Content-Type': 'text/plain'", "data: 'hello world'"],
      excludes: ['application/json', 'JSON.stringify('],
    },
    {
      name: 'typescript/fetch',
      generator: new FetchTypeScriptRequestCodeGenerator(),
      includes: ["'Content-Type': 'text/plain'", "body: 'hello world'"],
      excludes: ['application/json', 'JSON.stringify('],
    },
    {
      name: 'typescript/got',
      generator: new GotTypeScriptRequestCodeGenerator(),
      includes: ["'Content-Type': 'text/plain'", "body: 'hello world'"],
      excludes: ['application/json', 'json:'],
    },
    {
      name: 'typescript/superagent',
      generator: new SuperagentTypeScriptRequestCodeGenerator(),
      includes: [
        "request.set('Content-Type', 'text/plain');",
        "request.send('hello world');",
      ],
      excludes: ['application/json', 'request.send({'],
    },
    {
      name: 'python/requests',
      generator: new RequestsPythonRequestCodeGenerator(),
      includes: [
        "headers={'Content-Type': 'text/plain'}",
        "data='hello world'",
      ],
      excludes: ['application/json', 'json='],
    },
    {
      name: 'python/aiohttp',
      generator: new AiohttpPythonRequestCodeGenerator(),
      includes: [
        "'Content-Type': 'text/plain'",
        "data = 'hello world'",
        'data=data',
      ],
      excludes: ['application/json', 'json.dumps('],
    },
    {
      name: 'python/httpx',
      generator: new HttpxPythonRequestCodeGenerator(),
      includes: [
        "'Content-Type': 'text/plain'",
        "data = 'hello world'",
        'content=data',
      ],
      excludes: ['application/json', 'json=data'],
    },
    {
      name: 'go/net-http',
      generator: new NetHttpGoRequestCodeGenerator(),
      includes: [
        'req.Header.Set("Content-Type", "text/plain")',
        'strings.NewReader(`hello world`)',
      ],
      excludes: ['application/json', 'json.Marshal'],
    },
    {
      name: 'go/fasthttp',
      generator: new FasthttpGoRequestCodeGenerator(),
      includes: [
        'req.Header.Set("Content-Type", "text/plain")',
        'req.SetBodyString(`hello world`)',
      ],
      excludes: ['application/json', 'json.Marshal'],
    },
    {
      name: 'go/resty',
      generator: new RestyGoRequestCodeGenerator(),
      includes: [
        'req.SetHeader("Content-Type", "text/plain")',
        'req.SetBody(`hello world`)',
      ],
      excludes: ['application/json', 'SetBody({'],
    },
    {
      name: 'shell/curl',
      generator: new CurlShellRequestCodeGenerator(),
      includes: ['Content-Type: text/plain', "--data-raw 'hello world'"],
      excludes: ['application/json'],
    },
    {
      name: 'rust/reqwest',
      generator: new ReqwestRustRequestCodeGenerator(),
      includes: ['"content-type"', '.body("hello world")'],
      excludes: ['application/json', 'serde_json::json!'],
    },
    {
      name: 'cpp/cpprest',
      generator: new CpprestCppRequestCodeGenerator(),
      includes: [
        'request.headers().add(U("Content-Type"), U("text/plain"));',
        'request.set_body("hello world", "text/plain");',
      ],
      excludes: ['application/json', 'json::value::parse'],
    },
    {
      name: 'cpp/cpp-httplib',
      generator: new CppHttplibCppRequestCodeGenerator(),
      includes: [
        '{"Content-Type", "text/plain"}',
        'std::string request_body = "hello world";',
      ],
      excludes: ['application/json', 'json request_body ='],
    },
    {
      name: 'cpp/boost-beast',
      generator: new BoostBeastCppRequestCodeGenerator(),
      includes: [
        'req.set(http::field::content_type, "text/plain");',
        'req.body() = "hello world";',
      ],
      excludes: ['application/json', 'json request_body ='],
    },
    {
      name: 'csharp/httpclient',
      generator: new HttpClientCSharpRequestCodeGenerator(),
      includes: [
        'new StringContent("hello world", Encoding.UTF8, "text/plain");',
      ],
      excludes: ['application/json', 'JsonSerializer.Serialize'],
    },
    {
      name: 'csharp/restsharp',
      generator: new RestsharpCsharpRequestCodeGenerator(),
      includes: [
        'AddHeader("Content-Type", "text/plain");',
        'AddStringBody("hello world"',
      ],
      excludes: ['application/json', 'AddJsonBody'],
    },
    {
      name: 'csharp/refit',
      generator: new RefitCsharpRequestCodeGenerator(),
      includes: ['[Headers("Content-Type: text/plain")]', '[Body] string body'],
      excludes: ['[Body] object body'],
    },
    {
      name: 'java/okhttp',
      generator: new OkHttpJavaRequestCodeGenerator(),
      includes: ['MediaType.parse("text/plain")', '"hello world"'],
      excludes: ['application/json'],
    },
    {
      name: 'java/apache-httpclient',
      generator: new ApacheHttpClientJavaRequestCodeGenerator(),
      includes: [
        'setHeader("Content-Type", "text/plain")',
        'String requestBody = "hello world";',
      ],
      excludes: ['application/json', 'writeValueAsString'],
    },
    {
      name: 'java/unirest',
      generator: new UnirestJavaRequestCodeGenerator(),
      includes: [
        '.header("Content-Type", "text/plain")',
        '.body("hello world")',
      ],
      excludes: ['application/json'],
    },
    {
      name: 'java/retrofit',
      generator: new RetrofitJavaRequestCodeGenerator(),
      includes: [
        '@Headers("Content-Type: text/plain")',
        'RequestBody.create(MediaType.parse("text/plain"), "hello world")',
      ],
      excludes: ['new Gson().toJsonTree', 'application/json'],
    },
    {
      name: 'kotlin/okhttp',
      generator: new OkHttpKotlinRequestCodeGenerator(),
      includes: ['MediaType.parse("text/plain")', '"hello world"'],
      excludes: ['application/json'],
    },
    {
      name: 'kotlin/retrofit',
      generator: new RetrofitKotlinRequestCodeGenerator(),
      includes: [
        '@Headers("Content-Type: text/plain")',
        'RequestBody.create(MediaType.parse("text/plain"), "hello world")',
      ],
      excludes: ['Gson().toJsonTree', 'application/json'],
    },
    {
      name: 'php/curl',
      generator: new CurlPhpRequestCodeGenerator(),
      includes: [
        'Content-Type: text/plain',
        "CURLOPT_POSTFIELDS, 'hello world'",
      ],
      excludes: ['application/json', 'CURLOPT_POSTFIELDS, json_encode'],
    },
    {
      name: 'php/guzzle',
      generator: new GuzzlePhpRequestCodeGenerator(),
      includes: ["'Content-Type' => 'text/plain'", "'body' => 'hello world'"],
      excludes: ["'json' =>", 'application/json'],
    },
    {
      name: 'ruby/faraday',
      generator: new FaradayRubyRequestCodeGenerator(),
      includes: [
        "req.headers['Content-Type'] = 'text/plain'",
        "req.body = 'hello world'",
      ],
      excludes: ['application/json', '.to_json'],
    },
    {
      name: 'ruby/httparty',
      generator: new HttpartyRubyRequestCodeGenerator(),
      includes: ["'Content-Type' => 'text/plain'", "body: 'hello world',"],
      excludes: ['application/json', '.to_json'],
    },
    {
      name: 'swift/alamofire',
      generator: new AlamofireSwiftRequestCodeGenerator(),
      includes: ['"Content-Type": "text/plain"', '"hello world"'],
      excludes: ['application/json'],
    },
    {
      name: 'swift/urlsession',
      generator: new UrlsessionSwiftRequestCodeGenerator(),
      includes: [
        'setValue("text/plain", forHTTPHeaderField: "Content-Type")',
        '"hello world".data(using: .utf8)',
      ],
      excludes: ['application/json', 'JSONSerialization.data'],
    },
    {
      name: 'dart/http',
      generator: new HttpDartRequestCodeGenerator(),
      includes: ['"Content-Type": "text/plain"', "final body = 'hello world';"],
      excludes: ['application/json', 'jsonEncode'],
    },
    {
      name: 'dart/dio',
      generator: new DioDartRequestCodeGenerator(),
      includes: [
        "'Content-Type': 'text/plain'",
        "final requestBody = 'hello world';",
      ],
      excludes: ['application/json', 'final requestBody = {'],
    },
  ];

  for (const testCase of cases) {
    test(`generates raw text bodies for ${testCase.name}`, () => {
      const code = testCase.generator.generateCode(
        BASE_TEST_CONFIG.path,
        'POST',
        BASE_TEST_CONFIG.baseUrl,
        POST_TEST_OPERATION,
        [],
        [],
        [],
        'hello world',
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
