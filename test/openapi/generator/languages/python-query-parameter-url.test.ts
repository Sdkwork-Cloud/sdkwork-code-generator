import { AiohttpPythonRequestCodeGenerator } from '../../../../src/openapi/generator/languages/python/aiohttp';
import { HttpxPythonRequestCodeGenerator } from '../../../../src/openapi/generator/languages/python/httpx';
import { BASE_TEST_CONFIG, TEST_OPERATION, TEST_QUERY_PARAMS } from './test-data';

describe('Python query parameter URL composition', () => {
  test('aiohttp appends query separators without duplicating the base URL', () => {
    const code = new AiohttpPythonRequestCodeGenerator().generateCode(
      BASE_TEST_CONFIG.path,
      'GET',
      BASE_TEST_CONFIG.baseUrl,
      TEST_OPERATION,
      [],
      [],
      TEST_QUERY_PARAMS,
      null,
      BASE_TEST_CONFIG.context
    );

    expect(code).toContain("url += ('?' if '?' not in url else '&') + 'limit='");
    expect(code).not.toContain("url += (url + '?' if '?' not in url else '&')");
  });

  test('httpx appends query separators without duplicating the base URL', () => {
    const code = new HttpxPythonRequestCodeGenerator().generateCode(
      BASE_TEST_CONFIG.path,
      'GET',
      BASE_TEST_CONFIG.baseUrl,
      TEST_OPERATION,
      [],
      [],
      TEST_QUERY_PARAMS,
      null,
      BASE_TEST_CONFIG.context
    );

    expect(code).toContain("url += ('?' if '?' not in url else '&') + 'limit='");
    expect(code).not.toContain("url += (url + '?' if '?' not in url else '&')");
  });
});
