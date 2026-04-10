import { BoostBeastCppRequestCodeGenerator } from '../../../../src/openapi/generator/languages/cpp/boost-beast';
import { CppHttplibCppRequestCodeGenerator } from '../../../../src/openapi/generator/languages/cpp/cpp-httplib';
import { CpprestCppRequestCodeGenerator } from '../../../../src/openapi/generator/languages/cpp/cpprest';
import { RefitCsharpRequestCodeGenerator } from '../../../../src/openapi/generator/languages/csharp/refit';
import { RestsharpCsharpRequestCodeGenerator } from '../../../../src/openapi/generator/languages/csharp/restsharp';
import { RetrofitJavaRequestCodeGenerator } from '../../../../src/openapi/generator/languages/java/retrofit';
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
  includes: string[];
  excludes: string[];
};

describe('server base path preservation', () => {
  const baseUrl = 'https://api.example.com/service';
  const path = '/users';
  const context: CodeGenerateContext = {
    ...BASE_TEST_CONFIG.context,
  };

  const cases: GeneratorCase[] = [
    {
      name: 'cpp/boost-beast',
      generator: new BoostBeastCppRequestCodeGenerator(),
      includes: [
        'resolver.resolve("api.example.com", "443")',
        'std::string target = "/service/users";',
        'req.set(http::field::host, "api.example.com");',
      ],
      excludes: ['resolver.resolve("api.example.com/service"', 'std::string target = "/users";'],
    },
    {
      name: 'cpp/cpp-httplib',
      generator: new CppHttplibCppRequestCodeGenerator(),
      includes: [
        'httplib::Client cli("https://api.example.com");',
        'std::string path = "/service/users";',
      ],
      excludes: [
        'httplib::Client cli("https://api.example.com/service");',
        'std::string path = "/users";',
      ],
    },
    {
      name: 'cpp/cpprest',
      generator: new CpprestCppRequestCodeGenerator(),
      includes: [
        'http_client client(U("https://api.example.com"));',
        'uri_builder builder(U("/service/users"));',
      ],
      excludes: [
        'http_client client(U("https://api.example.com/service"));',
        'uri_builder builder(U("/users"));',
      ],
    },
    {
      name: 'csharp/restsharp',
      generator: new RestsharpCsharpRequestCodeGenerator(),
      includes: [
        'var client = new RestClient("https://api.example.com");',
        'var request = new RestRequest("/service/users", Method.Get);',
      ],
      excludes: [
        'var client = new RestClient("https://api.example.com/service");',
        'var request = new RestRequest("/users", Method.Get);',
      ],
    },
    {
      name: 'csharp/refit',
      generator: new RefitCsharpRequestCodeGenerator(),
      includes: [
        '[Get("/service/users")]',
        'var apiService = RestService.For<IApiService>("https://api.example.com");',
      ],
      excludes: [
        '[Get("/users")]',
        'var apiService = RestService.For<IApiService>("https://api.example.com/service");',
      ],
    },
    {
      name: 'java/retrofit',
      generator: new RetrofitJavaRequestCodeGenerator(),
      includes: [
        '@GET("/service/users")',
        '.baseUrl("https://api.example.com")',
      ],
      excludes: ['@GET("/users")', '.baseUrl("https://api.example.com/service")'],
    },
    {
      name: 'kotlin/retrofit',
      generator: new RetrofitKotlinRequestCodeGenerator(),
      includes: [
        '@GET("/service/users")',
        '.baseUrl("https://api.example.com")',
      ],
      excludes: ['@GET("/users")', '.baseUrl("https://api.example.com/service")'],
    },
  ];

  test.each(cases)(
    '$name preserves server base path when the OpenAPI server URL contains a path prefix',
    ({ generator, includes, excludes }) => {
      const code = generator.generateCode(
        path,
        'GET',
        baseUrl,
        TEST_OPERATION,
        [],
        [],
        [],
        undefined,
        context
      );

      includes.forEach((snippet) => expect(code).toContain(snippet));
      excludes.forEach((snippet) => expect(code).not.toContain(snippet));
    }
  );
});
