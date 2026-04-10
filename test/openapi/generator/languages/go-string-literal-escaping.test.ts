import { NetHttpGoRequestCodeGenerator } from '../../../../src/openapi/generator/languages/go/net_http';
import { RestyGoRequestCodeGenerator } from '../../../../src/openapi/generator/languages/go/resty';
import { FasthttpGoRequestCodeGenerator } from '../../../../src/openapi/generator/languages/go/fasthttp';
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
  expected: string;
};

describe('go string literal escaping', () => {
  const queryParams: ExampleOpenAPIParameter[] = [
    {
      name: 'note',
      in: 'query',
      required: false,
      schema: { type: 'string' },
      value: 'line 1\nline "2"',
    },
  ];
  const escapedValue = 'line 1\\nline \\"2\\"';
  const rawValue = 'line 1\nline \\"2\\"';
  const context: CodeGenerateContext = {
    ...BASE_TEST_CONFIG.context,
  };

  const cases: GeneratorCase[] = [
    {
      name: 'go/net-http',
      generator: new NetHttpGoRequestCodeGenerator(),
      expected: `q.Add("note", "${escapedValue}")`,
    },
    {
      name: 'go/resty',
      generator: new RestyGoRequestCodeGenerator(),
      expected: `q.Add("note", "${escapedValue}")`,
    },
    {
      name: 'go/fasthttp',
      generator: new FasthttpGoRequestCodeGenerator(),
      expected: `neturl.QueryEscape("${escapedValue}")`,
    },
  ];

  test.each(cases)(
    '$name escapes multiline query parameter values inside Go string literals',
    ({ generator, expected }) => {
      const code = generator.generateCode(
        BASE_TEST_CONFIG.path,
        'GET',
        BASE_TEST_CONFIG.baseUrl,
        POST_TEST_OPERATION,
        [],
        [],
        queryParams,
        undefined,
        context
      );

      expect(code).toContain(expected);
      expect(code).not.toContain(rawValue);
    }
  );
});
