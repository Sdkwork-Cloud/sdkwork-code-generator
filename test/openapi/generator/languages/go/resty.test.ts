import { RestyGoRequestCodeGenerator } from '../../../../../src/openapi/generator/languages/go/resty';
import {
  BASE_TEST_CONFIG,
  POST_TEST_OPERATION,
  TEST_QUERY_PARAMS,
  TEST_REQUEST_BODY,
} from '../test-data';

describe('Go resty Generator', () => {
  let generator: RestyGoRequestCodeGenerator;

  beforeEach(() => {
    generator = new RestyGoRequestCodeGenerator();
  });

  test('declares the request before building encoded query params', () => {
    const code = generator.generateCode(
      BASE_TEST_CONFIG.path,
      'POST',
      BASE_TEST_CONFIG.baseUrl,
      POST_TEST_OPERATION,
      [],
      [],
      TEST_QUERY_PARAMS,
      TEST_REQUEST_BODY,
      BASE_TEST_CONFIG.context
    );

    expect(code).toContain('req := client.R()');
    expect(code).toContain('q := neturl.Values{}');
    expect(code).toContain('q.Add("limit", "10")');
    expect(code.indexOf('req := client.R()')).toBeLessThan(
      code.indexOf('q.Add("limit", "10")')
    );
  });

  test('uses exported resty verb methods instead of all-caps identifiers', () => {
    const code = generator.generateCode(
      BASE_TEST_CONFIG.path,
      'POST',
      BASE_TEST_CONFIG.baseUrl,
      POST_TEST_OPERATION,
      [],
      [],
      [],
      TEST_REQUEST_BODY,
      BASE_TEST_CONFIG.context
    );

    expect(code).toContain('resp, err := req.Post(url)');
    expect(code).not.toContain('resp, err := req.POST(url)');
  });
});
