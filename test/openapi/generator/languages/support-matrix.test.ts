import { CodeGeneratorFactory } from '../../../../src/openapi/generator/factory';
import {
  BASE_TEST_CONFIG,
  LANGUAGE_TEST_CONFIGS,
  TEST_OPERATION,
} from './test-data';
import { ApiRequestDefinition, CodeGenerateContext, Language } from '../../../../src/types';

describe('generator support matrix', () => {
  const requestDefinition: ApiRequestDefinition = {
    path: '/api/users',
    method: 'GET',
    operation: TEST_OPERATION,
    pathItem: {},
  };

  for (const [language, config] of Object.entries(LANGUAGE_TEST_CONFIGS)) {
    for (const library of config.libs) {
      test(`should generate non-empty smoke output for ${language}/${library}`, () => {
        const context: CodeGenerateContext = {
          ...BASE_TEST_CONFIG.context,
          language: language as Language,
          library,
        };
        const expectedPatterns = (
          config.expectedPatterns as Record<string, string[]>
        )[library];

        expect(CodeGeneratorFactory.isSupported(language as Language, library)).toBe(
          true
        );

        const result = CodeGeneratorFactory.generate(requestDefinition, context);
        const containsOperationContext =
          result.code.includes(TEST_OPERATION.operationId as string) ||
          result.code.includes(TEST_OPERATION.summary as string) ||
          result.code.includes(requestDefinition.path);

        expect(result.language).toBe(language);
        expect(result.library).toBe(library);
        expect(result.code.length).toBeGreaterThan(40);
        expect(containsOperationContext).toBe(true);
        expect(expectedPatterns.some((pattern: string) => result.code.includes(pattern))).toBe(true);
      });
    }
  }
});
