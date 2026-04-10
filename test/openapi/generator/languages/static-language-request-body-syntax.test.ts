import { RestsharpCsharpRequestCodeGenerator } from '../../../../src/openapi/generator/languages/csharp/restsharp';
import { OkHttpJavaRequestCodeGenerator } from '../../../../src/openapi/generator/languages/java/okhttp';
import { CodeGenerateContext } from '../../../../src/types';
import {
  BASE_TEST_CONFIG,
  POST_TEST_OPERATION,
  TEST_REQUEST_BODY,
} from './test-data';

describe('static language request body syntax', () => {
  test('csharp/restsharp emits a valid JSON string body for object payloads', () => {
    const generator = new RestsharpCsharpRequestCodeGenerator();
    const context: CodeGenerateContext = {
      ...BASE_TEST_CONFIG.context,
      requestContentType: 'application/json',
      requestBodySchema: {
        type: 'object',
      },
    };

    const code = generator.generateCode(
      BASE_TEST_CONFIG.path,
      'POST',
      BASE_TEST_CONFIG.baseUrl,
      POST_TEST_OPERATION,
      [],
      [],
      [],
      TEST_REQUEST_BODY,
      context
    );

    expect(code).toContain('var requestBody = @"{');
    expect(code).toContain(
      'request.AddStringBody(requestBody, DataFormat.Json);'
    );
    expect(code).not.toContain('AddJsonBody({');
  });

  test('java/okhttp terminates text request body statements with a semicolon', () => {
    const generator = new OkHttpJavaRequestCodeGenerator();
    const context: CodeGenerateContext = {
      ...BASE_TEST_CONFIG.context,
      requestContentType: 'text/plain',
    };

    const code = generator.generateCode(
      BASE_TEST_CONFIG.path,
      'POST',
      BASE_TEST_CONFIG.baseUrl,
      POST_TEST_OPERATION,
      [],
      [],
      [],
      'hello world',
      context
    );

    expect(code).toContain(
      'RequestBody requestBody = RequestBody.create(MediaType.parse("text/plain"), "hello world");'
    );
  });

  test('java/okhttp terminates JSON request body statements with a semicolon', () => {
    const generator = new OkHttpJavaRequestCodeGenerator();
    const context: CodeGenerateContext = {
      ...BASE_TEST_CONFIG.context,
      requestContentType: 'application/json',
      requestBodySchema: {
        type: 'object',
      },
    };

    const code = generator.generateCode(
      BASE_TEST_CONFIG.path,
      'POST',
      BASE_TEST_CONFIG.baseUrl,
      POST_TEST_OPERATION,
      [],
      [],
      [],
      TEST_REQUEST_BODY,
      context
    );

    expect(code).toMatch(
      /RequestBody requestBody = RequestBody\.create\([\s\S]*?\)\s*;\s*Request\.Builder requestBuilder =/m
    );
  });
});
