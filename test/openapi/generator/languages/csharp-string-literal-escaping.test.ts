import { HttpClientCSharpRequestCodeGenerator } from '../../../../src/openapi/generator/languages/csharp/httpclient';
import { RefitCsharpRequestCodeGenerator } from '../../../../src/openapi/generator/languages/csharp/refit';
import { RestsharpCsharpRequestCodeGenerator } from '../../../../src/openapi/generator/languages/csharp/restsharp';
import { CodeGenerateContext } from '../../../../src/types';
import { BASE_TEST_CONFIG, POST_TEST_OPERATION } from './test-data';

describe('csharp string literal escaping', () => {
  const requestBody = 'line 1\nline "2"';
  const context: CodeGenerateContext = {
    ...BASE_TEST_CONFIG.context,
    requestContentType: 'text/plain',
  };

  test('httpclient escapes multiline text request bodies inside C# string literals', () => {
    const generator = new HttpClientCSharpRequestCodeGenerator();
    const code = generator.generateCode(
      BASE_TEST_CONFIG.path,
      'POST',
      BASE_TEST_CONFIG.baseUrl,
      POST_TEST_OPERATION,
      [],
      [],
      [],
      requestBody,
      context
    );

    expect(code).toContain(
      'new StringContent("line 1\\nline \\"2\\"", Encoding.UTF8, "text/plain");'
    );
    expect(code).not.toContain(
      'new StringContent("line 1\nline \\"2\\"", Encoding.UTF8, "text/plain");'
    );
  });

  test('restsharp escapes multiline text request bodies inside C# string literals', () => {
    const generator = new RestsharpCsharpRequestCodeGenerator();
    const code = generator.generateCode(
      BASE_TEST_CONFIG.path,
      'POST',
      BASE_TEST_CONFIG.baseUrl,
      POST_TEST_OPERATION,
      [],
      [],
      [],
      requestBody,
      context
    );

    expect(code).toContain('AddStringBody("line 1\\nline \\"2\\"", DataFormat.None);');
    expect(code).not.toContain(
      'AddStringBody("line 1\nline \\"2\\"", DataFormat.None);'
    );
  });

  test('refit escapes multiline text request bodies inside C# string literals', () => {
    const generator = new RefitCsharpRequestCodeGenerator();
    const code = generator.generateCode(
      BASE_TEST_CONFIG.path,
      'POST',
      BASE_TEST_CONFIG.baseUrl,
      POST_TEST_OPERATION,
      [],
      [],
      [],
      requestBody,
      context
    );

    expect(code).toContain('"line 1\\nline \\"2\\""');
    expect(code).not.toContain('"line 1\nline \\"2\\""');
  });
});
