import { HttpMethod, OpenAPIOperation, ExampleOpenAPIParameter, CodeGenerateContext, Language } from '../../../../src/types';

/**
 * 测试数据配置
 */

// 基础测试配置
export const BASE_TEST_CONFIG = {
  path: '/api/v1/users',
  baseUrl: 'https://api.example.com',
  method: 'GET' as HttpMethod,
  context: {
    baseUrl: 'https://api.example.com',
    language: 'javascript' as Language,
    library: 'axios',
    openAPISpec: {
      openapi: '3.0.0',
      info: {
        title: 'Test API',
        version: '1.0.0'
      },
      paths: {}
    }
  } as CodeGenerateContext
};

// OpenAPI操作定义示例
export const TEST_OPERATION: OpenAPIOperation = {
  operationId: 'getUsers',
  summary: 'Get user list',
  description: 'Retrieve a list of users with optional filtering',
  tags: ['users'],
  parameters: [
    {
      name: 'limit',
      in: 'query',
      description: 'Number of users to return',
      required: false,
      schema: { type: 'integer', default: 10 }
    },
    {
      name: 'offset',
      in: 'query', 
      description: 'Number of users to skip',
      required: false,
      schema: { type: 'integer', default: 0 }
    },
    {
      name: 'Authorization',
      in: 'header',
      description: 'Bearer token for authentication',
      required: true,
      schema: { type: 'string' }
    }
  ],
  responses: {
    '200': {
      description: 'Successful response',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              users: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'integer' },
                    name: { type: 'string' },
                    email: { type: 'string' }
                  }
                }
              },
              total: { type: 'integer' }
            }
          }
        }
      }
    }
  }
};

// POST操作测试数据
export const POST_TEST_OPERATION: OpenAPIOperation = {
  operationId: 'createUser',
  summary: 'Create a new user',
  description: 'Create a new user with the provided data',
  tags: ['users'],
  parameters: [
    {
      name: 'Authorization',
      in: 'header',
      description: 'Bearer token for authentication',
      required: true,
      schema: { type: 'string' }
    }
  ],
  requestBody: {
    description: 'User creation data',
    required: true,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            email: { type: 'string' },
            age: { type: 'integer' }
          },
          required: ['name', 'email']
        }
      }
    }
  },
  responses: {
    '201': {
      description: 'User created successfully',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              name: { type: 'string' },
              email: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' }
            }
          }
        }
      }
    }
  }
};

// 示例参数数据
export const TEST_PATH_VARIABLES: ExampleOpenAPIParameter[] = [
  { 
    name: 'userId', 
    in: 'path',
    required: true,
    schema: { type: 'string' },
    value: '123'
  }
];

export const TEST_HEADERS: ExampleOpenAPIParameter[] = [
  { 
    name: 'Authorization', 
    in: 'header',
    required: true,
    schema: { type: 'string' },
    value: 'Bearer token123'
  },
  { 
    name: 'Content-Type', 
    in: 'header',
    required: true,
    schema: { type: 'string' },
    value: 'application/json'
  },
  { 
    name: 'User-Agent', 
    in: 'header',
    required: false,
    schema: { type: 'string' },
    value: 'SDKWork-CodeGenerator/1.0'
  }
];

export const TEST_QUERY_PARAMS: ExampleOpenAPIParameter[] = [
  { 
    name: 'limit', 
    in: 'query',
    required: false,
    schema: { type: 'integer', default: 10 },
    value: '10'
  },
  { 
    name: 'offset', 
    in: 'query',
    required: false,
    schema: { type: 'integer', default: 0 },
    value: '0'
  },
  { 
    name: 'sort', 
    in: 'query',
    required: false,
    schema: { type: 'string' },
    value: 'name'
  }
];

// 请求体示例数据
export const TEST_REQUEST_BODY = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  age: 30,
  preferences: {
    newsletter: true,
    notifications: false
  }
};

// 语言和库测试配置
export const LANGUAGE_TEST_CONFIGS = {
  javascript: {
    libs: ['axios', 'fetch', 'got', 'superagent'],
    expectedPatterns: {
      axios: ['axios', 'method', 'url', 'headers'],
      fetch: ['fetch', 'method', 'headers'],
      got: ['got', 'method', 'url', 'headers'],
      superagent: ['superagent', 'method', 'set', 'send']
    }
  },
  typescript: {
    libs: ['axios', 'fetch', 'got', 'superagent'],
    expectedPatterns: {
      axios: ['import axios', 'method', 'Promise', 'interface'],
      fetch: ['fetch', 'method', 'Promise', 'interface'],
      got: ['import got', 'method', 'Promise', 'interface'],
      superagent: ['import superagent', 'method', 'Promise', 'interface']
    }
  },
  python: {
    libs: ['requests', 'aiohttp', 'httpx'],
    expectedPatterns: {
      requests: ['import requests', 'method', 'headers', 'json'],
      aiohttp: ['import aiohttp', 'async', 'await', 'headers'],
      httpx: ['import httpx', 'async', 'await', 'headers']
    }
  },
  go: {
    libs: ['net/http', 'fasthttp', 'resty'],
    expectedPatterns: {
      'net/http': ['http.', 'NewRequest', 'Do', 'json'],
      fasthttp: ['fasthttp', 'AcquireRequest', 'Do', 'json'],
      resty: ['resty', 'NewRequest', 'Execute', 'json']
    }
  },
  java: {
    libs: ['okhttp', 'apache-httpclient', 'retrofit', 'unirest'],
    expectedPatterns: {
      okhttp: ['OkHttpClient', 'Request', 'execute', 'json'],
      'apache-httpclient': ['HttpClient', 'HttpPost', 'execute', 'json'],
      retrofit: ['Retrofit', 'Call', 'execute', 'interface'],
      unirest: ['Unirest', 'method', 'asJson', 'json']
    }
  },
  cpp: {
    libs: ['cpprest', 'cpp-httplib', 'boost-beast'],
    expectedPatterns: {
      cpprest: ['http_client', 'request', 'then', 'json'],
      'cpp-httplib': ['Client', 'request', 'status', 'json'],
      'boost-beast': ['beast', 'http', 'request', 'json']
    }
  },
  csharp: {
    libs: ['httpclient', 'restsharp', 'refit'],
    expectedPatterns: {
      httpclient: ['HttpClient', 'SendAsync', 'await', 'json'],
      restsharp: ['RestClient', 'Execute', 'json'],
      refit: ['Refit', 'interface', 'Task', 'json']
    }
  },
  php: {
    libs: ['guzzle', 'curl'],
    expectedPatterns: {
      guzzle: ['GuzzleHttp', 'request', 'json'],
      curl: ['curl_init', 'curl_setopt', 'json']
    }
  },
  ruby: {
    libs: ['faraday', 'httparty'],
    expectedPatterns: {
      faraday: ['Faraday', 'get', 'headers', 'json'],
      httparty: ['HTTParty', 'get', 'headers', 'json']
    }
  },
  swift: {
    libs: ['alamofire', 'urlsession'],
    expectedPatterns: {
      alamofire: ['Alamofire', 'request', 'response', 'json'],
      urlsession: ['URLSession', 'dataTask', 'response', 'json']
    }
  },
  kotlin: {
    libs: ['okhttp', 'retrofit'],
    expectedPatterns: {
      okhttp: ['OkHttpClient', 'Request', 'execute', 'json'],
      retrofit: ['Retrofit', 'Call', 'execute', 'interface']
    }
  },
  dart: {
    libs: ['http', 'dio'],
    expectedPatterns: {
      http: ['http', 'get', 'headers', 'json'],
      dio: ['Dio', 'get', 'headers', 'json']
    }
  },
  shell: {
    libs: ['curl'],
    expectedPatterns: {
      curl: ['curl', '-X', 'Authorization', 'https://api.example.com']
    }
  },
  rust: {
    libs: ['reqwest'],
    expectedPatterns: {
      reqwest: ['reqwest', 'Client', 'send', 'serde_json']
    }
  }
};
