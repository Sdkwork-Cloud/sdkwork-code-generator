import { RefitCsharpRequestCodeGenerator } from '../../../../src/openapi/generator/languages/csharp/refit';
import { RetrofitJavaRequestCodeGenerator } from '../../../../src/openapi/generator/languages/java/retrofit';
import { RetrofitKotlinRequestCodeGenerator } from '../../../../src/openapi/generator/languages/kotlin/retrofit';
import {
  CodeGenerateContext,
  HttpMethod,
  OpenAPIOperation,
} from '../../../../src/types';
import { BASE_TEST_CONFIG, TEST_OPERATION } from './test-data';

type GeneratorCase = {
  name: string;
  generator: {
    generateCode: (
      path: string,
      method: HttpMethod,
      baseUrl: string,
      operation: OpenAPIOperation,
      cookies: any[],
      headers: any[],
      queryParams: any[],
      requestBody: any,
      context: CodeGenerateContext
    ) => string;
  };
  expected: string;
  unexpected: string;
};

describe('double-quoted route annotation escaping', () => {
  const path = '/users/"special"';
  const context: CodeGenerateContext = {
    ...BASE_TEST_CONFIG.context,
  };

  const cases: GeneratorCase[] = [
    {
      name: 'csharp/refit',
      generator: new RefitCsharpRequestCodeGenerator(),
      expected: '[Get("/users/\\"special\\"")]',
      unexpected: '[Get("/users/"special"")]',
    },
    {
      name: 'java/retrofit',
      generator: new RetrofitJavaRequestCodeGenerator(),
      expected: '@GET("/users/\\"special\\"")',
      unexpected: '@GET("/users/"special"")',
    },
    {
      name: 'kotlin/retrofit',
      generator: new RetrofitKotlinRequestCodeGenerator(),
      expected: '@GET("/users/\\"special\\"")',
      unexpected: '@GET("/users/"special"")',
    },
  ];

  test.each(cases)(
    '$name escapes double quotes in route annotation literals',
    ({ generator, expected, unexpected }) => {
      const code = generator.generateCode(
        path,
        'GET',
        BASE_TEST_CONFIG.baseUrl,
        TEST_OPERATION,
        [],
        [],
        [],
        undefined,
        context
      );

      expect(code).toContain(expected);
      expect(code).not.toContain(unexpected);
    }
  );
});
