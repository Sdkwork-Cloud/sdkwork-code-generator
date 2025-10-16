import { BaseRequestCodeGenerator } from '../../../../src/openapi/generator/generator';
import { Language, HttpMethod } from '../../../../src/types';
import {
  BASE_TEST_CONFIG,
  TEST_OPERATION,
  TEST_PATH_VARIABLES,
  TEST_HEADERS,
  TEST_QUERY_PARAMS,
  TEST_REQUEST_BODY
} from './test-data';

/**
 * 测试基类实现
 */
class TestBaseGenerator extends BaseRequestCodeGenerator {
  getLanguage(): Language {
    return 'javascript';
  }

  getLibrary(): string {
    return 'test';
  }

  generateCode(
    path: string,
    method: HttpMethod,
    baseUrl: string,
    operation: any,
    pathVariables: any[],
    headers: any[],
    queryParams: any[],
    requestBody: any,
    context: any
  ): string {
    return `Test code for ${method} ${path}`;
  }
}

describe('BaseRequestCodeGenerator', () => {
  let generator: TestBaseGenerator;

  beforeEach(() => {
    generator = new TestBaseGenerator();
  });

  test('should implement abstract methods correctly', () => {
    expect(generator.getLanguage()).toBe('javascript');
    expect(generator.getLibrary()).toBe('test');
  });

  test('should generate code with all parameters', () => {
    const code = generator.generateCode(
      BASE_TEST_CONFIG.path,
      BASE_TEST_CONFIG.method,
      BASE_TEST_CONFIG.baseUrl,
      TEST_OPERATION,
      TEST_PATH_VARIABLES,
      TEST_HEADERS,
      TEST_QUERY_PARAMS,
      TEST_REQUEST_BODY,
      BASE_TEST_CONFIG.context
    );

    expect(code).toContain('Test code for GET');
    expect(code).toContain(BASE_TEST_CONFIG.path);
  });

  test('should handle empty parameters correctly', () => {
    const code = generator.generateCode(
      BASE_TEST_CONFIG.path,
      BASE_TEST_CONFIG.method,
      BASE_TEST_CONFIG.baseUrl,
      TEST_OPERATION,
      [],
      [],
      [],
      null,
      BASE_TEST_CONFIG.context
    );

    expect(code).toBeDefined();
    expect(typeof code).toBe('string');
  });

  test('should handle different HTTP methods', () => {
    const methods: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
    
    methods.forEach(method => {
      const code = generator.generateCode(
        BASE_TEST_CONFIG.path,
        method,
        BASE_TEST_CONFIG.baseUrl,
        TEST_OPERATION,
        TEST_PATH_VARIABLES,
        TEST_HEADERS,
        TEST_QUERY_PARAMS,
        TEST_REQUEST_BODY,
        BASE_TEST_CONFIG.context
      );

      expect(code).toContain(`Test code for ${method}`);
    });
  });
});