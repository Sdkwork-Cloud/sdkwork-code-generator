import { CppHttplibCppRequestCodeGenerator } from '../../../../src/openapi/generator/languages/cpp/cpp-httplib';
import { CodeGenerateContext } from '../../../../src/types';
import { BASE_TEST_CONFIG, POST_TEST_OPERATION } from './test-data';

describe('cpp/cpp-httplib query parameter encoding', () => {
  test('encodes query parameter values instead of concatenating raw values', () => {
    const generator = new CppHttplibCppRequestCodeGenerator();
    const context: CodeGenerateContext = {
      ...BASE_TEST_CONFIG.context,
    };

    const code = generator.generateCode(
      BASE_TEST_CONFIG.path,
      'GET',
      BASE_TEST_CONFIG.baseUrl,
      POST_TEST_OPERATION,
      [],
      [],
      [
        {
          name: 'redirect',
          in: 'query',
          required: false,
          schema: { type: 'string' },
          value: 'a b&c=/',
        },
      ],
      undefined,
      context
    );

    expect(code).toContain('std::string urlEncode(const std::string& value)');
    expect(code).toContain('path += (path.find(\'?\') != std::string::npos ? "&" : "?") + "redirect=" + urlEncode("a b&c=/");');
    expect(code).not.toContain('path += (path.find(\'?\') != std::string::npos ? "&" : "?") + "redirect=" + "a b&c=/";');
  });
});
