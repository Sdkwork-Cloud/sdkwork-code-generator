import { ReqwestRustRequestCodeGenerator } from '../../../../../src/openapi/generator/languages/rust/reqwest';
import {
  BASE_TEST_CONFIG,
  POST_TEST_OPERATION,
  TEST_HEADERS,
  TEST_QUERY_PARAMS,
  TEST_REQUEST_BODY,
  TEST_OPERATION,
} from '../test-data';

describe('Rust Reqwest Generator', () => {
  let generator: ReqwestRustRequestCodeGenerator;

  beforeEach(() => {
    generator = new ReqwestRustRequestCodeGenerator();
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

    expect(code).toContain('reqwest::Client');
    expect(code).toContain('.get(');
    expect(code).toContain('headers.insert');
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

    expect(code).toContain('.post(');
    expect(code).toContain('.json(');
    expect(code).toContain('serde_json::json!');
  });

  test('should return correct language and library', () => {
    expect(generator.getLanguage()).toBe('rust' as any);
    expect(generator.getLibrary()).toBe('reqwest');
  });
});
