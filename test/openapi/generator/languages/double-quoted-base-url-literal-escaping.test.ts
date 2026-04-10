import { BoostBeastCppRequestCodeGenerator } from '../../../../src/openapi/generator/languages/cpp/boost-beast';
import { CppHttplibCppRequestCodeGenerator } from '../../../../src/openapi/generator/languages/cpp/cpp-httplib';
import { CpprestCppRequestCodeGenerator } from '../../../../src/openapi/generator/languages/cpp/cpprest';
import { RefitCsharpRequestCodeGenerator } from '../../../../src/openapi/generator/languages/csharp/refit';
import { RestsharpCsharpRequestCodeGenerator } from '../../../../src/openapi/generator/languages/csharp/restsharp';
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
  escapedFragment: string;
  rawFragment: string;
};

describe('double-quoted base URL literal escaping', () => {
  const baseUrl = 'https://api."example".com';
  const context: CodeGenerateContext = {
    ...BASE_TEST_CONFIG.context,
  };

  const cases: GeneratorCase[] = [
    {
      name: 'csharp/restsharp',
      generator: new RestsharpCsharpRequestCodeGenerator(),
      escapedFragment: 'https://api.\\"example\\".com',
      rawFragment: 'https://api."example".com',
    },
    {
      name: 'csharp/refit',
      generator: new RefitCsharpRequestCodeGenerator(),
      escapedFragment: 'https://api.\\"example\\".com',
      rawFragment: 'https://api."example".com',
    },
    {
      name: 'cpp/boost-beast',
      generator: new BoostBeastCppRequestCodeGenerator(),
      escapedFragment: 'api.\\"example\\".com',
      rawFragment: 'api."example".com',
    },
    {
      name: 'cpp/cpp-httplib',
      generator: new CppHttplibCppRequestCodeGenerator(),
      escapedFragment: 'https://api.\\"example\\".com',
      rawFragment: 'https://api."example".com',
    },
    {
      name: 'cpp/cpprest',
      generator: new CpprestCppRequestCodeGenerator(),
      escapedFragment: 'https://api.\\"example\\".com',
      rawFragment: 'https://api."example".com',
    },
    {
      name: 'java/retrofit',
      generator: new RetrofitJavaRequestCodeGenerator(),
      escapedFragment: 'https://api.\\"example\\".com',
      rawFragment: 'https://api."example".com',
    },
    {
      name: 'kotlin/retrofit',
      generator: new RetrofitKotlinRequestCodeGenerator(),
      escapedFragment: 'https://api.\\"example\\".com',
      rawFragment: 'https://api."example".com',
    },
  ];

  test.each(cases)(
    '$name escapes double quotes in base URL literals derived from the OpenAPI server URL',
    ({ generator, escapedFragment, rawFragment }) => {
      const code = generator.generateCode(
        BASE_TEST_CONFIG.path,
        'GET',
        baseUrl,
        TEST_OPERATION,
        [],
        [],
        [],
        undefined,
        context
      );

      expect(code).toContain(escapedFragment);
      expect(code).not.toContain(rawFragment);
    }
  );
});
