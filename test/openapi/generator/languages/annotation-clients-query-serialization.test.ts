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
  includes: string[];
  excludes: string[];
};

describe('annotation client query parameter serialization', () => {
  const queryParams: ExampleOpenAPIParameter[] = [
    {
      name: 'tags',
      in: 'query',
      required: false,
      schema: {
        type: 'array',
        items: { type: 'string' },
      },
      value: ['red', 'blue green'],
    },
    {
      name: 'filter',
      in: 'query',
      required: false,
      schema: {
        type: 'object',
        properties: {
          role: { type: 'string' },
          name: { type: 'string' },
        },
      },
      value: {
        role: 'admin',
        name: 'Alex Smith',
      },
    },
  ];
  const context: CodeGenerateContext = {
    ...BASE_TEST_CONFIG.context,
  };

  const cases: GeneratorCase[] = [
    {
      name: 'java/retrofit',
      generator: new RetrofitJavaRequestCodeGenerator(),
      includes: [
        '@Query("tags") String tags',
        '@Query("tags") String tags2',
        '@Query("role") String role',
        '@Query("name") String name',
      ],
      excludes: ['@Query("filter") String filter', '"red,blue green"', '"[object Object]"'],
    },
    {
      name: 'kotlin/retrofit',
      generator: new RetrofitKotlinRequestCodeGenerator(),
      includes: [
        '@Query("tags") tags: String',
        '@Query("tags") tags2: String',
        '@Query("role") role: String',
        '@Query("name") name: String',
      ],
      excludes: ['@Query("filter") filter: String', '"red,blue green"', '"[object Object]"'],
    },
    {
      name: 'csharp/refit',
      generator: new RefitCsharpRequestCodeGenerator(),
      includes: [
        '[Query("tags")] string tags',
        '[Query("tags")] string tags2',
        '[Query("role")] string role',
        '[Query("name")] string name',
      ],
      excludes: [
        '[Query("filter")] string filter',
        '"red,blue green"',
        '"[object Object]"',
      ],
    },
  ];

  test.each(cases)(
    '$name expands array and object query parameters using form-style defaults',
    ({ generator, includes, excludes }) => {
      const code = generator.generateCode(
        BASE_TEST_CONFIG.path,
        'GET',
        BASE_TEST_CONFIG.baseUrl,
        TEST_OPERATION,
        [],
        [],
        queryParams,
        undefined,
        context
      );

      includes.forEach((snippet) => expect(code).toContain(snippet));
      excludes.forEach((snippet) => expect(code).not.toContain(snippet));
    }
  );
});
