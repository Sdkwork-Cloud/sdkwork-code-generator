import { FetchJavaScriptRequestCodeGenerator } from '../../../../src/openapi/generator/languages/javascript/fetch';
import { GotJavaScriptRequestCodeGenerator } from '../../../../src/openapi/generator/languages/javascript/got';
import { FetchTypeScriptRequestCodeGenerator } from '../../../../src/openapi/generator/languages/typescript/fetch';
import { GotTypeScriptRequestCodeGenerator } from '../../../../src/openapi/generator/languages/typescript/got';
import { RequestsPythonRequestCodeGenerator } from '../../../../src/openapi/generator/languages/python/requests';
import { AiohttpPythonRequestCodeGenerator } from '../../../../src/openapi/generator/languages/python/aiohttp';
import { HttpxPythonRequestCodeGenerator } from '../../../../src/openapi/generator/languages/python/httpx';
import { FasthttpGoRequestCodeGenerator } from '../../../../src/openapi/generator/languages/go/fasthttp';
import { RestyGoRequestCodeGenerator } from '../../../../src/openapi/generator/languages/go/resty';
import { RestsharpCsharpRequestCodeGenerator } from '../../../../src/openapi/generator/languages/csharp/restsharp';
import { RefitCsharpRequestCodeGenerator } from '../../../../src/openapi/generator/languages/csharp/refit';
import { CurlPhpRequestCodeGenerator } from '../../../../src/openapi/generator/languages/php/curl';
import { GuzzlePhpRequestCodeGenerator } from '../../../../src/openapi/generator/languages/php/guzzle';
import { HttpartyRubyRequestCodeGenerator } from '../../../../src/openapi/generator/languages/ruby/httparty';
import { UnirestJavaRequestCodeGenerator } from '../../../../src/openapi/generator/languages/java/unirest';
import { RetrofitJavaRequestCodeGenerator } from '../../../../src/openapi/generator/languages/java/retrofit';
import { RetrofitKotlinRequestCodeGenerator } from '../../../../src/openapi/generator/languages/kotlin/retrofit';
import { UrlsessionSwiftRequestCodeGenerator } from '../../../../src/openapi/generator/languages/swift/urlsession';
import {
  CodeGenerateContext,
  ExampleOpenAPIParameter,
  HttpMethod,
  OpenAPIOperation,
} from '../../../../src/types';
import { BASE_TEST_CONFIG } from './test-data';

type NoContentResponseCase = {
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

const NO_CONTENT_OPERATION: OpenAPIOperation = {
  operationId: 'deleteUser',
  summary: 'Delete a user',
  description: 'Deletes a user and returns no response body',
  responses: {
    '204': {
      description: 'User deleted',
    },
  },
};

describe('204 no-content response support', () => {
  const context: CodeGenerateContext = {
    ...BASE_TEST_CONFIG.context,
    responseStatusCode: '204',
    responseContentType: undefined,
    responseBodySchema: undefined,
  };

  const cases: NoContentResponseCase[] = [
    {
      name: 'javascript/fetch',
      generator: new FetchJavaScriptRequestCodeGenerator(),
      includes: [
        'if (response.status !== 204) {',
        'const data = await response.text();',
      ],
      excludes: ['await response.json()'],
    },
    {
      name: 'javascript/got',
      generator: new GotJavaScriptRequestCodeGenerator(),
      includes: [
        'if (response.statusCode !== 204) {',
        'const data = response.body;',
      ],
      excludes: ['JSON.parse(response.body)'],
    },
    {
      name: 'typescript/fetch',
      generator: new FetchTypeScriptRequestCodeGenerator(),
      includes: [
        'if (response.status !== 204) {',
        'const data = await response.text();',
      ],
      excludes: ['await response.json()'],
    },
    {
      name: 'typescript/got',
      generator: new GotTypeScriptRequestCodeGenerator(),
      includes: [
        'if (response.statusCode !== 204) {',
        'const data = response.body;',
      ],
      excludes: ['JSON.parse(response.body)'],
    },
    {
      name: 'python/requests',
      generator: new RequestsPythonRequestCodeGenerator(),
      includes: [
        'if response.status_code != 204:',
        'data = response.text',
        'return data',
      ],
      excludes: ['return response.json()'],
    },
    {
      name: 'python/aiohttp',
      generator: new AiohttpPythonRequestCodeGenerator(),
      includes: ['if response.status != 204:', 'data = await response.text()'],
      excludes: ['data = await response.json()'],
    },
    {
      name: 'python/httpx',
      generator: new HttpxPythonRequestCodeGenerator(),
      includes: [
        'if response.status_code != 204:',
        'data = response.text',
        'return data',
      ],
      excludes: ['data = response.json()'],
    },
    {
      name: 'go/fasthttp',
      generator: new FasthttpGoRequestCodeGenerator(),
      includes: [
        'func deleteUser() (string, error) {',
        'if resp.StatusCode() != 204 {',
        'data := string(resp.Body())',
      ],
      excludes: ['json.Unmarshal(resp.Body(), &data)'],
    },
    {
      name: 'go/resty',
      generator: new RestyGoRequestCodeGenerator(),
      includes: [
        'func deleteUser() (string, error) {',
        'if resp.StatusCode() != 204 {',
        'data := string(resp.Body())',
      ],
      excludes: ['json.Unmarshal(resp.Body(), &data)'],
    },
    {
      name: 'csharp/restsharp',
      generator: new RestsharpCsharpRequestCodeGenerator(),
      includes: [
        'if ((int)response.StatusCode != 204)',
        'var data = response.Content;',
      ],
      excludes: ['JsonConvert.DeserializeObject<object>(response.Content)'],
    },
    {
      name: 'csharp/refit',
      generator: new RefitCsharpRequestCodeGenerator(),
      includes: [
        'Task<ApiResponse<string>> deleteUserAsync(',
        'if ((int)response.StatusCode != 204)',
      ],
      excludes: ['Task<ApiResponse<object>> deleteUserAsync('],
    },
    {
      name: 'php/curl',
      generator: new CurlPhpRequestCodeGenerator(),
      includes: ['if ($http_code != 204) {', '$data = $response;'],
      excludes: ['json_decode($response, true)'],
    },
    {
      name: 'php/guzzle',
      generator: new GuzzlePhpRequestCodeGenerator(),
      includes: [
        'if ($response->getStatusCode() != 204) {',
        '$data = (string) $response->getBody();',
      ],
      excludes: ['json_decode($response->getBody(), true)'],
    },
    {
      name: 'ruby/httparty',
      generator: new HttpartyRubyRequestCodeGenerator(),
      includes: ['if response.code != 204', 'data = response.body'],
      excludes: ['JSON.parse(response.body)'],
    },
    {
      name: 'java/unirest',
      generator: new UnirestJavaRequestCodeGenerator(),
      includes: [
        'HttpResponse<String> response',
        '.asString();',
        'if (response.getStatus() != 204) {',
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
        'Call<String> deleteUser(',
        'retrofit2.Response<String> response = call.execute();',
        'if (response.code() != 204) {',
      ],
      excludes: [
        'Call<Object> deleteUser(',
        'retrofit2.Response<Object> response = call.execute();',
      ],
    },
    {
      name: 'kotlin/retrofit',
      generator: new RetrofitKotlinRequestCodeGenerator(),
      includes: ['): Call<String>', 'if (response.code() != 204) {'],
      excludes: ['): Call<Any>', 'println("Response: ${Gson().toJson(data)}")'],
    },
    {
      name: 'swift/urlsession',
      generator: new UrlsessionSwiftRequestCodeGenerator(),
      includes: [
        'if httpResponse.statusCode != 204 {',
        'let responseText = String(data: data, encoding: .utf8) ?? ""',
      ],
      excludes: ['JSONSerialization.jsonObject(with: data)'],
    },
  ];

  for (const testCase of cases) {
    test(`generates no-content response handling for ${testCase.name}`, () => {
      const code = testCase.generator.generateCode(
        BASE_TEST_CONFIG.path,
        'DELETE',
        BASE_TEST_CONFIG.baseUrl,
        NO_CONTENT_OPERATION,
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
