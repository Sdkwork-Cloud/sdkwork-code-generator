import { BoostBeastCppRequestCodeGenerator } from '../../../../src/openapi/generator/languages/cpp/boost-beast';
import { CppHttplibCppRequestCodeGenerator } from '../../../../src/openapi/generator/languages/cpp/cpp-httplib';
import { CpprestCppRequestCodeGenerator } from '../../../../src/openapi/generator/languages/cpp/cpprest';
import { HttpClientCSharpRequestCodeGenerator } from '../../../../src/openapi/generator/languages/csharp/httpclient';
import { RefitCsharpRequestCodeGenerator } from '../../../../src/openapi/generator/languages/csharp/refit';
import { RestsharpCsharpRequestCodeGenerator } from '../../../../src/openapi/generator/languages/csharp/restsharp';
import { FasthttpGoRequestCodeGenerator } from '../../../../src/openapi/generator/languages/go/fasthttp';
import { NetHttpGoRequestCodeGenerator } from '../../../../src/openapi/generator/languages/go/net_http';
import { RestyGoRequestCodeGenerator } from '../../../../src/openapi/generator/languages/go/resty';
import { ApacheHttpClientJavaRequestCodeGenerator } from '../../../../src/openapi/generator/languages/java/apache_httpclient';
import { OkHttpJavaRequestCodeGenerator } from '../../../../src/openapi/generator/languages/java/okhttp';
import { RetrofitJavaRequestCodeGenerator } from '../../../../src/openapi/generator/languages/java/retrofit';
import { UnirestJavaRequestCodeGenerator } from '../../../../src/openapi/generator/languages/java/unirest';
import { OkHttpKotlinRequestCodeGenerator } from '../../../../src/openapi/generator/languages/kotlin/okhttp';
import { RetrofitKotlinRequestCodeGenerator } from '../../../../src/openapi/generator/languages/kotlin/retrofit';
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
  expected: string;
  unexpected: string;
};

describe('double-quoted query parameter name escaping', () => {
  const queryParams: ExampleOpenAPIParameter[] = [
    {
      name: 'client"trace',
      in: 'query',
      required: false,
      schema: { type: 'string' },
      value: 'enabled',
    },
  ];
  const context: CodeGenerateContext = {
    ...BASE_TEST_CONFIG.context,
  };

  const cases: GeneratorCase[] = [
    {
      name: 'cpp/cpprest',
      generator: new CpprestCppRequestCodeGenerator(),
      expected:
        'builder.append_query(U("client\\"trace"), U("enabled"));',
      unexpected:
        'builder.append_query(U("client"trace"), U("enabled"));',
    },
    {
      name: 'cpp/cpp-httplib',
      generator: new CppHttplibCppRequestCodeGenerator(),
      expected:
        'path += (path.find(\'?\') != std::string::npos ? "&" : "?") + "client\\"trace=" + urlEncode("enabled");',
      unexpected:
        'path += (path.find(\'?\') != std::string::npos ? "&" : "?") + "client"trace=" + urlEncode("enabled");',
    },
    {
      name: 'cpp/boost-beast',
      generator: new BoostBeastCppRequestCodeGenerator(),
      expected:
        'target += (target.find(\'?\') != std::string::npos ? "&" : "?") + "client\\"trace=" + urlEncode("enabled");',
      unexpected:
        'target += (target.find(\'?\') != std::string::npos ? "&" : "?") + "client"trace=" + urlEncode("enabled");',
    },
    {
      name: 'go/net-http',
      generator: new NetHttpGoRequestCodeGenerator(),
      expected: 'q.Add("client\\"trace", "enabled")',
      unexpected: 'q.Add("client"trace", "enabled")',
    },
    {
      name: 'go/resty',
      generator: new RestyGoRequestCodeGenerator(),
      expected: 'q.Add("client\\"trace", "enabled")',
      unexpected: 'q.Add("client"trace", "enabled")',
    },
    {
      name: 'go/fasthttp',
      generator: new FasthttpGoRequestCodeGenerator(),
      expected:
        'url += "?client\\"trace=" + neturl.QueryEscape("enabled")',
      unexpected:
        'url += "?client"trace=" + neturl.QueryEscape("enabled")',
    },
    {
      name: 'java/okhttp',
      generator: new OkHttpJavaRequestCodeGenerator(),
      expected:
        'urlBuilder.addQueryParameter("client\\"trace", "enabled");',
      unexpected:
        'urlBuilder.addQueryParameter("client"trace", "enabled");',
    },
    {
      name: 'java/apache-httpclient',
      generator: new ApacheHttpClientJavaRequestCodeGenerator(),
      expected:
        'url += "?client\\"trace=" + URLEncoder.encode("enabled", StandardCharsets.UTF_8.toString());',
      unexpected:
        'url += "?client"trace=" + URLEncoder.encode("enabled", StandardCharsets.UTF_8.toString());',
    },
    {
      name: 'java/unirest',
      generator: new UnirestJavaRequestCodeGenerator(),
      expected: '.queryString("client\\"trace", "enabled")',
      unexpected: '.queryString("client"trace", "enabled")',
    },
    {
      name: 'java/retrofit',
      generator: new RetrofitJavaRequestCodeGenerator(),
      expected: '@Query("client\\"trace") String',
      unexpected: '@Query("client"trace") String',
    },
    {
      name: 'csharp/httpclient',
      generator: new HttpClientCSharpRequestCodeGenerator(),
      expected:
        'url += "?client\\"trace=" + Uri.EscapeDataString("enabled");',
      unexpected:
        'url += "?client"trace=" + Uri.EscapeDataString("enabled");',
    },
    {
      name: 'csharp/restsharp',
      generator: new RestsharpCsharpRequestCodeGenerator(),
      expected:
        'request.AddQueryParameter("client\\"trace", "enabled");',
      unexpected:
        'request.AddQueryParameter("client"trace", "enabled");',
    },
    {
      name: 'csharp/refit',
      generator: new RefitCsharpRequestCodeGenerator(),
      expected: '[Query("client\\"trace")] string',
      unexpected: '[Query("client"trace")] string',
    },
    {
      name: 'kotlin/okhttp',
      generator: new OkHttpKotlinRequestCodeGenerator(),
      expected:
        'url += "?client\\"trace=" + URLEncoder.encode("enabled", StandardCharsets.UTF_8.toString())',
      unexpected:
        'url += "?client"trace=" + URLEncoder.encode("enabled", StandardCharsets.UTF_8.toString())',
    },
    {
      name: 'kotlin/retrofit',
      generator: new RetrofitKotlinRequestCodeGenerator(),
      expected: '@Query("client\\"trace")',
      unexpected: '@Query("client"trace")',
    },
  ];

  test.each(cases)(
    '$name escapes double quotes in query parameter names embedded in string literals',
    ({ generator, expected, unexpected }) => {
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

      expect(code).toContain(expected);
      expect(code).not.toContain(unexpected);
    }
  );
});
