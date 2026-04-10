import { BoostBeastCppRequestCodeGenerator } from '../../../../src/openapi/generator/languages/cpp/boost-beast';
import { CppHttplibCppRequestCodeGenerator } from '../../../../src/openapi/generator/languages/cpp/cpp-httplib';
import { CpprestCppRequestCodeGenerator } from '../../../../src/openapi/generator/languages/cpp/cpprest';
import { RestsharpCsharpRequestCodeGenerator } from '../../../../src/openapi/generator/languages/csharp/restsharp';
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
};

describe('double-quoted path literal escaping', () => {
  const path = '/users/"special"';
  const context: CodeGenerateContext = {
    ...BASE_TEST_CONFIG.context,
  };
  const escapedPathFragment = '/users/\\"special\\"';
  const rawPathFragment = '/users/"special"';

  const cases: GeneratorCase[] = [
    { name: 'csharp/restsharp', generator: new RestsharpCsharpRequestCodeGenerator() },
    { name: 'cpp/boost-beast', generator: new BoostBeastCppRequestCodeGenerator() },
    { name: 'cpp/cpp-httplib', generator: new CppHttplibCppRequestCodeGenerator() },
    { name: 'cpp/cpprest', generator: new CpprestCppRequestCodeGenerator() },
  ];

  test.each(cases)(
    '$name escapes double quotes in path literals derived from the request path',
    ({ generator }) => {
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

      expect(code).toContain(escapedPathFragment);
      expect(code).not.toContain(rawPathFragment);
    }
  );
});
