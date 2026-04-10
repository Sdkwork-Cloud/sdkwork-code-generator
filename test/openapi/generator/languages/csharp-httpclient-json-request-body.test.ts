import { HttpClientCSharpRequestCodeGenerator } from '../../../../src/openapi/generator/languages/csharp/httpclient';
import { CodeGenerateContext } from '../../../../src/types';
import {
  BASE_TEST_CONFIG,
  POST_TEST_OPERATION,
  TEST_REQUEST_BODY,
} from './test-data';

describe('csharp/httpclient JSON object request body generation', () => {
  test('emits a JSON string literal instead of invalid serializer syntax', () => {
    const generator = new HttpClientCSharpRequestCodeGenerator();
    const context: CodeGenerateContext = {
      ...BASE_TEST_CONFIG.context,
      requestContentType: 'application/json',
      requestBodySchema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
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

    expect(code).toContain('var json = @"{');
    expect(code).not.toContain('JsonSerializer.Serialize({');
  });
});
