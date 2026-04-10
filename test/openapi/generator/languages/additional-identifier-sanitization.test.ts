import { CpprestCppRequestCodeGenerator } from '../../../../src/openapi/generator/languages/cpp/cpprest';
import { HttpClientCSharpRequestCodeGenerator } from '../../../../src/openapi/generator/languages/csharp/httpclient';
import { RefitCsharpRequestCodeGenerator } from '../../../../src/openapi/generator/languages/csharp/refit';
import { RestsharpCsharpRequestCodeGenerator } from '../../../../src/openapi/generator/languages/csharp/restsharp';
import { DioDartRequestCodeGenerator } from '../../../../src/openapi/generator/languages/dart/dio';
import { HttpDartRequestCodeGenerator } from '../../../../src/openapi/generator/languages/dart/http';
import { FasthttpGoRequestCodeGenerator } from '../../../../src/openapi/generator/languages/go/fasthttp';
import { NetHttpGoRequestCodeGenerator } from '../../../../src/openapi/generator/languages/go/net_http';
import { RestyGoRequestCodeGenerator } from '../../../../src/openapi/generator/languages/go/resty';
import { ApacheHttpClientJavaRequestCodeGenerator } from '../../../../src/openapi/generator/languages/java/apache_httpclient';
import { OkHttpJavaRequestCodeGenerator } from '../../../../src/openapi/generator/languages/java/okhttp';
import { RetrofitJavaRequestCodeGenerator } from '../../../../src/openapi/generator/languages/java/retrofit';
import { UnirestJavaRequestCodeGenerator } from '../../../../src/openapi/generator/languages/java/unirest';
import { OkHttpKotlinRequestCodeGenerator } from '../../../../src/openapi/generator/languages/kotlin/okhttp';
import { RetrofitKotlinRequestCodeGenerator } from '../../../../src/openapi/generator/languages/kotlin/retrofit';
import { CurlPhpRequestCodeGenerator } from '../../../../src/openapi/generator/languages/php/curl';
import { GuzzlePhpRequestCodeGenerator } from '../../../../src/openapi/generator/languages/php/guzzle';
import { FaradayRubyRequestCodeGenerator } from '../../../../src/openapi/generator/languages/ruby/faraday';
import { HttpartyRubyRequestCodeGenerator } from '../../../../src/openapi/generator/languages/ruby/httparty';
import { ReqwestRustRequestCodeGenerator } from '../../../../src/openapi/generator/languages/rust/reqwest';
import { AlamofireSwiftRequestCodeGenerator } from '../../../../src/openapi/generator/languages/swift/alamofire';
import { UrlsessionSwiftRequestCodeGenerator } from '../../../../src/openapi/generator/languages/swift/urlsession';
import {
  CodeGenerateContext,
  OpenAPIOperation,
  RequestCodeGenerator,
} from '../../../../src/types';

type SanitizationCase = {
  name: string;
  generator: RequestCodeGenerator;
  expectedFragments: string[];
};

const INVALID_IDENTIFIER_OPERATION: OpenAPIOperation = {
  operationId: 'create-user-v2',
  summary: 'Create user',
  description: 'Creates a user',
  requestBody: {
    required: true,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
        },
      },
    },
  },
  responses: {
    '201': {
      description: 'created',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              id: { type: 'string' },
            },
          },
        },
      },
    },
  },
};

const IDENTIFIER_CONTEXT: CodeGenerateContext = {
  baseUrl: 'https://api.example.com',
  language: 'javascript',
  library: 'axios',
  openAPISpec: {
    openapi: '3.0.0',
    info: {
      title: 'Identifier API',
      version: '1.0.0',
    },
    paths: {},
  },
  requestContentType: 'application/json',
  requestBodySchema: {
    type: 'object',
    properties: {
      name: { type: 'string' },
    },
  },
  responseContentType: 'application/json',
  responseBodySchema: {
    type: 'object',
    properties: {
      id: { type: 'string' },
    },
  },
  responseStatusCode: '201',
};

describe('additional generator identifier sanitization', () => {
  const cases: SanitizationCase[] = [
    {
      name: 'cpp/cpprest',
      generator: new CpprestCppRequestCodeGenerator(),
      expectedFragments: ['void create_user_v2()', 'create_user_v2();'],
    },
    {
      name: 'rust/reqwest',
      generator: new ReqwestRustRequestCodeGenerator(),
      expectedFragments: ['async fn create_user_v2()', 'create_user_v2().await'],
    },
    {
      name: 'go/net_http',
      generator: new NetHttpGoRequestCodeGenerator(),
      expectedFragments: ['func createUserV2()', 'createUserV2()'],
    },
    {
      name: 'go/fasthttp',
      generator: new FasthttpGoRequestCodeGenerator(),
      expectedFragments: ['func createUserV2()', 'createUserV2()'],
    },
    {
      name: 'go/resty',
      generator: new RestyGoRequestCodeGenerator(),
      expectedFragments: ['func createUserV2()', 'createUserV2()'],
    },
    {
      name: 'java/okhttp',
      generator: new OkHttpJavaRequestCodeGenerator(),
      expectedFragments: [
        'public class CreateUserV2',
        'public static void createUserV2()',
      ],
    },
    {
      name: 'java/apache-httpclient',
      generator: new ApacheHttpClientJavaRequestCodeGenerator(),
      expectedFragments: [
        'public class CreateUserV2',
        'CreateUserV2Response createUserV2()',
      ],
    },
    {
      name: 'java/retrofit',
      generator: new RetrofitJavaRequestCodeGenerator(),
      expectedFragments: [
        'public class CreateUserV2',
        'Call<Object> createUserV2(',
        'public static void createUserV2() throws Exception',
      ],
    },
    {
      name: 'java/unirest',
      generator: new UnirestJavaRequestCodeGenerator(),
      expectedFragments: [
        'public class CreateUserV2',
        'public static void createUserV2() throws Exception',
      ],
    },
    {
      name: 'kotlin/okhttp',
      generator: new OkHttpKotlinRequestCodeGenerator(),
      expectedFragments: ['fun createUserV2()'],
    },
    {
      name: 'kotlin/retrofit',
      generator: new RetrofitKotlinRequestCodeGenerator(),
      expectedFragments: ['fun createUserV2(', 'createUserV2()'],
    },
    {
      name: 'csharp/httpclient',
      generator: new HttpClientCSharpRequestCodeGenerator(),
      expectedFragments: ['public class CreateUserV2', 'createUserV2Async()'],
    },
    {
      name: 'csharp/refit',
      generator: new RefitCsharpRequestCodeGenerator(),
      expectedFragments: ['class CreateUserV2', 'createUserV2Async('],
    },
    {
      name: 'csharp/restsharp',
      generator: new RestsharpCsharpRequestCodeGenerator(),
      expectedFragments: ['class CreateUserV2', 'createUserV2()'],
    },
    {
      name: 'php/curl',
      generator: new CurlPhpRequestCodeGenerator(),
      expectedFragments: ['function createUserV2()', 'createUserV2();'],
    },
    {
      name: 'php/guzzle',
      generator: new GuzzlePhpRequestCodeGenerator(),
      expectedFragments: ['function createUserV2()', 'createUserV2();'],
    },
    {
      name: 'ruby/httparty',
      generator: new HttpartyRubyRequestCodeGenerator(),
      expectedFragments: ['def create_user_v2', 'create_user_v2()'],
    },
    {
      name: 'ruby/faraday',
      generator: new FaradayRubyRequestCodeGenerator(),
      expectedFragments: ['def create_user_v2', 'create_user_v2'],
    },
    {
      name: 'swift/urlsession',
      generator: new UrlsessionSwiftRequestCodeGenerator(),
      expectedFragments: ['func createUserV2()'],
    },
    {
      name: 'swift/alamofire',
      generator: new AlamofireSwiftRequestCodeGenerator(),
      expectedFragments: ['func createUserV2()'],
    },
    {
      name: 'dart/http',
      generator: new HttpDartRequestCodeGenerator(),
      expectedFragments: ['Future<void> createUserV2() async {'],
    },
    {
      name: 'dart/dio',
      generator: new DioDartRequestCodeGenerator(),
      expectedFragments: ['Future<void> createUserV2() async {'],
    },
  ];

  for (const testCase of cases) {
    test(`sanitizes invalid operation identifiers for ${testCase.name}`, () => {
      const result = testCase.generator.generate(
        {
          path: '/users',
          method: 'POST',
          operation: INVALID_IDENTIFIER_OPERATION,
          pathItem: {},
        },
        IDENTIFIER_CONTEXT
      );
      const code = result.code;

      for (const expectedFragment of testCase.expectedFragments) {
        expect(code).toContain(expectedFragment);
      }

      expect(code).not.toContain('create-user-v2');
    });
  }
});
