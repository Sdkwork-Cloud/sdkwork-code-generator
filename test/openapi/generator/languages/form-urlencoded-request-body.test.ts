import { CodeGeneratorFactory } from '../../../../src/openapi/generator/factory';
import {
  ApiRequestDefinition,
  CodeGenerateContext,
  Language,
  OpenAPIOperation,
} from '../../../../src/types';
import { BASE_TEST_CONFIG } from './test-data';

type FormUrlEncodedCase = {
  name: string;
  language: Language;
  library: string;
  includes: string[];
  excludes: string[];
};

const ENCODED_BODY = 'name=John+Doe&email=john%40example.com';

const FORM_OPERATION: OpenAPIOperation = {
  operationId: 'createUser',
  summary: 'Create a new user',
  description: 'Create a new user with form-urlencoded payload',
  requestBody: {
    required: true,
    content: {
      'application/x-www-form-urlencoded': {
        schema: {
          type: 'object',
          example: {
            name: 'John Doe',
            email: 'john@example.com',
          },
          properties: {
            name: {
              type: 'string',
            },
            email: {
              type: 'string',
              format: 'email',
            },
          },
          required: ['name', 'email'],
        },
      },
    },
  },
  responses: {
    '201': {
      description: 'User created successfully',
    },
  },
};

const FORM_REQUEST_DEFINITION: ApiRequestDefinition = {
  path: '/api/v1/users',
  method: 'POST',
  operation: FORM_OPERATION,
  pathItem: {},
};

describe('application/x-www-form-urlencoded request body support', () => {
  const cases: FormUrlEncodedCase[] = [
    {
      name: 'javascript/axios',
      language: 'javascript',
      library: 'axios',
      includes: [
        "'Content-Type': 'application/x-www-form-urlencoded'",
        `data: '${ENCODED_BODY}'`,
      ],
      excludes: ['application/json', 'JSON.stringify('],
    },
    {
      name: 'javascript/fetch',
      language: 'javascript',
      library: 'fetch',
      includes: [
        "'Content-Type': 'application/x-www-form-urlencoded'",
        `body: '${ENCODED_BODY}'`,
      ],
      excludes: ['application/json', 'JSON.stringify('],
    },
    {
      name: 'javascript/got',
      language: 'javascript',
      library: 'got',
      includes: [
        "'Content-Type': 'application/x-www-form-urlencoded'",
        `body: '${ENCODED_BODY}'`,
      ],
      excludes: ['application/json', 'json:'],
    },
    {
      name: 'javascript/superagent',
      language: 'javascript',
      library: 'superagent',
      includes: [
        "request.set('Content-Type', 'application/x-www-form-urlencoded');",
        `request.send('${ENCODED_BODY}');`,
      ],
      excludes: ['application/json', 'request.send({'],
    },
    {
      name: 'typescript/axios',
      language: 'typescript',
      library: 'axios',
      includes: [
        "'Content-Type': 'application/x-www-form-urlencoded'",
        `data: '${ENCODED_BODY}'`,
      ],
      excludes: ['application/json', 'JSON.stringify('],
    },
    {
      name: 'typescript/fetch',
      language: 'typescript',
      library: 'fetch',
      includes: [
        "'Content-Type': 'application/x-www-form-urlencoded'",
        `body: '${ENCODED_BODY}'`,
      ],
      excludes: ['application/json', 'JSON.stringify('],
    },
    {
      name: 'typescript/got',
      language: 'typescript',
      library: 'got',
      includes: [
        "'Content-Type': 'application/x-www-form-urlencoded'",
        `body: '${ENCODED_BODY}'`,
      ],
      excludes: ['application/json', 'json:'],
    },
    {
      name: 'typescript/superagent',
      language: 'typescript',
      library: 'superagent',
      includes: [
        "request.set('Content-Type', 'application/x-www-form-urlencoded');",
        `request.send('${ENCODED_BODY}');`,
      ],
      excludes: ['application/json', 'request.send({'],
    },
    {
      name: 'python/requests',
      language: 'python',
      library: 'requests',
      includes: [
        "headers={'Content-Type': 'application/x-www-form-urlencoded'}",
        `data='${ENCODED_BODY}'`,
      ],
      excludes: ['application/json', 'json='],
    },
    {
      name: 'python/aiohttp',
      language: 'python',
      library: 'aiohttp',
      includes: [
        "'Content-Type': 'application/x-www-form-urlencoded'",
        `data = '${ENCODED_BODY}'`,
        'data=data',
      ],
      excludes: ['application/json', 'json.dumps('],
    },
    {
      name: 'python/httpx',
      language: 'python',
      library: 'httpx',
      includes: [
        "'Content-Type': 'application/x-www-form-urlencoded'",
        `data = '${ENCODED_BODY}'`,
        'content=data',
      ],
      excludes: ['application/json', 'json=data'],
    },
    {
      name: 'go/net-http',
      language: 'go',
      library: 'net/http',
      includes: [
        'req.Header.Set("Content-Type", "application/x-www-form-urlencoded")',
        `strings.NewReader(\`${ENCODED_BODY}\`)`,
      ],
      excludes: ['application/json', 'json.Marshal'],
    },
    {
      name: 'go/fasthttp',
      language: 'go',
      library: 'fasthttp',
      includes: [
        'req.Header.Set("Content-Type", "application/x-www-form-urlencoded")',
        `req.SetBodyString(\`${ENCODED_BODY}\`)`,
      ],
      excludes: ['application/json', 'json.Marshal'],
    },
    {
      name: 'go/resty',
      language: 'go',
      library: 'resty',
      includes: [
        'req.SetHeader("Content-Type", "application/x-www-form-urlencoded")',
        `req.SetBody(\`${ENCODED_BODY}\`)`,
      ],
      excludes: ['application/json', 'SetBody({'],
    },
    {
      name: 'shell/curl',
      language: 'shell',
      library: 'curl',
      includes: [
        'Content-Type: application/x-www-form-urlencoded',
        `--data-raw '${ENCODED_BODY}'`,
      ],
      excludes: ['application/json'],
    },
    {
      name: 'rust/reqwest',
      language: 'rust',
      library: 'reqwest',
      includes: [
        '"content-type"',
        ` .body("${ENCODED_BODY}")`.trim(),
      ],
      excludes: ['application/json', 'serde_json::json!'],
    },
    {
      name: 'cpp/cpprest',
      language: 'cpp',
      library: 'cpprest',
      includes: [
        'request.headers().add(U("Content-Type"), U("application/x-www-form-urlencoded"));',
        `request.set_body("${ENCODED_BODY}", "application/x-www-form-urlencoded");`,
      ],
      excludes: ['application/json', 'json::value::parse'],
    },
    {
      name: 'cpp/cpp-httplib',
      language: 'cpp',
      library: 'cpp-httplib',
      includes: [
        '{"Content-Type", "application/x-www-form-urlencoded"}',
        `std::string request_body = "${ENCODED_BODY}";`,
      ],
      excludes: ['application/json', 'json request_body ='],
    },
    {
      name: 'cpp/boost-beast',
      language: 'cpp',
      library: 'boost-beast',
      includes: [
        'req.set(http::field::content_type, "application/x-www-form-urlencoded");',
        `req.body() = "${ENCODED_BODY}";`,
      ],
      excludes: ['application/json', 'json request_body ='],
    },
    {
      name: 'csharp/httpclient',
      language: 'csharp',
      library: 'httpclient',
      includes: [
        `new StringContent("${ENCODED_BODY}", Encoding.UTF8, "application/x-www-form-urlencoded");`,
      ],
      excludes: ['application/json', 'JsonSerializer.Serialize'],
    },
    {
      name: 'csharp/restsharp',
      language: 'csharp',
      library: 'restsharp',
      includes: [
        'AddHeader("Content-Type", "application/x-www-form-urlencoded");',
        `AddParameter("application/x-www-form-urlencoded", "${ENCODED_BODY}", ParameterType.RequestBody);`,
      ],
      excludes: ['application/json', 'AddJsonBody'],
    },
    {
      name: 'csharp/refit',
      language: 'csharp',
      library: 'refit',
      includes: [
        '[Headers("Content-Type: application/x-www-form-urlencoded")]',
        '[Body] string body',
      ],
      excludes: ['[Body] object body'],
    },
    {
      name: 'java/okhttp',
      language: 'java',
      library: 'okhttp',
      includes: [
        'MediaType.parse("application/x-www-form-urlencoded")',
        `"${ENCODED_BODY}"`,
      ],
      excludes: ['application/json'],
    },
    {
      name: 'java/apache-httpclient',
      language: 'java',
      library: 'apache-httpclient',
      includes: [
        'setHeader("Content-Type", "application/x-www-form-urlencoded")',
        `String requestBody = "${ENCODED_BODY}";`,
      ],
      excludes: ['application/json', 'writeValueAsString'],
    },
    {
      name: 'java/unirest',
      language: 'java',
      library: 'unirest',
      includes: [
        '.header("Content-Type", "application/x-www-form-urlencoded")',
        `.body("${ENCODED_BODY}")`,
      ],
      excludes: ['application/json'],
    },
    {
      name: 'java/retrofit',
      language: 'java',
      library: 'retrofit',
      includes: [
        '@Headers("Content-Type: application/x-www-form-urlencoded")',
        `RequestBody.create(MediaType.parse("application/x-www-form-urlencoded"), "${ENCODED_BODY}")`,
      ],
      excludes: ['new Gson().toJsonTree', 'application/json")'],
    },
    {
      name: 'kotlin/okhttp',
      language: 'kotlin',
      library: 'okhttp',
      includes: [
        'MediaType.parse("application/x-www-form-urlencoded")',
        `"${ENCODED_BODY}"`,
      ],
      excludes: ['application/json'],
    },
    {
      name: 'kotlin/retrofit',
      language: 'kotlin',
      library: 'retrofit',
      includes: [
        '@Headers("Content-Type: application/x-www-form-urlencoded")',
        `RequestBody.create(MediaType.parse("application/x-www-form-urlencoded"), "${ENCODED_BODY}")`,
      ],
      excludes: ['Gson().toJsonTree', 'application/json")'],
    },
    {
      name: 'php/curl',
      language: 'php',
      library: 'curl',
      includes: [
        'Content-Type: application/x-www-form-urlencoded',
        `CURLOPT_POSTFIELDS, '${ENCODED_BODY}'`,
      ],
      excludes: ['application/json', 'json_encode'],
    },
    {
      name: 'php/guzzle',
      language: 'php',
      library: 'guzzle',
      includes: [
        "'Content-Type' => 'application/x-www-form-urlencoded'",
        `'body' => '${ENCODED_BODY}'`,
      ],
      excludes: ["'json' =>", 'application/json'],
    },
    {
      name: 'ruby/faraday',
      language: 'ruby',
      library: 'faraday',
      includes: [
        "req.headers['Content-Type'] = 'application/x-www-form-urlencoded'",
        `req.body = '${ENCODED_BODY}'`,
      ],
      excludes: ['application/json', '.to_json'],
    },
    {
      name: 'ruby/httparty',
      language: 'ruby',
      library: 'httparty',
      includes: [
        "'Content-Type' => 'application/x-www-form-urlencoded'",
        `body: '${ENCODED_BODY}',`,
      ],
      excludes: ['application/json', '.to_json'],
    },
    {
      name: 'swift/alamofire',
      language: 'swift',
      library: 'alamofire',
      includes: [
        '"Content-Type": "application/x-www-form-urlencoded"',
        `"${ENCODED_BODY}".data(using: .utf8)!`,
      ],
      excludes: ['application/json'],
    },
    {
      name: 'swift/urlsession',
      language: 'swift',
      library: 'urlsession',
      includes: [
        'setValue("application/x-www-form-urlencoded", forHTTPHeaderField: "Content-Type")',
        `"${ENCODED_BODY}".data(using: .utf8)`,
      ],
      excludes: ['application/json', 'JSONSerialization.data'],
    },
    {
      name: 'dart/http',
      language: 'dart',
      library: 'http',
      includes: [
        '"Content-Type": "application/x-www-form-urlencoded"',
        `final body = '${ENCODED_BODY}';`,
      ],
      excludes: ['application/json', 'jsonEncode'],
    },
    {
      name: 'dart/dio',
      language: 'dart',
      library: 'dio',
      includes: [
        "'Content-Type': 'application/x-www-form-urlencoded'",
        `final requestBody = '${ENCODED_BODY}';`,
      ],
      excludes: ['application/json', 'final requestBody = {'],
    },
  ];

  for (const testCase of cases) {
    test(`generates form-urlencoded bodies for ${testCase.name}`, () => {
      const context: CodeGenerateContext = {
        ...BASE_TEST_CONFIG.context,
        language: testCase.language,
        library: testCase.library,
      };

      const result = CodeGeneratorFactory.generate(
        FORM_REQUEST_DEFINITION,
        context
      );
      const code = result.code;

      testCase.includes.forEach((pattern) => {
        expect(code).toContain(pattern);
      });

      testCase.excludes.forEach((pattern) => {
        expect(code).not.toContain(pattern);
      });
    });
  }
});
