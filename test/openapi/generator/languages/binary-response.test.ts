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
import { CppHttplibCppRequestCodeGenerator } from '../../../../src/openapi/generator/languages/cpp/cpp-httplib';
import { BoostBeastCppRequestCodeGenerator } from '../../../../src/openapi/generator/languages/cpp/boost-beast';
import { CpprestCppRequestCodeGenerator } from '../../../../src/openapi/generator/languages/cpp/cpprest';
import { HttpClientCSharpRequestCodeGenerator } from '../../../../src/openapi/generator/languages/csharp/httpclient';
import { RestsharpCsharpRequestCodeGenerator } from '../../../../src/openapi/generator/languages/csharp/restsharp';
import { RefitCsharpRequestCodeGenerator } from '../../../../src/openapi/generator/languages/csharp/refit';
import { ApacheHttpClientJavaRequestCodeGenerator } from '../../../../src/openapi/generator/languages/java/apache_httpclient';
import { CurlPhpRequestCodeGenerator } from '../../../../src/openapi/generator/languages/php/curl';
import { GuzzlePhpRequestCodeGenerator } from '../../../../src/openapi/generator/languages/php/guzzle';
import { FaradayRubyRequestCodeGenerator } from '../../../../src/openapi/generator/languages/ruby/faraday';
import { HttpartyRubyRequestCodeGenerator } from '../../../../src/openapi/generator/languages/ruby/httparty';
import { OkHttpJavaRequestCodeGenerator } from '../../../../src/openapi/generator/languages/java/okhttp';
import { UnirestJavaRequestCodeGenerator } from '../../../../src/openapi/generator/languages/java/unirest';
import { RetrofitJavaRequestCodeGenerator } from '../../../../src/openapi/generator/languages/java/retrofit';
import { OkHttpKotlinRequestCodeGenerator } from '../../../../src/openapi/generator/languages/kotlin/okhttp';
import { RetrofitKotlinRequestCodeGenerator } from '../../../../src/openapi/generator/languages/kotlin/retrofit';
import { AlamofireSwiftRequestCodeGenerator } from '../../../../src/openapi/generator/languages/swift/alamofire';
import { UrlsessionSwiftRequestCodeGenerator } from '../../../../src/openapi/generator/languages/swift/urlsession';
import { ReqwestRustRequestCodeGenerator } from '../../../../src/openapi/generator/languages/rust/reqwest';
import { HttpDartRequestCodeGenerator } from '../../../../src/openapi/generator/languages/dart/http';
import { DioDartRequestCodeGenerator } from '../../../../src/openapi/generator/languages/dart/dio';
import { CurlShellRequestCodeGenerator } from '../../../../src/openapi/generator/languages/shell/curl';
import {
  CodeGenerateContext,
  ExampleOpenAPIParameter,
  HttpMethod,
  OpenAPIOperation,
} from '../../../../src/types';
import { BASE_TEST_CONFIG } from './test-data';

type BinaryResponseCase = {
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

const BINARY_RESPONSE_OPERATION: OpenAPIOperation = {
  operationId: 'downloadUserArchive',
  summary: 'Download user archive',
  description: 'Downloads a binary archive for the requested user',
  responses: {
    '200': {
      description: 'Binary archive',
      content: {
        'application/octet-stream': {
          schema: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  },
};

describe('application/octet-stream response support', () => {
  const context: CodeGenerateContext = {
    ...BASE_TEST_CONFIG.context,
    responseStatusCode: '200',
    responseContentType: 'application/octet-stream',
    responseBodySchema: {
      type: 'string',
      format: 'binary',
    },
  };

  const cases: BinaryResponseCase[] = [
    {
      name: 'javascript/axios',
      generator: new AxiosJavaScriptRequestCodeGenerator(),
      includes: ["responseType: 'arraybuffer'"],
      excludes: ["console.log('Response:', response.data);"],
    },
    {
      name: 'javascript/fetch',
      generator: new FetchJavaScriptRequestCodeGenerator(),
      includes: ['const data = await response.arrayBuffer();'],
      excludes: ['await response.json()', 'await response.text()'],
    },
    {
      name: 'javascript/got',
      generator: new GotJavaScriptRequestCodeGenerator(),
      includes: ["responseType: 'buffer',", 'const data = response.body;'],
      excludes: ['JSON.parse(response.body)'],
    },
    {
      name: 'javascript/superagent',
      generator: new SuperagentJavaScriptRequestCodeGenerator(),
      includes: [
        'const binaryParser = (res, callback) => {',
        'request = request.buffer(true).parse(binaryParser);',
        'console.log("Response bytes:", data.length);',
      ],
      excludes: ["console.log('Response:', data);"],
    },
    {
      name: 'typescript/axios',
      generator: new AxiosTypeScriptRequestCodeGenerator(),
      includes: ["responseType: 'arraybuffer'"],
      excludes: ["console.log('Response:', response.data);"],
    },
    {
      name: 'typescript/fetch',
      generator: new FetchTypeScriptRequestCodeGenerator(),
      includes: ['const data = await response.arrayBuffer();'],
      excludes: ['await response.json()', 'await response.text()'],
    },
    {
      name: 'typescript/got',
      generator: new GotTypeScriptRequestCodeGenerator(),
      includes: [
        "responseType: 'buffer' as const,",
        'const data = response.body;',
      ],
      excludes: ['JSON.parse(response.body)'],
    },
    {
      name: 'typescript/superagent',
      generator: new SuperagentTypeScriptRequestCodeGenerator(),
      includes: [
        'const binaryParser = (',
        'request = request.buffer(true).parse(binaryParser);',
        "console.log('Response bytes:', data.length);",
      ],
      excludes: ["console.log('Response:', data);"],
    },
    {
      name: 'python/requests',
      generator: new RequestsPythonRequestCodeGenerator(),
      includes: ['data = response.content', 'return data'],
      excludes: ['return response.json()', 'data = response.text'],
    },
    {
      name: 'python/aiohttp',
      generator: new AiohttpPythonRequestCodeGenerator(),
      includes: ['data = await response.read()'],
      excludes: [
        'data = await response.json()',
        'data = await response.text()',
      ],
    },
    {
      name: 'python/httpx',
      generator: new HttpxPythonRequestCodeGenerator(),
      includes: ['data = response.content', 'return data'],
      excludes: ['data = response.json()', 'data = response.text'],
    },
    {
      name: 'go/net_http',
      generator: new NetHttpGoRequestCodeGenerator(),
      includes: [
        'func downloadUserArchive() ([]byte, error) {',
        'fmt.Printf("Response bytes: %d\\n", len(body))',
        'return body, nil',
      ],
      excludes: ['fmt.Printf("Response: %s\\n", string(body))'],
    },
    {
      name: 'go/fasthttp',
      generator: new FasthttpGoRequestCodeGenerator(),
      includes: [
        'func downloadUserArchive() ([]byte, error) {',
        'data := append([]byte(nil), resp.Body()...)',
        'return data, nil',
      ],
      excludes: ['json.Unmarshal(resp.Body(), &data)'],
    },
    {
      name: 'go/resty',
      generator: new RestyGoRequestCodeGenerator(),
      includes: [
        'func downloadUserArchive() ([]byte, error) {',
        'data := append([]byte(nil), resp.Body()...)',
        'return data, nil',
      ],
      excludes: ['json.Unmarshal(resp.Body(), &data)'],
    },
    {
      name: 'cpp/cpp-httplib',
      generator: new CppHttplibCppRequestCodeGenerator(),
      includes: [
        'std::string data = response->body;',
        'std::cout << "Response bytes: " << data.size() << std::endl;',
      ],
      excludes: ['json::parse(response->body)'],
    },
    {
      name: 'cpp/boost-beast',
      generator: new BoostBeastCppRequestCodeGenerator(),
      includes: [
        'std::string data = response_body;',
        'std::cout << "Response bytes: " << data.size() << std::endl;',
      ],
      excludes: ['json::parse(response_body)'],
    },
    {
      name: 'cpp/cpprest',
      generator: new CpprestCppRequestCodeGenerator(),
      includes: [
        '#include <vector>',
        'return response.extract_vector();',
        '}).then([](std::vector<unsigned char> body) {',
        'std::cout << "Response bytes: " << body.size() << std::endl;',
      ],
      excludes: ['return response.extract_string();'],
    },
    {
      name: 'csharp/httpclient',
      generator: new HttpClientCSharpRequestCodeGenerator(),
      includes: [
        'public static async Task<byte[]> downloadUserArchiveAsync()',
        'var responseBody = await response.Content.ReadAsByteArrayAsync();',
        'Console.WriteLine($"Response bytes: {responseBody.Length}");',
        'return responseBody;',
      ],
      excludes: [
        'var responseBody = await response.Content.ReadAsStringAsync();',
      ],
    },
    {
      name: 'csharp/restsharp',
      generator: new RestsharpCsharpRequestCodeGenerator(),
      includes: [
        'static byte[] downloadUserArchive()',
        'var data = response.RawBytes ?? Array.Empty<byte>();',
        'Console.WriteLine("Response bytes: " + data.Length);',
        'return data;',
      ],
      excludes: ['JsonConvert.DeserializeObject<object>(response.Content)'],
    },
    {
      name: 'csharp/refit',
      generator: new RefitCsharpRequestCodeGenerator(),
      includes: [
        'Task<HttpResponseMessage> downloadUserArchiveAsync(',
        'var result = await response.Content.ReadAsByteArrayAsync();',
        'Console.WriteLine("Response bytes: " + result.Length);',
      ],
      excludes: ['Task<ApiResponse<object>> downloadUserArchiveAsync('],
    },
    {
      name: 'java/apache-httpclient',
      generator: new ApacheHttpClientJavaRequestCodeGenerator(),
      includes: [
        'byte[] responseBody = EntityUtils.toByteArray(entity);',
        'System.out.println("Response bytes: " + responseBody.length);',
        'private byte[] data;',
      ],
      excludes: [
        'objectMapper.readValue(responseBody, Object.class)',
        'private Object data;',
      ],
    },
    {
      name: 'php/curl',
      generator: new CurlPhpRequestCodeGenerator(),
      includes: [
        '$data = $response;',
        "echo 'Response bytes: ' . strlen($data) . PHP_EOL;",
        'return $data;',
      ],
      excludes: ['json_decode($response, true)'],
    },
    {
      name: 'php/guzzle',
      generator: new GuzzlePhpRequestCodeGenerator(),
      includes: [
        '$data = $response->getBody()->getContents();',
        'echo "Response bytes: " . strlen($data) . "\\n";',
        'return $data;',
      ],
      excludes: ['json_decode($response->getBody(), true)'],
    },
    {
      name: 'ruby/faraday',
      generator: new FaradayRubyRequestCodeGenerator(),
      includes: [
        'data = response.body.dup.force_encoding(Encoding::BINARY)',
        'puts "Response bytes: #{data.bytesize}"',
      ],
      excludes: ['puts "Response: #{response.body}"'],
    },
    {
      name: 'ruby/httparty',
      generator: new HttpartyRubyRequestCodeGenerator(),
      includes: [
        'data = response.body.dup.force_encoding(Encoding::BINARY)',
        'puts "Response bytes: #{data.bytesize}"',
      ],
      excludes: ['JSON.parse(response.body)'],
    },
    {
      name: 'java/okhttp',
      generator: new OkHttpJavaRequestCodeGenerator(),
      includes: [
        'byte[] data = response.body().bytes();',
        'System.out.println("Response bytes: " + data.length);',
      ],
      excludes: ['response.body().string()'],
    },
    {
      name: 'java/unirest',
      generator: new UnirestJavaRequestCodeGenerator(),
      includes: [
        'HttpResponse<byte[]> response',
        '.asBytes();',
        'byte[] data = response.getBody();',
        'System.out.println("Response bytes: " + data.length);',
      ],
      excludes: ['.asJson();'],
    },
    {
      name: 'java/retrofit',
      generator: new RetrofitJavaRequestCodeGenerator(),
      includes: [
        'import okhttp3.ResponseBody;',
        'Call<ResponseBody> downloadUserArchive(',
        'retrofit2.Response<ResponseBody> response = call.execute();',
        'byte[] responseBytes = data != null ? data.bytes() : new byte[0];',
        'System.out.println("Response bytes: " + responseBytes.length);',
      ],
      excludes: ['Call<Object> downloadUserArchive('],
    },
    {
      name: 'kotlin/okhttp',
      generator: new OkHttpKotlinRequestCodeGenerator(),
      includes: [
        'val data = response.body?.bytes() ?: ByteArray(0)',
        'println("Response bytes: ${data.size}")',
      ],
      excludes: ['println("Response: ${response.body?.string()}")'],
    },
    {
      name: 'kotlin/retrofit',
      generator: new RetrofitKotlinRequestCodeGenerator(),
      includes: [
        'import okhttp3.ResponseBody',
        '): Call<ResponseBody>',
        'val responseBytes = data?.bytes() ?: ByteArray(0)',
        'println("Response bytes: ${responseBytes.size}")',
      ],
      excludes: ['): Call<Any>'],
    },
    {
      name: 'swift/alamofire',
      generator: new AlamofireSwiftRequestCodeGenerator(),
      includes: [
        '.responseData { response in',
        'case .success(let value):',
        'print("Success bytes: \\(value.count)")',
      ],
      excludes: ['.responseString { response in'],
    },
    {
      name: 'swift/urlsession',
      generator: new UrlsessionSwiftRequestCodeGenerator(),
      includes: [
        'let responseData = data',
        'print("Response bytes: \\(responseData.count)")',
      ],
      excludes: ['JSONSerialization.jsonObject(with: data)'],
    },
    {
      name: 'rust/reqwest',
      generator: new ReqwestRustRequestCodeGenerator(),
      includes: [
        'let body = response.bytes().await?;',
        'println!("Body bytes: {}", body.len());',
      ],
      excludes: ['let body = response.text().await?;'],
    },
    {
      name: 'dart/http',
      generator: new HttpDartRequestCodeGenerator(),
      includes: [
        'final responseBody = response.bodyBytes;',
        "print('Response bytes: ${responseBody.length}');",
      ],
      excludes: ["print('Response: ${response.body}');"],
    },
    {
      name: 'dart/dio',
      generator: new DioDartRequestCodeGenerator(),
      includes: [
        'responseType: ResponseType.bytes,',
        'final data = response.data as List<int>;',
        "print('Response bytes: ${data.length}');",
      ],
      excludes: ["print('Response: $data');"],
    },
    {
      name: 'shell/curl',
      generator: new CurlShellRequestCodeGenerator(),
      includes: [
        'output_file="./downloadUserArchive.bin"',
        '  --output "$output_file" \\',
        'echo "Saved binary response to $output_file"',
        'echo "Response bytes: $(wc -c < "$output_file")"',
      ],
      excludes: ['response_file=$(mktemp)', 'cat "$response_file"'],
    },
  ];

  for (const testCase of cases) {
    test(`generates binary response handling for ${testCase.name}`, () => {
      const code = testCase.generator.generateCode(
        BASE_TEST_CONFIG.path,
        'GET',
        BASE_TEST_CONFIG.baseUrl,
        BINARY_RESPONSE_OPERATION,
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
