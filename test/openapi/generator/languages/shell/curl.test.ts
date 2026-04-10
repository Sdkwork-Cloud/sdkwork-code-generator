import { CurlShellRequestCodeGenerator } from '../../../../../src/openapi/generator/languages/shell/curl';
import {
  BASE_TEST_CONFIG,
  POST_TEST_OPERATION,
  TEST_HEADERS,
  TEST_QUERY_PARAMS,
  TEST_REQUEST_BODY,
  TEST_OPERATION,
} from '../test-data';

describe('Shell Curl Generator', () => {
  let generator: CurlShellRequestCodeGenerator;

  beforeEach(() => {
    generator = new CurlShellRequestCodeGenerator();
  });

  test('should generate GET request code correctly', () => {
    const code = generator.generateCode(
      BASE_TEST_CONFIG.path,
      'GET',
      BASE_TEST_CONFIG.baseUrl,
      TEST_OPERATION,
      [],
      TEST_HEADERS,
      TEST_QUERY_PARAMS,
      null,
      BASE_TEST_CONFIG.context
    );

    expect(code).toContain('curl');
    expect(code).toContain('-X GET');
    expect(code).toContain('Authorization: Bearer token123');
  });

  test('should generate POST request code correctly', () => {
    const code = generator.generateCode(
      BASE_TEST_CONFIG.path,
      'POST',
      BASE_TEST_CONFIG.baseUrl,
      POST_TEST_OPERATION,
      [],
      TEST_HEADERS,
      TEST_QUERY_PARAMS,
      TEST_REQUEST_BODY,
      BASE_TEST_CONFIG.context
    );

    expect(code).toContain('-X POST');
    expect(code).toContain('--data-raw');
    expect(code).toContain('John Doe');
  });

  test('should return correct language and library', () => {
    expect(generator.getLanguage()).toBe('shell' as any);
    expect(generator.getLibrary()).toBe('curl');
  });
});
