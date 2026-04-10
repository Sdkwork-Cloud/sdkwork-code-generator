import { RefitCsharpRequestCodeGenerator } from '../../../../src/openapi/generator/languages/csharp/refit';
import { RetrofitJavaRequestCodeGenerator } from '../../../../src/openapi/generator/languages/java/retrofit';
import { RetrofitKotlinRequestCodeGenerator } from '../../../../src/openapi/generator/languages/kotlin/retrofit';
import {
  CodeGenerateContext,
  ExampleMultipartPart,
  ExampleOpenAPIParameter,
  OpenAPIOperation,
} from '../../../../src/types';

const PARAMETER_SANITIZATION_OPERATION: OpenAPIOperation = {
  operationId: 'createUser',
  summary: 'Create user',
  description: 'Creates a user',
  responses: {
    '200': {
      description: 'ok',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              id: { type: 'string' },
            },
          },
        },
      },
    },
  },
};

const PARAMETER_CONTEXT: CodeGenerateContext = {
  baseUrl: 'https://api.example.com',
  language: 'java',
  library: 'retrofit',
  openAPISpec: {
    openapi: '3.0.0',
    info: {
      title: 'Parameter Identifier API',
      version: '1.0.0',
    },
    paths: {},
  },
  requestContentType: 'multipart/form-data',
  requestBodySchema: {
    type: 'object',
    properties: {
      'display-name': { type: 'string' },
      'profile-image': {
        type: 'string',
        format: 'binary',
      },
    },
  },
  responseContentType: 'application/json',
  responseBodySchema: {
    type: 'object',
    properties: {
      id: { type: 'string' },
    },
  },
  responseStatusCode: '200',
};

const COOKIES: ExampleOpenAPIParameter[] = [
  {
    name: 'session-id',
    in: 'cookie',
    required: false,
    schema: { type: 'string' },
    value: 'session-123',
  },
];

const HEADERS: ExampleOpenAPIParameter[] = [
  {
    name: 'x-trace-id',
    in: 'header',
    required: false,
    schema: { type: 'string' },
    value: 'trace-123',
  },
];

const QUERY_PARAMS: ExampleOpenAPIParameter[] = [
  {
    name: 'user-id',
    in: 'query',
    required: false,
    schema: { type: 'string' },
    value: 'user-123',
  },
];

const MULTIPART_BODY: ExampleMultipartPart[] = [
  {
    kind: 'field',
    name: 'display-name',
    value: 'Jane Doe',
  },
  {
    kind: 'file',
    name: 'profile-image',
    value: 'image-bytes',
    filename: 'avatar.png',
    contentType: 'image/png',
  },
];

describe('parameter identifier sanitization for static retrofit generators', () => {
  test('sanitizes invalid Java Retrofit parameter identifiers', () => {
    const code = new RetrofitJavaRequestCodeGenerator().generateCode(
      '/users',
      'POST',
      'https://api.example.com',
      PARAMETER_SANITIZATION_OPERATION,
      COOKIES,
      HEADERS,
      QUERY_PARAMS,
      MULTIPART_BODY,
      PARAMETER_CONTEXT
    );

    expect(code).toContain('@Query("user-id") String userId');
    expect(code).toContain('@Header("x-trace-id") String xTraceId');
    expect(code).toContain('@Part("display-name") RequestBody displayName');
    expect(code).toContain('@Part MultipartBody.Part profileImage');
    expect(code).not.toContain('String user-id');
    expect(code).not.toContain('String x-trace-id');
    expect(code).not.toContain('RequestBody display-name');
    expect(code).not.toContain('MultipartBody.Part profile-image');
  });

  test('sanitizes invalid Kotlin Retrofit parameter identifiers', () => {
    const code = new RetrofitKotlinRequestCodeGenerator().generateCode(
      '/users',
      'POST',
      'https://api.example.com',
      PARAMETER_SANITIZATION_OPERATION,
      COOKIES,
      HEADERS,
      QUERY_PARAMS,
      MULTIPART_BODY,
      PARAMETER_CONTEXT
    );

    expect(code).toContain('@Query("user-id") userId: String');
    expect(code).toContain('@Header("x-trace-id") xTraceId: String');
    expect(code).toContain('@Part("display-name") displayName: RequestBody');
    expect(code).toContain('@Part profileImage: MultipartBody.Part');
    expect(code).not.toContain('user-id: String');
    expect(code).not.toContain('x-trace-id: String');
    expect(code).not.toContain('display-name: RequestBody');
    expect(code).not.toContain('profile-image: MultipartBody.Part');
  });

  test('sanitizes invalid C# Refit parameter identifiers', () => {
    const code = new RefitCsharpRequestCodeGenerator().generateCode(
      '/users',
      'POST',
      'https://api.example.com',
      PARAMETER_SANITIZATION_OPERATION,
      COOKIES,
      HEADERS,
      QUERY_PARAMS,
      MULTIPART_BODY,
      PARAMETER_CONTEXT
    );

    expect(code).toContain('[Header("Cookie")] string sessionIdCookie');
    expect(code).toContain('[Query("user-id")] string userId');
    expect(code).toContain('[Header("x-trace-id")] string xTraceId');
    expect(code).toContain('[AliasAs("display-name")] string displayName');
    expect(code).toContain('[AliasAs("profile-image")] ByteArrayPart profileImage');
    expect(code).not.toContain('string session-idCookie');
    expect(code).not.toContain('string user-id');
    expect(code).not.toContain('string x-trace-id');
    expect(code).not.toContain('string display-name');
    expect(code).not.toContain('ByteArrayPart profile-image');
  });
});
