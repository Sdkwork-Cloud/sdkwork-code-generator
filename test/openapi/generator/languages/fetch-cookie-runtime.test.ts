import { FetchJavaScriptRequestCodeGenerator } from '../../../../src/openapi/generator/languages/javascript/fetch';
import { FetchTypeScriptRequestCodeGenerator } from '../../../../src/openapi/generator/languages/typescript/fetch';
import { ExampleOpenAPIParameter } from '../../../../src/types';
import { BASE_TEST_CONFIG, TEST_OPERATION } from './test-data';

describe('fetch cookie handling', () => {
  const cookies: ExampleOpenAPIParameter[] = [
    {
      name: 'session',
      in: 'cookie' as const,
      required: false,
      schema: { type: 'string' as const },
      value: 'abc123',
    },
  ];

  test('javascript/fetch relies on credentials instead of generating a forbidden Cookie header', () => {
    const generator = new FetchJavaScriptRequestCodeGenerator();
    const code = generator.generateCode(
      BASE_TEST_CONFIG.path,
      'GET',
      BASE_TEST_CONFIG.baseUrl,
      TEST_OPERATION,
      cookies,
      [],
      [],
      undefined,
      BASE_TEST_CONFIG.context
    );

    expect(code).toContain("credentials: 'include'");
    expect(code).not.toContain("'Cookie': 'session=abc123'");
  });

  test('typescript/fetch relies on credentials instead of generating a forbidden Cookie header', () => {
    const generator = new FetchTypeScriptRequestCodeGenerator();
    const code = generator.generateCode(
      BASE_TEST_CONFIG.path,
      'GET',
      BASE_TEST_CONFIG.baseUrl,
      TEST_OPERATION,
      cookies,
      [],
      [],
      undefined,
      BASE_TEST_CONFIG.context
    );

    expect(code).toContain("credentials: 'include'");
    expect(code).not.toContain("'Cookie': 'session=abc123'");
  });
});
