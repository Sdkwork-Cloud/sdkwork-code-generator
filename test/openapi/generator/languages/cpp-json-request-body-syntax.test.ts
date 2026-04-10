import { BoostBeastCppRequestCodeGenerator } from '../../../../src/openapi/generator/languages/cpp/boost-beast';
import { CppHttplibCppRequestCodeGenerator } from '../../../../src/openapi/generator/languages/cpp/cpp-httplib';
import { CodeGenerateContext } from '../../../../src/types';
import {
  BASE_TEST_CONFIG,
  POST_TEST_OPERATION,
  TEST_REQUEST_BODY,
} from './test-data';

const CPP_JSON_CONTEXT: CodeGenerateContext = {
  ...BASE_TEST_CONFIG.context,
  requestContentType: 'application/json',
  requestBodySchema: {
    type: 'object',
  },
};

describe('C++ JSON request body syntax', () => {
  test('boost-beast parses object payloads from a JSON string literal', () => {
    const code = new BoostBeastCppRequestCodeGenerator().generateCode(
      BASE_TEST_CONFIG.path,
      'POST',
      BASE_TEST_CONFIG.baseUrl,
      POST_TEST_OPERATION,
      [],
      [],
      [],
      TEST_REQUEST_BODY,
      CPP_JSON_CONTEXT
    );

    expect(code).toContain('json request_body = json::parse(');
    expect(code).not.toContain('json request_body = {');
  });

  test('cpp-httplib parses object payloads from a JSON string literal', () => {
    const code = new CppHttplibCppRequestCodeGenerator().generateCode(
      BASE_TEST_CONFIG.path,
      'POST',
      BASE_TEST_CONFIG.baseUrl,
      POST_TEST_OPERATION,
      [],
      [],
      [],
      TEST_REQUEST_BODY,
      CPP_JSON_CONTEXT
    );

    expect(code).toContain('json request_body = json::parse(');
    expect(code).not.toContain('json request_body = {');
  });
});
