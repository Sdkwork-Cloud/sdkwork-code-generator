import { RequestsPythonRequestCodeGenerator } from '../../../../../src/openapi/generator/languages/python/requests';
import { 
  BASE_TEST_CONFIG, 
  TEST_OPERATION, 
  TEST_PATH_VARIABLES, 
  TEST_HEADERS, 
  TEST_QUERY_PARAMS, 
  TEST_REQUEST_BODY,
  POST_TEST_OPERATION 
} from '../test-data';

describe('Python Requests Generator', () => {
  let generator: RequestsPythonRequestCodeGenerator;

  beforeEach(() => {
    generator = new RequestsPythonRequestCodeGenerator();
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

    expect(code).toContain('import requests');
    expect(code).toContain('requests.get');
    expect(code).toContain('headers');
    expect(code).toContain('params');
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

    expect(code).toContain('requests.post');
    expect(code).toContain('json=');
  });

  test('should generate plain text POST bodies without json= payloads', () => {
    const code = generator.generateCode(
      BASE_TEST_CONFIG.path,
      'POST',
      BASE_TEST_CONFIG.baseUrl,
      POST_TEST_OPERATION,
      [],
      [],
      [],
      'hello world',
      {
        ...BASE_TEST_CONFIG.context,
        requestContentType: 'text/plain',
      }
    );

    expect(code).toContain("headers={'Content-Type': 'text/plain'}");
    expect(code).toContain("data='hello world'");
    expect(code).not.toContain('json=');
  });

  test('should handle path variables correctly', () => {
    const code = generator.generateCode(
      '/api/users/{userId}',
      'GET',
      BASE_TEST_CONFIG.baseUrl,
      TEST_OPERATION,
      [{ name: 'userId', value: '123', in: 'path', required: true, schema: { type: 'string' } }],
      TEST_HEADERS,
      TEST_QUERY_PARAMS,
      null,
      BASE_TEST_CONFIG.context
    );

    expect(code).toContain('userId');
    expect(code).toMatch(/\/api\/users\/\{userId\}/);
  });

  test('should return correct language and library', () => {
    expect(generator.getLanguage()).toBe('python');
    expect(generator.getLibrary()).toBe('requests');
  });
});
