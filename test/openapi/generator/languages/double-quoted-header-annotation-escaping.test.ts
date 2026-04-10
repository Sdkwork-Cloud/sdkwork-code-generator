import { RefitCsharpRequestCodeGenerator } from '../../../../src/openapi/generator/languages/csharp/refit';
import { RetrofitJavaRequestCodeGenerator } from '../../../../src/openapi/generator/languages/java/retrofit';
import { RetrofitKotlinRequestCodeGenerator } from '../../../../src/openapi/generator/languages/kotlin/retrofit';
import {
  CodeGenerateContext,
  ExampleOpenAPIParameter,
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
      cookies: ExampleOpenAPIParameter[],
      headers: ExampleOpenAPIParameter[],
      queryParams: ExampleOpenAPIParameter[],
      requestBody: any,
      context: CodeGenerateContext
    ) => string;
  };
  expected: string;
  unexpected: string;
};

describe('double-quoted header annotation escaping', () => {
  const headers: ExampleOpenAPIParameter[] = [
    {
      name: 'X-Client"Trace',
      in: 'header',
      required: false,
      schema: { type: 'string' },
      value: 'trace-token',
    },
  ];
  const context: CodeGenerateContext = {
    ...BASE_TEST_CONFIG.context,
  };

  const cases: GeneratorCase[] = [
    {
      name: 'csharp/refit',
      generator: new RefitCsharpRequestCodeGenerator(),
      expected: '[Header("X-Client\\"Trace")] string',
      unexpected: '[Header("X-Client"Trace")] string',
    },
    {
      name: 'java/retrofit',
      generator: new RetrofitJavaRequestCodeGenerator(),
      expected: '@Header("X-Client\\"Trace") String',
      unexpected: '@Header("X-Client"Trace") String',
    },
    {
      name: 'kotlin/retrofit',
      generator: new RetrofitKotlinRequestCodeGenerator(),
      expected: '@Header("X-Client\\"Trace")',
      unexpected: '@Header("X-Client"Trace")',
    },
  ];

  test.each(cases)(
    '$name escapes double quotes in header annotation literals',
    ({ generator, expected, unexpected }) => {
      const code = generator.generateCode(
        BASE_TEST_CONFIG.path,
        'GET',
        BASE_TEST_CONFIG.baseUrl,
        TEST_OPERATION,
        [],
        headers,
        [],
        undefined,
        context
      );

      expect(code).toContain(expected);
      expect(code).not.toContain(unexpected);
    }
  );
});
