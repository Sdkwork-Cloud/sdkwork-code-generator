import { NetHttpGoRequestCodeGenerator } from '../../../../../src/openapi/generator/languages/go/net_http';
import { 
  BASE_TEST_CONFIG, 
  TEST_OPERATION, 
  TEST_PATH_VARIABLES, 
  TEST_HEADERS, 
  TEST_QUERY_PARAMS, 
  TEST_REQUEST_BODY,
  POST_TEST_OPERATION 
} from '../test-data';

describe('Go net/http Generator', () => {
  let generator: NetHttpGoRequestCodeGenerator;

  beforeEach(() => {
    generator = new NetHttpGoRequestCodeGenerator();
  });

  test('should generate GET request code correctly', () => {
    const code = generator.generateCode(
      BASE_TEST_CONFIG.path,
      'GET',
      BASE_TEST_CONFIG.baseUrl,
      TEST_OPERATION,
      TEST_PATH_VARIABLES,
      TEST_HEADERS,
      TEST_QUERY_PARAMS,
      null,
      BASE_TEST_CONFIG.context
    );

    expect(code).toContain('http.NewRequest');
    expect(code).toContain('"GET"');
    expect(code).toContain('req.Header.Set');
    expect(code).toContain('client.Do');
  });

  test('should generate POST request code correctly', () => {
    const code = generator.generateCode(
      BASE_TEST_CONFIG.path,
      'POST',
      BASE_TEST_CONFIG.baseUrl,
      POST_TEST_OPERATION,
      TEST_PATH_VARIABLES,
      TEST_HEADERS,
      TEST_QUERY_PARAMS,
      TEST_REQUEST_BODY,
      BASE_TEST_CONFIG.context
    );

    expect(code).toContain('"POST"');
    expect(code).toContain('json.Marshal');
  });

  test('should handle path variables correctly', () => {
    const code = generator.generateCode(
      '/api/users/{userId}',
      'GET',
      BASE_TEST_CONFIG.baseUrl,
      TEST_OPERATION,
      [{ 
        name: 'userId', 
        in: 'path',
        required: true,
        schema: { type: 'string' },
        value: '123'
      }],
      TEST_HEADERS,
      TEST_QUERY_PARAMS,
      null,
      BASE_TEST_CONFIG.context
    );

    expect(code).toContain('userId');
    expect(code).toMatch(/\/api\/users\/\{userId\}/);
  });

  test('should return correct language and library', () => {
    expect(generator.getLanguage()).toBe('go');
    expect(generator.getLibrary()).toBe('net/http');
  });
});