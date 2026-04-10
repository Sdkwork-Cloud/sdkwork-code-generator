import { FaradayRubyRequestCodeGenerator } from '../../../../src/openapi/generator/languages/ruby/faraday';
import { BASE_TEST_CONFIG, TEST_OPERATION } from './test-data';

describe('single-quoted path literal escaping', () => {
  test('ruby/faraday escapes single quotes in path literals derived from the request path', () => {
    const code = new FaradayRubyRequestCodeGenerator().generateCode(
      "/users/o'reilly",
      'GET',
      BASE_TEST_CONFIG.baseUrl,
      TEST_OPERATION,
      [],
      [],
      [],
      undefined,
      BASE_TEST_CONFIG.context
    );

    expect(code).toContain("/users/o\\'reilly");
    expect(code).not.toContain("/users/o'reilly");
  });
});
