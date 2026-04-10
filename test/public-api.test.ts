import * as publicApi from '../src';

describe('public package exports', () => {
  test('should expose the parser and factory APIs promised in the README', () => {
    const api = publicApi as Record<string, unknown>;

    expect(api.OpenAPIParser).toBeDefined();
    expect(api.CodeGeneratorFactory).toBeDefined();
  });
});
