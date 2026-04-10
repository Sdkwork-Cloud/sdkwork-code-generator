import { AlamofireSwiftRequestCodeGenerator } from '../../../../src/openapi/generator/languages/swift/alamofire';
import { UrlsessionSwiftRequestCodeGenerator } from '../../../../src/openapi/generator/languages/swift/urlsession';
import { CodeGenerateContext } from '../../../../src/types';
import { BASE_TEST_CONFIG, POST_TEST_OPERATION } from './test-data';

describe('swift query parameter encoding', () => {
  const context: CodeGenerateContext = {
    ...BASE_TEST_CONFIG.context,
  };

  test.each([
    {
      name: 'swift/urlsession',
      generator: new UrlsessionSwiftRequestCodeGenerator(),
    },
    {
      name: 'swift/alamofire',
      generator: new AlamofireSwiftRequestCodeGenerator(),
    },
  ])('$name uses a stricter allowed-character set for query values', ({ generator }) => {
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

    expect(code).toContain(
      '.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed.subtracting(CharacterSet(charactersIn: "&=?+")))'
    );
    expect(code).not.toContain(
      '.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed)!'
    );
  });
});
