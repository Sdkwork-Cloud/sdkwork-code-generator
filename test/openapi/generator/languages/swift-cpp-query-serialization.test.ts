import { BoostBeastCppRequestCodeGenerator } from '../../../../src/openapi/generator/languages/cpp/boost-beast';
import { CppHttplibCppRequestCodeGenerator } from '../../../../src/openapi/generator/languages/cpp/cpp-httplib';
import { CpprestCppRequestCodeGenerator } from '../../../../src/openapi/generator/languages/cpp/cpprest';
import { AlamofireSwiftRequestCodeGenerator } from '../../../../src/openapi/generator/languages/swift/alamofire';
import { UrlsessionSwiftRequestCodeGenerator } from '../../../../src/openapi/generator/languages/swift/urlsession';
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

describe('swift/cpp query parameter serialization', () => {
  const queryParams: ExampleOpenAPIParameter[] = [
    {
      name: 'tags',
      in: 'query',
      required: false,
      schema: {
        type: 'array',
        items: { type: 'string' },
      },
      value: ['red', 'blue green'],
    },
    {
      name: 'filter',
      in: 'query',
      required: false,
      schema: {
        type: 'object',
        properties: {
          role: { type: 'string' },
          name: { type: 'string' },
        },
      },
      value: {
        role: 'admin',
        name: 'Alex Smith',
      },
    },
  ];
  const context: CodeGenerateContext = {
    ...BASE_TEST_CONFIG.context,
  };

  const cases: GeneratorCase[] = [
    {
      name: 'swift/urlsession',
      generator: new UrlsessionSwiftRequestCodeGenerator(),
      includes: [
        'urlString += (urlString.contains("?") ? "&" : "?") + "tags=" + "red".addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed.subtracting(CharacterSet(charactersIn: "&=?+")))!',
        'urlString += (urlString.contains("?") ? "&" : "?") + "tags=" + "blue green".addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed.subtracting(CharacterSet(charactersIn: "&=?+")))!',
        'urlString += (urlString.contains("?") ? "&" : "?") + "role=" + "admin".addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed.subtracting(CharacterSet(charactersIn: "&=?+")))!',
        'urlString += (urlString.contains("?") ? "&" : "?") + "name=" + "Alex Smith".addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed.subtracting(CharacterSet(charactersIn: "&=?+")))!',
      ],
      excludes: ['"red,blue green"', '"[object Object]"'],
    },
    {
      name: 'swift/alamofire',
      generator: new AlamofireSwiftRequestCodeGenerator(),
      includes: [
        'url += (url.contains("?") ? "&" : "?") + "tags=" + "red".addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed.subtracting(CharacterSet(charactersIn: "&=?+")))!',
        'url += (url.contains("?") ? "&" : "?") + "tags=" + "blue green".addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed.subtracting(CharacterSet(charactersIn: "&=?+")))!',
        'url += (url.contains("?") ? "&" : "?") + "role=" + "admin".addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed.subtracting(CharacterSet(charactersIn: "&=?+")))!',
        'url += (url.contains("?") ? "&" : "?") + "name=" + "Alex Smith".addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed.subtracting(CharacterSet(charactersIn: "&=?+")))!',
      ],
      excludes: ['"red,blue green"', '"[object Object]"'],
    },
    {
      name: 'cpp/cpprest',
      generator: new CpprestCppRequestCodeGenerator(),
      includes: [
        'builder.append_query(U("tags"), U("red"));',
        'builder.append_query(U("tags"), U("blue green"));',
        'builder.append_query(U("role"), U("admin"));',
        'builder.append_query(U("name"), U("Alex Smith"));',
      ],
      excludes: [
        'builder.append_query(U("tags"), U("red,blue green"));',
        'builder.append_query(U("filter"), U("[object Object]"));',
      ],
    },
    {
      name: 'cpp/cpp-httplib',
      generator: new CppHttplibCppRequestCodeGenerator(),
      includes: [
        `path += (path.find('?') != std::string::npos ? "&" : "?") + "tags=" + urlEncode("red");`,
        `path += (path.find('?') != std::string::npos ? "&" : "?") + "tags=" + urlEncode("blue green");`,
        `path += (path.find('?') != std::string::npos ? "&" : "?") + "role=" + urlEncode("admin");`,
        `path += (path.find('?') != std::string::npos ? "&" : "?") + "name=" + urlEncode("Alex Smith");`,
      ],
      excludes: [
        `path += (path.find('?') != std::string::npos ? "&" : "?") + "tags=" + urlEncode("red,blue green");`,
        `path += (path.find('?') != std::string::npos ? "&" : "?") + "filter=" + urlEncode("[object Object]");`,
      ],
    },
    {
      name: 'cpp/boost-beast',
      generator: new BoostBeastCppRequestCodeGenerator(),
      includes: [
        `target += (target.find('?') != std::string::npos ? "&" : "?") + "tags=" + urlEncode("red");`,
        `target += (target.find('?') != std::string::npos ? "&" : "?") + "tags=" + urlEncode("blue green");`,
        `target += (target.find('?') != std::string::npos ? "&" : "?") + "role=" + urlEncode("admin");`,
        `target += (target.find('?') != std::string::npos ? "&" : "?") + "name=" + urlEncode("Alex Smith");`,
      ],
      excludes: [
        'http::request<http::string_body> req{http::verb::get, "/api/v1/users", 11};',
        `target += (target.find('?') != std::string::npos ? "&" : "?") + "tags=" + urlEncode("red,blue green");`,
        `target += (target.find('?') != std::string::npos ? "&" : "?") + "filter=" + urlEncode("[object Object]");`,
      ],
    },
  ];

  test.each(cases)(
    '$name expands array and object query parameters using form-style defaults',
    ({ generator, includes, excludes }) => {
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

      includes.forEach((snippet) => expect(code).toContain(snippet));
      excludes.forEach((snippet) => expect(code).not.toContain(snippet));
    }
  );
});
