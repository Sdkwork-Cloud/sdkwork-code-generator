import { BoostBeastCppRequestCodeGenerator } from '../../../../src/openapi/generator/languages/cpp/boost-beast';
import { CppHttplibCppRequestCodeGenerator } from '../../../../src/openapi/generator/languages/cpp/cpp-httplib';
import { CpprestCppRequestCodeGenerator } from '../../../../src/openapi/generator/languages/cpp/cpprest';
import { HttpClientCSharpRequestCodeGenerator } from '../../../../src/openapi/generator/languages/csharp/httpclient';
import { RefitCsharpRequestCodeGenerator } from '../../../../src/openapi/generator/languages/csharp/refit';
import { RestsharpCsharpRequestCodeGenerator } from '../../../../src/openapi/generator/languages/csharp/restsharp';
import { DioDartRequestCodeGenerator } from '../../../../src/openapi/generator/languages/dart/dio';
import { HttpDartRequestCodeGenerator } from '../../../../src/openapi/generator/languages/dart/http';
import { ApacheHttpClientJavaRequestCodeGenerator } from '../../../../src/openapi/generator/languages/java/apache_httpclient';
import { OkHttpJavaRequestCodeGenerator } from '../../../../src/openapi/generator/languages/java/okhttp';
import { RetrofitJavaRequestCodeGenerator } from '../../../../src/openapi/generator/languages/java/retrofit';
import { UnirestJavaRequestCodeGenerator } from '../../../../src/openapi/generator/languages/java/unirest';
import { AxiosJavaScriptRequestCodeGenerator } from '../../../../src/openapi/generator/languages/javascript/axios';
import { FetchJavaScriptRequestCodeGenerator } from '../../../../src/openapi/generator/languages/javascript/fetch';
import { GotJavaScriptRequestCodeGenerator } from '../../../../src/openapi/generator/languages/javascript/got';
import { SuperagentJavaScriptRequestCodeGenerator } from '../../../../src/openapi/generator/languages/javascript/superagent';
import { FasthttpGoRequestCodeGenerator } from '../../../../src/openapi/generator/languages/go/fasthttp';
import { NetHttpGoRequestCodeGenerator } from '../../../../src/openapi/generator/languages/go/net_http';
import { RestyGoRequestCodeGenerator } from '../../../../src/openapi/generator/languages/go/resty';
import { OkHttpKotlinRequestCodeGenerator } from '../../../../src/openapi/generator/languages/kotlin/okhttp';
import { RetrofitKotlinRequestCodeGenerator } from '../../../../src/openapi/generator/languages/kotlin/retrofit';
import { CurlPhpRequestCodeGenerator } from '../../../../src/openapi/generator/languages/php/curl';
import { GuzzlePhpRequestCodeGenerator } from '../../../../src/openapi/generator/languages/php/guzzle';
import { AiohttpPythonRequestCodeGenerator } from '../../../../src/openapi/generator/languages/python/aiohttp';
import { HttpxPythonRequestCodeGenerator } from '../../../../src/openapi/generator/languages/python/httpx';
import { RequestsPythonRequestCodeGenerator } from '../../../../src/openapi/generator/languages/python/requests';
import { FaradayRubyRequestCodeGenerator } from '../../../../src/openapi/generator/languages/ruby/faraday';
import { HttpartyRubyRequestCodeGenerator } from '../../../../src/openapi/generator/languages/ruby/httparty';
import { CurlShellRequestCodeGenerator } from '../../../../src/openapi/generator/languages/shell/curl';
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
  includes: string[];
  excludes: string[];
};

describe('allowReserved query serialization', () => {
  const queryParams: ExampleOpenAPIParameter[] = [
    {
      name: 'redirect',
      in: 'query',
      required: false,
      schema: { type: 'string' },
      allowReserved: true,
      value: 'users/admin:all ready',
    },
  ];
  const context: CodeGenerateContext = {
    ...BASE_TEST_CONFIG.context,
  };

  const expectedQueryString = 'redirect=users/admin:all%20ready';

  const cases: GeneratorCase[] = [
    {
      name: 'javascript/axios',
      generator: new AxiosJavaScriptRequestCodeGenerator(),
      includes: [`const queryString = '${expectedQueryString}';`],
      excludes: ['new URLSearchParams()', 'params: queryParams'],
    },
    {
      name: 'javascript/fetch',
      generator: new FetchJavaScriptRequestCodeGenerator(),
      includes: [`const queryString = '${expectedQueryString}';`],
      excludes: ['new URLSearchParams()'],
    },
    {
      name: 'javascript/got',
      generator: new GotJavaScriptRequestCodeGenerator(),
      includes: [`const queryString = '${expectedQueryString}';`],
      excludes: ['new URLSearchParams()'],
    },
    {
      name: 'javascript/superagent',
      generator: new SuperagentJavaScriptRequestCodeGenerator(),
      includes: [`const queryString = '${expectedQueryString}';`],
      excludes: ['new URLSearchParams()'],
    },
    {
      name: 'typescript/axios',
      generator: new AxiosTypeScriptRequestCodeGenerator(),
      includes: [`const queryString = '${expectedQueryString}';`],
      excludes: ['new URLSearchParams()', 'params: queryParams'],
    },
    {
      name: 'typescript/fetch',
      generator: new FetchTypeScriptRequestCodeGenerator(),
      includes: [`const queryString = '${expectedQueryString}';`],
      excludes: ['new URLSearchParams()'],
    },
    {
      name: 'typescript/got',
      generator: new GotTypeScriptRequestCodeGenerator(),
      includes: [`const queryString = '${expectedQueryString}';`],
      excludes: ['new URLSearchParams()'],
    },
    {
      name: 'typescript/superagent',
      generator: new SuperagentTypeScriptRequestCodeGenerator(),
      includes: [`const queryString = '${expectedQueryString}';`],
      excludes: ['new URLSearchParams()'],
    },
    {
      name: 'python/requests',
      generator: new RequestsPythonRequestCodeGenerator(),
      includes: [
        `url += ('?' if '?' not in url else '&') + '${expectedQueryString}'`,
      ],
      excludes: ['params=[', 'params = [', 'params=params'],
    },
    {
      name: 'python/httpx',
      generator: new HttpxPythonRequestCodeGenerator(),
      includes: [
        `url += ('?' if '?' not in url else '&') + '${expectedQueryString}'`,
      ],
      excludes: ["quote('users/admin:all ready', safe='')"],
    },
    {
      name: 'python/aiohttp',
      generator: new AiohttpPythonRequestCodeGenerator(),
      includes: [
        `url += ('?' if '?' not in url else '&') + '${expectedQueryString}'`,
      ],
      excludes: ["quote('users/admin:all ready', safe='')"],
    },
    {
      name: 'go/fasthttp',
      generator: new FasthttpGoRequestCodeGenerator(),
      includes: [`url += "?${expectedQueryString}"`],
      excludes: ['neturl.QueryEscape("users/admin:all ready")'],
    },
    {
      name: 'go/net_http',
      generator: new NetHttpGoRequestCodeGenerator(),
      includes: [`urlStr := baseURL + "?${expectedQueryString}"`],
      excludes: ['q := url.Values{}', 'q.Encode()'],
    },
    {
      name: 'go/resty',
      generator: new RestyGoRequestCodeGenerator(),
      includes: [`url += "?${expectedQueryString}"`],
      excludes: ['q := neturl.Values{}', 'q.Encode()'],
    },
    {
      name: 'java/apache-httpclient',
      generator: new ApacheHttpClientJavaRequestCodeGenerator(),
      includes: [
        `url += (url.contains("?") ? "&" : "?") + "${expectedQueryString}";`,
      ],
      excludes: [
        'URLEncoder.encode("users/admin:all ready", StandardCharsets.UTF_8.toString())',
      ],
    },
    {
      name: 'java/okhttp',
      generator: new OkHttpJavaRequestCodeGenerator(),
      includes: [
        `urlBuilder.addEncodedQueryParameter("redirect", "${
          expectedQueryString.split('=')[1]
        }");`,
      ],
      excludes: [
        'urlBuilder.addQueryParameter("redirect", "users/admin:all ready");',
      ],
    },
    {
      name: 'java/retrofit',
      generator: new RetrofitJavaRequestCodeGenerator(),
      includes: [
        '@Query(value = "redirect", encoded = true) String redirect',
        `"${expectedQueryString.split('=')[1]}"`,
      ],
      excludes: [
        '@Query("redirect") String redirect',
        '"users/admin:all ready"',
      ],
    },
    {
      name: 'java/unirest',
      generator: new UnirestJavaRequestCodeGenerator(),
      includes: [
        `String url = "${BASE_TEST_CONFIG.baseUrl}${BASE_TEST_CONFIG.path}";`,
      ],
      excludes: ['.queryString("redirect", "users/admin:all ready")'],
    },
    {
      name: 'kotlin/okhttp',
      generator: new OkHttpKotlinRequestCodeGenerator(),
      includes: [
        `url += (if (url.contains("?")) "&" else "?") + "${expectedQueryString}"`,
      ],
      excludes: [
        'URLEncoder.encode("users/admin:all ready", StandardCharsets.UTF_8.toString())',
      ],
    },
    {
      name: 'kotlin/retrofit',
      generator: new RetrofitKotlinRequestCodeGenerator(),
      includes: [
        '@Query(value = "redirect", encoded = true) redirect: String',
        `"${expectedQueryString.split('=')[1]}"`,
      ],
      excludes: [
        '@Query("redirect") redirect: String',
        '"users/admin:all ready"',
      ],
    },
    {
      name: 'csharp/httpclient',
      generator: new HttpClientCSharpRequestCodeGenerator(),
      includes: [
        `url += (url.Contains(\"?\") ? \"&\" : \"?\") + \"${expectedQueryString}\";`,
      ],
      excludes: ['Uri.EscapeDataString("users/admin:all ready")'],
    },
    {
      name: 'csharp/refit',
      generator: new RefitCsharpRequestCodeGenerator(),
      includes: [
        '[QueryUriFormat(UriFormat.Unescaped)]',
        '[Query("redirect")] string redirect',
        `"${expectedQueryString.split('=')[1]}"`,
      ],
      excludes: ['"users/admin:all ready"'],
    },
    {
      name: 'csharp/restsharp',
      generator: new RestsharpCsharpRequestCodeGenerator(),
      includes: [
        `request.AddQueryParameter("redirect", "${
          expectedQueryString.split('=')[1]
        }", false);`,
      ],
      excludes: [
        'request.AddQueryParameter("redirect", "users/admin:all ready");',
      ],
    },
    {
      name: 'dart/dio',
      generator: new DioDartRequestCodeGenerator(),
      includes: [
        `url += (url.contains('?') ? '&' : '?') + '${expectedQueryString}';`,
      ],
      excludes: ["Uri.encodeComponent('users/admin:all ready')"],
    },
    {
      name: 'dart/http',
      generator: new HttpDartRequestCodeGenerator(),
      includes: [
        `queryParts.add('redirect=users/admin:all%20ready');`,
        `final uri = baseUri.replace(query: queryParts.join('&'));`,
      ],
      excludes: [
        "Uri.encodeQueryComponent('users/admin:all ready')",
        "queryParts.add(Uri.encodeQueryComponent('redirect') + '=' + Uri.encodeQueryComponent('users/admin:all ready'));",
      ],
    },
    {
      name: 'php/curl',
      generator: new CurlPhpRequestCodeGenerator(),
      includes: [
        `$url .= (strpos($url, '?') !== false ? '&' : '?') . '${expectedQueryString}';`,
      ],
      excludes: ["urlencode('users/admin:all ready')"],
    },
    {
      name: 'php/guzzle',
      generator: new GuzzlePhpRequestCodeGenerator(),
      includes: [
        `$url .= (strpos($url, '?') !== false ? '&' : '?') . '${expectedQueryString}';`,
      ],
      excludes: ["urlencode('users/admin:all ready')"],
    },
    {
      name: 'ruby/faraday',
      generator: new FaradayRubyRequestCodeGenerator(),
      includes: [
        `request_url += (request_url.include?('?') ? '&' : '?') + '${expectedQueryString}'`,
      ],
      excludes: ["URI.encode_www_form_component('users/admin:all ready')"],
    },
    {
      name: 'ruby/httparty',
      generator: new HttpartyRubyRequestCodeGenerator(),
      includes: [
        `url += (url.include?('?') ? '&' : '?') + '${expectedQueryString}'`,
      ],
      excludes: ["URI.encode_www_form_component('users/admin:all ready')"],
    },
    {
      name: 'shell/curl',
      generator: new CurlShellRequestCodeGenerator(),
      includes: [
        `'https://api.example.com/api/v1/users?${expectedQueryString}'`,
      ],
      excludes: ['users%2Fadmin%3Aall+ready'],
    },
    {
      name: 'swift/urlsession',
      generator: new UrlsessionSwiftRequestCodeGenerator(),
      includes: [
        `urlString += (urlString.contains("?") ? "&" : "?") + "${expectedQueryString}"`,
      ],
      excludes: [
        '"users/admin:all ready".addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed.subtracting(CharacterSet(charactersIn: "&=?+")))!',
      ],
    },
    {
      name: 'swift/alamofire',
      generator: new AlamofireSwiftRequestCodeGenerator(),
      includes: [
        `url += (url.contains("?") ? "&" : "?") + "${expectedQueryString}"`,
      ],
      excludes: [
        '"users/admin:all ready".addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed.subtracting(CharacterSet(charactersIn: "&=?+")))!',
      ],
    },
    {
      name: 'cpp/cpp-httplib',
      generator: new CppHttplibCppRequestCodeGenerator(),
      includes: [
        `path += (path.find('?') != std::string::npos ? "&" : "?") + "${expectedQueryString}";`,
      ],
      excludes: ['urlEncode("users/admin:all ready")'],
    },
    {
      name: 'cpp/boost-beast',
      generator: new BoostBeastCppRequestCodeGenerator(),
      includes: [
        `target += (target.find('?') != std::string::npos ? "&" : "?") + "${expectedQueryString}";`,
      ],
      excludes: [
        'http::request<http::string_body> req{http::verb::get, "/api/v1/users", 11};',
      ],
    },
    {
      name: 'cpp/cpprest',
      generator: new CpprestCppRequestCodeGenerator(),
      includes: [
        `auto requestUri = U("${BASE_TEST_CONFIG.path}?${expectedQueryString}");`,
        'request.set_request_uri(requestUri);',
      ],
      excludes: [
        'builder.append_query(U("redirect"), U("users/admin:all ready"));',
      ],
    },
  ];

  test.each(cases)(
    '$name preserves reserved query characters when allowReserved is true',
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
