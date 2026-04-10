import { FasthttpGoRequestCodeGenerator } from '../../../../../src/openapi/generator/languages/go/fasthttp';
import { NetHttpGoRequestCodeGenerator } from '../../../../../src/openapi/generator/languages/go/net_http';
import { RestyGoRequestCodeGenerator } from '../../../../../src/openapi/generator/languages/go/resty';
import { CodeGenerateContext } from '../../../../../src/types';
import {
  BASE_TEST_CONFIG,
  POST_TEST_OPERATION,
  TEST_REQUEST_BODY,
} from '../test-data';

const GO_JSON_BODY_CONTEXT: CodeGenerateContext = {
  ...BASE_TEST_CONFIG.context,
  requestContentType: 'application/json',
  requestBodySchema: {
    type: 'object',
  },
  responseContentType: 'application/json',
  responseBodySchema: {
    type: 'object',
  },
  responseStatusCode: '201',
};

describe('Go JSON request body syntax', () => {
  test('resty serializes object payloads as JSON string literals', () => {
    const code = new RestyGoRequestCodeGenerator().generateCode(
      BASE_TEST_CONFIG.path,
      'POST',
      BASE_TEST_CONFIG.baseUrl,
      POST_TEST_OPERATION,
      [],
      [],
      [],
      TEST_REQUEST_BODY,
      GO_JSON_BODY_CONTEXT
    );

    expect(code).toContain('req.SetBody(`{');
    expect(code).not.toContain('req.SetBody({');
  });

  test('fasthttp serializes object payloads as JSON string literals', () => {
    const code = new FasthttpGoRequestCodeGenerator().generateCode(
      BASE_TEST_CONFIG.path,
      'POST',
      BASE_TEST_CONFIG.baseUrl,
      POST_TEST_OPERATION,
      [],
      [],
      [],
      TEST_REQUEST_BODY,
      GO_JSON_BODY_CONTEXT
    );

    expect(code).toContain('req.SetBodyString(`{');
    expect(code).not.toContain('json.Marshal({');
  });

  test('net/http serializes object payloads as JSON string literals', () => {
    const code = new NetHttpGoRequestCodeGenerator().generateCode(
      BASE_TEST_CONFIG.path,
      'POST',
      BASE_TEST_CONFIG.baseUrl,
      POST_TEST_OPERATION,
      [],
      [],
      [],
      TEST_REQUEST_BODY,
      GO_JSON_BODY_CONTEXT
    );

    expect(code).toContain('strings.NewReader(`{');
    expect(code).not.toContain('json.Marshal({');
  });
});
