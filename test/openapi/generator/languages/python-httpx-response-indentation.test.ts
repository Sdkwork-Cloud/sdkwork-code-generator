import { HttpxPythonRequestCodeGenerator } from '../../../../src/openapi/generator/languages/python/httpx';
import { BASE_TEST_CONFIG, TEST_OPERATION } from './test-data';

describe('Python httpx response handling indentation', () => {
  test('keeps string response handling at a consistent indentation level', () => {
    const code = new HttpxPythonRequestCodeGenerator().generateCode(
      BASE_TEST_CONFIG.path,
      'GET',
      BASE_TEST_CONFIG.baseUrl,
      TEST_OPERATION,
      [],
      [],
      [],
      null,
      {
        ...BASE_TEST_CONFIG.context,
        responseContentType: 'text/plain',
      }
    );

    expect(code).toContain("        print('Response:', data)");
    expect(code).not.toContain("            print('Response:', data)");
  });
});
