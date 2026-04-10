import { CpprestCppRequestCodeGenerator } from '../../../../src/openapi/generator/languages/cpp/cpprest';
import { CppHttplibCppRequestCodeGenerator } from '../../../../src/openapi/generator/languages/cpp/cpp-httplib';
import { BoostBeastCppRequestCodeGenerator } from '../../../../src/openapi/generator/languages/cpp/boost-beast';
import { OkHttpJavaRequestCodeGenerator } from '../../../../src/openapi/generator/languages/java/okhttp';
import { OkHttpKotlinRequestCodeGenerator } from '../../../../src/openapi/generator/languages/kotlin/okhttp';
import { ReqwestRustRequestCodeGenerator } from '../../../../src/openapi/generator/languages/rust/reqwest';
import { UrlsessionSwiftRequestCodeGenerator } from '../../../../src/openapi/generator/languages/swift/urlsession';
import {
  CodeGenerateContext,
  ExampleOpenAPIParameter,
  HttpMethod,
  OpenAPIOperation,
} from '../../../../src/types';
import { BASE_TEST_CONFIG, POST_TEST_OPERATION } from './test-data';

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

describe('double-quoted string literal escaping', () => {
  const requestBody = 'line 1\nline "2"';
  const escapedBody = '"line 1\\nline \\"2\\""';
  const unescapedBody = '"line 1\nline \\"2\\""';
  const context: CodeGenerateContext = {
    ...BASE_TEST_CONFIG.context,
    requestContentType: 'text/plain',
  };

  const cases: GeneratorCase[] = [
    { name: 'cpp/cpprest', generator: new CpprestCppRequestCodeGenerator() },
    { name: 'cpp/cpp-httplib', generator: new CppHttplibCppRequestCodeGenerator() },
    { name: 'cpp/boost-beast', generator: new BoostBeastCppRequestCodeGenerator() },
    { name: 'java/okhttp', generator: new OkHttpJavaRequestCodeGenerator() },
    { name: 'kotlin/okhttp', generator: new OkHttpKotlinRequestCodeGenerator() },
    { name: 'rust/reqwest', generator: new ReqwestRustRequestCodeGenerator() },
    { name: 'swift/urlsession', generator: new UrlsessionSwiftRequestCodeGenerator() },
  ];

  test.each(cases)(
    '$name escapes multiline text request bodies inside quoted literals',
    ({ generator }) => {
      const code = generator.generateCode(
        BASE_TEST_CONFIG.path,
        'POST',
        BASE_TEST_CONFIG.baseUrl,
        POST_TEST_OPERATION,
        [],
        [],
        [],
        requestBody,
        context
      );

      expect(code).toContain(escapedBody);
      expect(code).not.toContain(unescapedBody);
    }
  );
});
