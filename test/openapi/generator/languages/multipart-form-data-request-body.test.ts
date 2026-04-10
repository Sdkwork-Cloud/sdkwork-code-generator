import { CodeGeneratorFactory } from '../../../../src/openapi/generator/factory';
import {
  ApiRequestDefinition,
  CodeGenerateContext,
  Language,
  OpenAPIOperation,
} from '../../../../src/types';
import { BASE_TEST_CONFIG } from './test-data';

type MultipartCase = {
  name: string;
  language: Language;
  library: string;
  includes: string[];
};

const MULTIPART_OPERATION: OpenAPIOperation = {
  operationId: 'uploadAvatar',
  summary: 'Upload a user avatar',
  description: 'Upload a multipart form with text and file fields',
  requestBody: {
    required: true,
    content: {
      'multipart/form-data': {
        schema: {
          type: 'object',
          example: {
            name: 'John Doe',
            avatar: 'avatar.png',
          },
          properties: {
            name: {
              type: 'string',
            },
            avatar: {
              type: 'string',
              format: 'binary',
            },
          },
          required: ['name', 'avatar'],
        },
        encoding: {
          avatar: {
            contentType: 'image/png',
          },
        },
      },
    },
  },
  responses: {
    '200': {
      description: 'Upload completed',
    },
  },
};

const MULTIPART_REQUEST_DEFINITION: ApiRequestDefinition = {
  path: '/api/v1/users/avatar',
  method: 'POST',
  operation: MULTIPART_OPERATION,
  pathItem: {},
};

describe('multipart/form-data request body support', () => {
  const cases: MultipartCase[] = [
    {
      name: 'javascript/axios',
      language: 'javascript',
      library: 'axios',
      includes: [
        'const formData = new FormData();',
        "formData.append('name', 'John Doe');",
        "formData.append('avatar', new Blob(['example file contents']), 'avatar.png');",
        'data: formData',
      ],
    },
    {
      name: 'javascript/fetch',
      language: 'javascript',
      library: 'fetch',
      includes: [
        'const formData = new FormData();',
        "formData.append('name', 'John Doe');",
        "formData.append('avatar', new Blob(['example file contents']), 'avatar.png');",
        'body: formData',
      ],
    },
    {
      name: 'javascript/got',
      language: 'javascript',
      library: 'got',
      includes: [
        'const formData = new FormData();',
        "formData.append('name', 'John Doe');",
        "formData.append('avatar', new Blob(['example file contents']), 'avatar.png');",
        'body: formData',
      ],
    },
    {
      name: 'javascript/superagent',
      language: 'javascript',
      library: 'superagent',
      includes: [
        "request.field('name', 'John Doe');",
        "request.attach('avatar', 'avatar.png');",
      ],
    },
    {
      name: 'typescript/axios',
      language: 'typescript',
      library: 'axios',
      includes: [
        'const formData = new FormData();',
        "formData.append('name', 'John Doe');",
        "formData.append('avatar', new Blob(['example file contents']), 'avatar.png');",
        'data: formData',
      ],
    },
    {
      name: 'typescript/fetch',
      language: 'typescript',
      library: 'fetch',
      includes: [
        'const formData = new FormData();',
        "formData.append('name', 'John Doe');",
        "formData.append('avatar', new Blob(['example file contents']), 'avatar.png');",
        'body: formData',
      ],
    },
    {
      name: 'typescript/got',
      language: 'typescript',
      library: 'got',
      includes: [
        'const formData = new FormData();',
        "formData.append('name', 'John Doe');",
        "formData.append('avatar', new Blob(['example file contents']), 'avatar.png');",
        'body: formData',
      ],
    },
    {
      name: 'typescript/superagent',
      language: 'typescript',
      library: 'superagent',
      includes: [
        "request.field('name', 'John Doe');",
        "request.attach('avatar', 'avatar.png');",
      ],
    },
    {
      name: 'python/requests',
      language: 'python',
      library: 'requests',
      includes: [
        "data = {'name': 'John Doe'}",
        "files = {'avatar': ('avatar.png', open('avatar.png', 'rb'), 'image/png')}",
        'data=data',
        'files=files',
      ],
    },
    {
      name: 'python/aiohttp',
      language: 'python',
      library: 'aiohttp',
      includes: [
        'data = aiohttp.FormData()',
        "data.add_field('name', 'John Doe')",
        "data.add_field('avatar', open('avatar.png', 'rb'), filename='avatar.png', content_type='image/png')",
        'data=data',
      ],
    },
    {
      name: 'python/httpx',
      language: 'python',
      library: 'httpx',
      includes: [
        "data = {'name': 'John Doe'}",
        "files = {'avatar': ('avatar.png', open('avatar.png', 'rb'), 'image/png')}",
        'data=data',
        'files=files',
      ],
    },
    {
      name: 'go/net-http',
      language: 'go',
      library: 'net/http',
      includes: [
        'writer := multipart.NewWriter(&body)',
        'writer.WriteField("name", "John Doe")',
        'writer.CreateFormFile("avatar", "avatar.png")',
        'req.Header.Set("Content-Type", writer.FormDataContentType())',
      ],
    },
    {
      name: 'go/fasthttp',
      language: 'go',
      library: 'fasthttp',
      includes: [
        'writer := multipart.NewWriter(&body)',
        'writer.WriteField("name", "John Doe")',
        'writer.CreateFormFile("avatar", "avatar.png")',
        'req.Header.SetContentType(writer.FormDataContentType())',
      ],
    },
    {
      name: 'go/resty',
      language: 'go',
      library: 'resty',
      includes: [
        'req.SetFormData(map[string]string{',
        '"name": "John Doe"',
        'req.SetFileReader("avatar", "avatar.png", strings.NewReader("example file contents"))',
      ],
    },
    {
      name: 'shell/curl',
      language: 'shell',
      library: 'curl',
      includes: ["-F 'name=John Doe'", "-F 'avatar=@avatar.png;type=image/png'"],
    },
    {
      name: 'rust/reqwest',
      language: 'rust',
      library: 'reqwest',
      includes: [
        'let form = reqwest::multipart::Form::new()',
        '.text("name", "John Doe")',
        '.part("avatar",',
        '.file_name("avatar.png")',
        '.mime_str("image/png")?',
        '.multipart(form)',
      ],
    },
    {
      name: 'cpp/cpprest',
      language: 'cpp',
      library: 'cpprest',
      includes: [
        'const std::string boundary = "----SDKWorkFormBoundary";',
        'multipart/form-data; boundary=----SDKWorkFormBoundary',
        'name="name"',
        'filename="avatar.png"',
      ],
    },
    {
      name: 'cpp/cpp-httplib',
      language: 'cpp',
      library: 'cpp-httplib',
      includes: [
        'const std::string boundary = "----SDKWorkFormBoundary";',
        'multipart/form-data; boundary=----SDKWorkFormBoundary',
        'filename="avatar.png"',
      ],
    },
    {
      name: 'cpp/boost-beast',
      language: 'cpp',
      library: 'boost-beast',
      includes: [
        'const std::string boundary = "----SDKWorkFormBoundary";',
        'multipart/form-data; boundary=----SDKWorkFormBoundary',
        'filename="avatar.png"',
      ],
    },
    {
      name: 'csharp/httpclient',
      language: 'csharp',
      library: 'httpclient',
      includes: [
        'var formData = new MultipartFormDataContent();',
        'formData.Add(new StringContent("John Doe"), "name");',
        'formData.Add(fileContent, "avatar", "avatar.png");',
      ],
    },
    {
      name: 'csharp/restsharp',
      language: 'csharp',
      library: 'restsharp',
      includes: [
        'request.AlwaysMultipartFormData = true;',
        'request.AddParameter("name", "John Doe");',
        'request.AddFile("avatar", "avatar.png");',
      ],
    },
    {
      name: 'csharp/refit',
      language: 'csharp',
      library: 'refit',
      includes: [
        '[Multipart]',
        '[AliasAs("name")] string name',
        '[AliasAs("avatar")] ByteArrayPart avatar',
        'new ByteArrayPart(Encoding.UTF8.GetBytes("example file contents"), "avatar.png", "image/png")',
      ],
    },
    {
      name: 'java/okhttp',
      language: 'java',
      library: 'okhttp',
      includes: [
        'new MultipartBody.Builder()',
        '.setType(MultipartBody.FORM)',
        '.addFormDataPart("name", "John Doe")',
        '.addFormDataPart("avatar", "avatar.png"',
      ],
    },
    {
      name: 'java/apache-httpclient',
      language: 'java',
      library: 'apache-httpclient',
      includes: [
        'MultipartEntityBuilder.create()',
        '.addTextBody("name", "John Doe")',
        '.addBinaryBody("avatar"',
        '"avatar.png"',
      ],
    },
    {
      name: 'java/unirest',
      language: 'java',
      library: 'unirest',
      includes: [
        '.field("name", "John Doe")',
        '.field("avatar", new File("avatar.png"), "image/png")',
      ],
    },
    {
      name: 'java/retrofit',
      language: 'java',
      library: 'retrofit',
      includes: [
        '@Multipart',
        '@Part("name") RequestBody name',
        '@Part MultipartBody.Part avatar',
        'MultipartBody.Part.createFormData("avatar", "avatar.png"',
      ],
    },
    {
      name: 'kotlin/okhttp',
      language: 'kotlin',
      library: 'okhttp',
      includes: [
        'MultipartBody.Builder()',
        '.setType(MultipartBody.FORM)',
        '.addFormDataPart("name", "John Doe")',
        '.addFormDataPart("avatar", "avatar.png"',
      ],
    },
    {
      name: 'kotlin/retrofit',
      language: 'kotlin',
      library: 'retrofit',
      includes: [
        '@Multipart',
        '@Part("name") name: RequestBody',
        '@Part avatar: MultipartBody.Part',
        'MultipartBody.Part.createFormData("avatar", "avatar.png"',
      ],
    },
    {
      name: 'php/curl',
      language: 'php',
      library: 'curl',
      includes: [
        "new CURLFile('avatar.png', 'image/png', 'avatar.png')",
        "'name' => 'John Doe'",
        'CURLOPT_POSTFIELDS',
      ],
    },
    {
      name: 'php/guzzle',
      language: 'php',
      library: 'guzzle',
      includes: [
        "'multipart' => [",
        "'name' => 'name'",
        "'contents' => 'John Doe'",
        "'filename' => 'avatar.png'",
      ],
    },
    {
      name: 'ruby/faraday',
      language: 'ruby',
      library: 'faraday',
      includes: [
        "require 'faraday/multipart'",
        'req.body = {',
        "'name' => 'John Doe'",
        "'avatar' => Faraday::Multipart::FilePart.new('avatar.png', 'image/png')",
      ],
    },
    {
      name: 'ruby/httparty',
      language: 'ruby',
      library: 'httparty',
      includes: [
        'multipart: true,',
        'body: {',
        "'name' => 'John Doe'",
        "'avatar' => File.open('avatar.png')",
      ],
    },
    {
      name: 'swift/alamofire',
      language: 'swift',
      library: 'alamofire',
      includes: [
        'AF.upload(multipartFormData: { multipartFormData in',
        'multipartFormData.append(Data("John Doe".utf8), withName: "name")',
        'multipartFormData.append(Data("example file contents".utf8), withName: "avatar", fileName: "avatar.png", mimeType: "image/png")',
      ],
    },
    {
      name: 'swift/urlsession',
      language: 'swift',
      library: 'urlsession',
      includes: [
        'let boundary = "----SDKWorkFormBoundary"',
        'multipart/form-data; boundary=',
        'filename="avatar.png"',
      ],
    },
    {
      name: 'dart/http',
      language: 'dart',
      library: 'http',
      includes: [
        "var request = http.MultipartRequest('POST', uri);",
        "request.fields['name'] = 'John Doe';",
        "http.MultipartFile.fromString('avatar', 'example file contents'",
        "filename: 'avatar.png'",
      ],
    },
    {
      name: 'dart/dio',
      language: 'dart',
      library: 'dio',
      includes: [
        'final requestBody = FormData.fromMap({',
        "'name': 'John Doe',",
        "'avatar': MultipartFile.fromString(",
        "filename: 'avatar.png'",
      ],
    },
  ];

  for (const testCase of cases) {
    test(`generates multipart form data for ${testCase.name}`, () => {
      const context: CodeGenerateContext = {
        ...BASE_TEST_CONFIG.context,
        language: testCase.language,
        library: testCase.library,
      };

      const result = CodeGeneratorFactory.generate(
        MULTIPART_REQUEST_DEFINITION,
        context
      );
      const code = result.code;

      testCase.includes.forEach((pattern) => {
        expect(code).toContain(pattern);
      });
    });
  }
});
