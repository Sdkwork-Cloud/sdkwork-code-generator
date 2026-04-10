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

type BinaryCase = {
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

const BINARY_FILE = 'example-file.bin';

describe('application/octet-stream request body support', () => {
  const context: CodeGenerateContext = {
    ...BASE_TEST_CONFIG.context,
    requestContentType: 'application/octet-stream',
  };

  const cases: BinaryCase[] = [
    {
      name: 'javascript/axios',
      generator: new AxiosJavaScriptRequestCodeGenerator(),
      includes: [
        "'Content-Type': 'application/octet-stream'",
        `readFile('${BINARY_FILE}')`,
        'data: requestBody',
      ],
      excludes: [`data: '${BINARY_FILE}'`, 'JSON.stringify('],
    },
    {
      name: 'javascript/fetch',
      generator: new FetchJavaScriptRequestCodeGenerator(),
      includes: [
        "'Content-Type': 'application/octet-stream'",
        `readFile('${BINARY_FILE}')`,
        'body: requestBody',
      ],
      excludes: [`body: '${BINARY_FILE}'`, 'JSON.stringify('],
    },
    {
      name: 'javascript/got',
      generator: new GotJavaScriptRequestCodeGenerator(),
      includes: [
        "'Content-Type': 'application/octet-stream'",
        `readFile('${BINARY_FILE}')`,
        'body: requestBody',
      ],
      excludes: [`body: '${BINARY_FILE}'`, 'json:'],
    },
    {
      name: 'javascript/superagent',
      generator: new SuperagentJavaScriptRequestCodeGenerator(),
      includes: [
        "request.set('Content-Type', 'application/octet-stream');",
        `readFile('${BINARY_FILE}')`,
        'request.send(requestBody);',
      ],
      excludes: [`request.send('${BINARY_FILE}')`, 'request.send({'],
    },
    {
      name: 'typescript/axios',
      generator: new AxiosTypeScriptRequestCodeGenerator(),
      includes: [
        "'Content-Type': 'application/octet-stream'",
        `readFile('${BINARY_FILE}')`,
        'data: requestBody',
      ],
      excludes: [`data: '${BINARY_FILE}'`, 'JSON.stringify('],
    },
    {
      name: 'typescript/fetch',
      generator: new FetchTypeScriptRequestCodeGenerator(),
      includes: [
        "'Content-Type': 'application/octet-stream'",
        `readFile('${BINARY_FILE}')`,
        'body: requestBody',
      ],
      excludes: [`body: '${BINARY_FILE}'`, 'JSON.stringify('],
    },
    {
      name: 'typescript/got',
      generator: new GotTypeScriptRequestCodeGenerator(),
      includes: [
        "'Content-Type': 'application/octet-stream'",
        `readFile('${BINARY_FILE}')`,
        'body: requestBody',
      ],
      excludes: [`body: '${BINARY_FILE}'`, 'json:'],
    },
    {
      name: 'typescript/superagent',
      generator: new SuperagentTypeScriptRequestCodeGenerator(),
      includes: [
        "request.set('Content-Type', 'application/octet-stream');",
        `readFile('${BINARY_FILE}')`,
        'request.send(requestBody);',
      ],
      excludes: [`request.send('${BINARY_FILE}')`, 'request.send({'],
    },
    {
      name: 'python/requests',
      generator: new RequestsPythonRequestCodeGenerator(),
      includes: [
        "headers={'Content-Type': 'application/octet-stream'}",
        `open('${BINARY_FILE}', 'rb')`,
        'data=requestBody',
      ],
      excludes: [`data='${BINARY_FILE}'`, 'json='],
    },
    {
      name: 'python/aiohttp',
      generator: new AiohttpPythonRequestCodeGenerator(),
      includes: [
        "'Content-Type': 'application/octet-stream'",
        `open('${BINARY_FILE}', 'rb')`,
        'data = requestBody.read()',
        'data=data',
      ],
      excludes: [`data = '${BINARY_FILE}'`, 'json.dumps('],
    },
    {
      name: 'python/httpx',
      generator: new HttpxPythonRequestCodeGenerator(),
      includes: [
        "'Content-Type': 'application/octet-stream'",
        `open('${BINARY_FILE}', 'rb')`,
        'data = requestBody.read()',
        'content=data',
      ],
      excludes: [`data = '${BINARY_FILE}'`, 'json=data'],
    },
    {
      name: 'go/net-http',
      generator: new NetHttpGoRequestCodeGenerator(),
      includes: [
        'req.Header.Set("Content-Type", "application/octet-stream")',
        `os.ReadFile("${BINARY_FILE}")`,
        'bytes.NewReader(requestBody)',
      ],
      excludes: [`strings.NewReader("${BINARY_FILE}")`, 'json.Marshal'],
    },
    {
      name: 'go/fasthttp',
      generator: new FasthttpGoRequestCodeGenerator(),
      includes: [
        'req.Header.Set("Content-Type", "application/octet-stream")',
        `os.ReadFile("${BINARY_FILE}")`,
        'req.SetBodyRaw(requestBody)',
      ],
      excludes: [`req.SetBodyString("${BINARY_FILE}")`, 'json.Marshal'],
    },
    {
      name: 'go/resty',
      generator: new RestyGoRequestCodeGenerator(),
      includes: [
        'req.SetHeader("Content-Type", "application/octet-stream")',
        `os.ReadFile("${BINARY_FILE}")`,
        'req.SetBody(requestBody)',
      ],
      excludes: [`req.SetBody("${BINARY_FILE}")`, 'SetBody({'],
    },
    {
      name: 'shell/curl',
      generator: new CurlShellRequestCodeGenerator(),
      includes: [
        'Content-Type: application/octet-stream',
        `--data-binary '@${BINARY_FILE}'`,
      ],
      excludes: [`--data-raw '${BINARY_FILE}'`, 'application/json'],
    },
    {
      name: 'rust/reqwest',
      generator: new ReqwestRustRequestCodeGenerator(),
      includes: [
        '"content-type"',
        `std::fs::read("${BINARY_FILE}")`,
        '.body(requestBody)',
      ],
      excludes: [`.body("${BINARY_FILE}")`, 'serde_json::json!'],
    },
    {
      name: 'cpp/cpprest',
      generator: new CpprestCppRequestCodeGenerator(),
      includes: [
        'request.headers().add(U("Content-Type"), U("application/octet-stream"));',
        `readBinaryFile("${BINARY_FILE}")`,
        'request.set_body(requestBody, "application/octet-stream");',
      ],
      excludes: [
        `request.set_body("${BINARY_FILE}", "application/octet-stream");`,
        'json::value::parse',
      ],
    },
    {
      name: 'cpp/cpp-httplib',
      generator: new CppHttplibCppRequestCodeGenerator(),
      includes: [
        '{"Content-Type", "application/octet-stream"}',
        `readBinaryFile("${BINARY_FILE}")`,
        'request_body, "application/octet-stream"',
      ],
      excludes: [
        `std::string request_body = "${BINARY_FILE}";`,
        'json request_body =',
      ],
    },
    {
      name: 'cpp/boost-beast',
      generator: new BoostBeastCppRequestCodeGenerator(),
      includes: [
        'req.set(http::field::content_type, "application/octet-stream");',
        `readBinaryFile("${BINARY_FILE}")`,
        'req.body() = requestBody;',
      ],
      excludes: [`req.body() = "${BINARY_FILE}";`, 'json request_body ='],
    },
    {
      name: 'csharp/httpclient',
      generator: new HttpClientCSharpRequestCodeGenerator(),
      includes: [
        `File.ReadAllBytes("${BINARY_FILE}")`,
        'new ByteArrayContent(requestBody);',
      ],
      excludes: [
        `new StringContent("${BINARY_FILE}"`,
        'JsonSerializer.Serialize',
      ],
    },
    {
      name: 'csharp/restsharp',
      generator: new RestsharpCsharpRequestCodeGenerator(),
      includes: [
        'AddHeader("Content-Type", "application/octet-stream");',
        `File.ReadAllBytes("${BINARY_FILE}")`,
        'AddParameter("application/octet-stream", requestBody, ParameterType.RequestBody);',
      ],
      excludes: [`AddStringBody("${BINARY_FILE}"`, 'AddJsonBody'],
    },
    {
      name: 'csharp/refit',
      generator: new RefitCsharpRequestCodeGenerator(),
      includes: [
        '[Headers("Content-Type: application/octet-stream")]',
        '[Body] byte[] body',
        `File.ReadAllBytes("${BINARY_FILE}")`,
      ],
      excludes: ['[Body] string body', 'JsonConvert.DeserializeObject<object>'],
    },
    {
      name: 'java/okhttp',
      generator: new OkHttpJavaRequestCodeGenerator(),
      includes: [
        'MediaType.parse("application/octet-stream")',
        `Files.readAllBytes(Paths.get("${BINARY_FILE}"))`,
      ],
      excludes: [
        `RequestBody.create(MediaType.parse("application/octet-stream"), "${BINARY_FILE}")`,
        'application/json',
      ],
    },
    {
      name: 'java/apache-httpclient',
      generator: new ApacheHttpClientJavaRequestCodeGenerator(),
      includes: [
        'setHeader("Content-Type", "application/octet-stream")',
        `new FileEntity(new File("${BINARY_FILE}"), ContentType.APPLICATION_OCTET_STREAM)`,
      ],
      excludes: [
        `String requestBody = "${BINARY_FILE}";`,
        'writeValueAsString',
      ],
    },
    {
      name: 'java/unirest',
      generator: new UnirestJavaRequestCodeGenerator(),
      includes: [
        '.header("Content-Type", "application/octet-stream")',
        `Files.readAllBytes(Paths.get("${BINARY_FILE}"))`,
        '.body(requestBody)',
      ],
      excludes: [`.body("${BINARY_FILE}")`, 'application/json'],
    },
    {
      name: 'java/retrofit',
      generator: new RetrofitJavaRequestCodeGenerator(),
      includes: [
        '@Headers("Content-Type: application/octet-stream")',
        `Files.readAllBytes(Paths.get("${BINARY_FILE}"))`,
        'RequestBody.create(MediaType.parse("application/octet-stream"), requestBody)',
      ],
      excludes: [
        `RequestBody.create(MediaType.parse("application/octet-stream"), "${BINARY_FILE}")`,
        'new Gson().toJsonTree',
      ],
    },
    {
      name: 'kotlin/okhttp',
      generator: new OkHttpKotlinRequestCodeGenerator(),
      includes: [
        'MediaType.parse("application/octet-stream")',
        `File("${BINARY_FILE}").readBytes()`,
      ],
      excludes: [
        `RequestBody.create(MediaType.parse("application/octet-stream"), "${BINARY_FILE}")`,
        'application/json',
      ],
    },
    {
      name: 'kotlin/retrofit',
      generator: new RetrofitKotlinRequestCodeGenerator(),
      includes: [
        '@Headers("Content-Type: application/octet-stream")',
        `File("${BINARY_FILE}").readBytes()`,
        'RequestBody.create(MediaType.parse("application/octet-stream"), requestBody)',
      ],
      excludes: [
        `RequestBody.create(MediaType.parse("application/octet-stream"), "${BINARY_FILE}")`,
        'Gson().toJsonTree',
      ],
    },
    {
      name: 'php/curl',
      generator: new CurlPhpRequestCodeGenerator(),
      includes: [
        'Content-Type: application/octet-stream',
        `file_get_contents('${BINARY_FILE}')`,
        'CURLOPT_POSTFIELDS, $requestBody',
      ],
      excludes: [`CURLOPT_POSTFIELDS, '${BINARY_FILE}'`, 'json_encode'],
    },
    {
      name: 'php/guzzle',
      generator: new GuzzlePhpRequestCodeGenerator(),
      includes: [
        "'Content-Type' => 'application/octet-stream'",
        `fopen('${BINARY_FILE}', 'rb')`,
        "'body' => $requestBody",
      ],
      excludes: [`'body' => '${BINARY_FILE}'`, "'json' =>"],
    },
    {
      name: 'ruby/faraday',
      generator: new FaradayRubyRequestCodeGenerator(),
      includes: [
        "req.headers['Content-Type'] = 'application/octet-stream'",
        `File.binread('${BINARY_FILE}')`,
        'req.body = requestBody',
      ],
      excludes: [`req.body = '${BINARY_FILE}'`, '.to_json'],
    },
    {
      name: 'ruby/httparty',
      generator: new HttpartyRubyRequestCodeGenerator(),
      includes: [
        "'Content-Type' => 'application/octet-stream'",
        `File.binread('${BINARY_FILE}')`,
        'body: requestBody,',
      ],
      excludes: [`body: '${BINARY_FILE}',`, '.to_json'],
    },
    {
      name: 'swift/alamofire',
      generator: new AlamofireSwiftRequestCodeGenerator(),
      includes: [
        '"Content-Type": "application/octet-stream"',
        `Data(contentsOf: URL(fileURLWithPath: "${BINARY_FILE}"))`,
        'AF.upload(requestBody',
      ],
      excludes: [`"${BINARY_FILE}".data(using: .utf8)!`, 'application/json'],
    },
    {
      name: 'swift/urlsession',
      generator: new UrlsessionSwiftRequestCodeGenerator(),
      includes: [
        'setValue("application/octet-stream", forHTTPHeaderField: "Content-Type")',
        `Data(contentsOf: URL(fileURLWithPath: "${BINARY_FILE}"))`,
        'request.httpBody = requestBody',
      ],
      excludes: [
        `"${BINARY_FILE}".data(using: .utf8)`,
        'JSONSerialization.data',
      ],
    },
    {
      name: 'dart/http',
      generator: new HttpDartRequestCodeGenerator(),
      includes: [
        '"Content-Type": "application/octet-stream"',
        `File('${BINARY_FILE}').readAsBytes()`,
        'body: body',
      ],
      excludes: [`final body = '${BINARY_FILE}';`, 'jsonEncode'],
    },
    {
      name: 'dart/dio',
      generator: new DioDartRequestCodeGenerator(),
      includes: [
        "'Content-Type': 'application/octet-stream'",
        `File('${BINARY_FILE}').readAsBytes()`,
        'data: requestBody',
      ],
      excludes: [
        `final requestBody = '${BINARY_FILE}';`,
        'final requestBody = {',
      ],
    },
  ];

  for (const testCase of cases) {
    test(`generates binary request bodies for ${testCase.name}`, () => {
      const code = testCase.generator.generateCode(
        BASE_TEST_CONFIG.path,
        'POST',
        BASE_TEST_CONFIG.baseUrl,
        POST_TEST_OPERATION,
        [],
        [],
        [],
        BINARY_FILE,
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
