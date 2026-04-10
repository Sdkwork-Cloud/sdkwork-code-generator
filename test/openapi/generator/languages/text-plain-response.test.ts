import { FetchJavaScriptRequestCodeGenerator } from '../../../../src/openapi/generator/languages/javascript/fetch';
import { GotJavaScriptRequestCodeGenerator } from '../../../../src/openapi/generator/languages/javascript/got';
import { SuperagentJavaScriptRequestCodeGenerator } from '../../../../src/openapi/generator/languages/javascript/superagent';
import { FetchTypeScriptRequestCodeGenerator } from '../../../../src/openapi/generator/languages/typescript/fetch';
import { GotTypeScriptRequestCodeGenerator } from '../../../../src/openapi/generator/languages/typescript/got';
import { SuperagentTypeScriptRequestCodeGenerator } from '../../../../src/openapi/generator/languages/typescript/superagent';
import { RequestsPythonRequestCodeGenerator } from '../../../../src/openapi/generator/languages/python/requests';
import { AiohttpPythonRequestCodeGenerator } from '../../../../src/openapi/generator/languages/python/aiohttp';
import { HttpxPythonRequestCodeGenerator } from '../../../../src/openapi/generator/languages/python/httpx';
import { FasthttpGoRequestCodeGenerator } from '../../../../src/openapi/generator/languages/go/fasthttp';
import { RestyGoRequestCodeGenerator } from '../../../../src/openapi/generator/languages/go/resty';
import { CppHttplibCppRequestCodeGenerator } from '../../../../src/openapi/generator/languages/cpp/cpp-httplib';
import { BoostBeastCppRequestCodeGenerator } from '../../../../src/openapi/generator/languages/cpp/boost-beast';
import { RefitCsharpRequestCodeGenerator } from '../../../../src/openapi/generator/languages/csharp/refit';
import { RestsharpCsharpRequestCodeGenerator } from '../../../../src/openapi/generator/languages/csharp/restsharp';
import { RetrofitJavaRequestCodeGenerator } from '../../../../src/openapi/generator/languages/java/retrofit';
import { UnirestJavaRequestCodeGenerator } from '../../../../src/openapi/generator/languages/java/unirest';
import { RetrofitKotlinRequestCodeGenerator } from '../../../../src/openapi/generator/languages/kotlin/retrofit';
import { CurlPhpRequestCodeGenerator } from '../../../../src/openapi/generator/languages/php/curl';
import { GuzzlePhpRequestCodeGenerator } from '../../../../src/openapi/generator/languages/php/guzzle';
import { HttpartyRubyRequestCodeGenerator } from '../../../../src/openapi/generator/languages/ruby/httparty';
import { UrlsessionSwiftRequestCodeGenerator } from '../../../../src/openapi/generator/languages/swift/urlsession';
import {
  CodeGenerateContext,
  ExampleOpenAPIParameter,
  HttpMethod,
  OpenAPIOperation,
} from '../../../../src/types';
import { BASE_TEST_CONFIG } from './test-data';

type TextResponseCase = {
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

const TEXT_RESPONSE_OPERATION: OpenAPIOperation = {
  operationId: 'getStatusText',
  summary: 'Get status text',
  description: 'Returns a plain text status message',
  responses: {
    '200': {
      description: 'Plain text response',
      content: {
        'text/plain': {
          schema: {
            type: 'string',
            example: 'service healthy',
          },
        },
      },
    },
  },
};

describe('text/plain response support', () => {
  const context: CodeGenerateContext = {
    ...BASE_TEST_CONFIG.context,
    responseContentType: 'text/plain',
    responseBodySchema: {
      type: 'string',
      example: 'service healthy',
    },
  };

  const cases: TextResponseCase[] = [
    {
      name: 'javascript/fetch',
      generator: new FetchJavaScriptRequestCodeGenerator(),
      includes: ['const data = await response.text();'],
      excludes: ['response.json()'],
    },
    {
      name: 'javascript/got',
      generator: new GotJavaScriptRequestCodeGenerator(),
      includes: ['const data = response.body;'],
      excludes: ['JSON.parse(response.body)'],
    },
    {
      name: 'javascript/superagent',
      generator: new SuperagentJavaScriptRequestCodeGenerator(),
      includes: ['const data = response.text;'],
      excludes: ['const data = response.body;'],
    },
    {
      name: 'typescript/fetch',
      generator: new FetchTypeScriptRequestCodeGenerator(),
      includes: ['const data = await response.text();'],
      excludes: ['response.json()'],
    },
    {
      name: 'typescript/got',
      generator: new GotTypeScriptRequestCodeGenerator(),
      includes: ['const data = response.body;'],
      excludes: ['JSON.parse(response.body)'],
    },
    {
      name: 'typescript/superagent',
      generator: new SuperagentTypeScriptRequestCodeGenerator(),
      includes: ['const data = response.text;'],
      excludes: ['const data = response.body;'],
    },
    {
      name: 'python/requests',
      generator: new RequestsPythonRequestCodeGenerator(),
      includes: ['data = response.text', 'return data'],
      excludes: ['return response.json()'],
    },
    {
      name: 'python/aiohttp',
      generator: new AiohttpPythonRequestCodeGenerator(),
      includes: ['data = await response.text()'],
      excludes: ['data = await response.json()'],
    },
    {
      name: 'python/httpx',
      generator: new HttpxPythonRequestCodeGenerator(),
      includes: ['data = response.text'],
      excludes: ['data = response.json()'],
    },
    {
      name: 'go/fasthttp',
      generator: new FasthttpGoRequestCodeGenerator(),
      includes: [
        'func getStatusText() (string, error) {',
        'data := string(resp.Body())',
      ],
      excludes: ['json.Unmarshal(resp.Body(), &data)'],
    },
    {
      name: 'go/resty',
      generator: new RestyGoRequestCodeGenerator(),
      includes: [
        'func getStatusText() (string, error) {',
        'data := string(resp.Body())',
      ],
      excludes: ['json.Unmarshal(resp.Body(), &data)'],
    },
    {
      name: 'cpp/cpp-httplib',
      generator: new CppHttplibCppRequestCodeGenerator(),
      includes: ['std::string data = response->body;'],
      excludes: ['json::parse(response->body)'],
    },
    {
      name: 'cpp/boost-beast',
      generator: new BoostBeastCppRequestCodeGenerator(),
      includes: ['std::string data = response_body;'],
      excludes: ['json::parse(response_body)'],
    },
    {
      name: 'csharp/restsharp',
      generator: new RestsharpCsharpRequestCodeGenerator(),
      includes: ['var data = response.Content;'],
      excludes: ['JsonConvert.DeserializeObject<object>(response.Content)'],
    },
    {
      name: 'csharp/refit',
      generator: new RefitCsharpRequestCodeGenerator(),
      includes: [
        'Task<ApiResponse<string>> getStatusTextAsync(',
        'var result = response.Content;',
        'Console.WriteLine("Response: " + result);',
      ],
      excludes: [
        'Task<ApiResponse<object>> getStatusTextAsync(',
        'JsonConvert.SerializeObject(result, Formatting.Indented)',
      ],
    },
    {
      name: 'java/unirest',
      generator: new UnirestJavaRequestCodeGenerator(),
      includes: [
        'HttpResponse<String> response',
        '.asString();',
        'String data = response.getBody();',
      ],
      excludes: [
        '.asJson();',
        'JSONObject data = response.getBody().getObject();',
      ],
    },
    {
      name: 'java/retrofit',
      generator: new RetrofitJavaRequestCodeGenerator(),
      includes: [
        'Call<String> getStatusText(',
        'Call<String> call = service.getStatusText(',
        'retrofit2.Response<String> response = call.execute();',
        'String data = response.body();',
      ],
      excludes: [
        'Call<Object> getStatusText(',
        'Object data = response.body();',
      ],
    },
    {
      name: 'kotlin/retrofit',
      generator: new RetrofitKotlinRequestCodeGenerator(),
      includes: ['): Call<String>', 'println("Response: ${data}")'],
      excludes: ['): Call<Any>', 'Gson().toJson(data)'],
    },
    {
      name: 'php/curl',
      generator: new CurlPhpRequestCodeGenerator(),
      includes: ['$data = $response;'],
      excludes: ['json_decode($response, true)'],
    },
    {
      name: 'php/guzzle',
      generator: new GuzzlePhpRequestCodeGenerator(),
      includes: ['$data = (string) $response->getBody();'],
      excludes: ['json_decode($response->getBody(), true)'],
    },
    {
      name: 'ruby/httparty',
      generator: new HttpartyRubyRequestCodeGenerator(),
      includes: ['data = response.body'],
      excludes: ['JSON.parse(response.body)'],
    },
    {
      name: 'swift/urlsession',
      generator: new UrlsessionSwiftRequestCodeGenerator(),
      includes: [
        'let responseText = String(data: data, encoding: .utf8) ?? ""',
      ],
      excludes: ['JSONSerialization.jsonObject(with: data)'],
    },
  ];

  for (const testCase of cases) {
    test(`generates plain-text response handling for ${testCase.name}`, () => {
      const code = testCase.generator.generateCode(
        BASE_TEST_CONFIG.path,
        'GET',
        BASE_TEST_CONFIG.baseUrl,
        TEXT_RESPONSE_OPERATION,
        [],
        [],
        [],
        undefined,
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
