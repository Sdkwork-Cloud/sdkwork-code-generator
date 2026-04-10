import { AxiosJavaScriptRequestCodeGenerator } from '../../../../src/openapi/generator/languages/javascript/axios';
import { RequestsPythonRequestCodeGenerator } from '../../../../src/openapi/generator/languages/python/requests';
import { NetHttpGoRequestCodeGenerator } from '../../../../src/openapi/generator/languages/go/net_http';
import { CurlShellRequestCodeGenerator } from '../../../../src/openapi/generator/languages/shell/curl';
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
  emptyStringIncludes: string[];
  falseJsonIncludes: string[];
};

describe('falsey request body preservation', () => {
  const cases: GeneratorCase[] = [
    {
      name: 'javascript/axios',
      generator: new AxiosJavaScriptRequestCodeGenerator(),
      emptyStringIncludes: ["'Content-Type': 'text/plain'", "data: ''"],
      falseJsonIncludes: ["'Content-Type': 'application/json'", 'data: false'],
    },
    {
      name: 'python/requests',
      generator: new RequestsPythonRequestCodeGenerator(),
      emptyStringIncludes: [
        "headers={'Content-Type': 'text/plain'}",
        "data=''",
      ],
      falseJsonIncludes: [
        "headers={'Content-Type': 'application/json'}",
        'json=False',
      ],
    },
    {
      name: 'go/net-http',
      generator: new NetHttpGoRequestCodeGenerator(),
      emptyStringIncludes: [
        'req.Header.Set("Content-Type", "text/plain")',
        'strings.NewReader(``)',
      ],
      falseJsonIncludes: [
        'req.Header.Set("Content-Type", "application/json")',
        'strings.NewReader(`false`)',
      ],
    },
    {
      name: 'shell/curl',
      generator: new CurlShellRequestCodeGenerator(),
      emptyStringIncludes: ['Content-Type: text/plain', "--data-raw ''"],
      falseJsonIncludes: [
        'Content-Type: application/json',
        "--data-raw 'false'",
      ],
    },
  ];

  test.each(cases)(
    '$name keeps an empty text request body instead of dropping it',
    ({ generator, emptyStringIncludes }) => {
      const context: CodeGenerateContext = {
        ...BASE_TEST_CONFIG.context,
        requestContentType: 'text/plain',
      };

      const code = generator.generateCode(
        BASE_TEST_CONFIG.path,
        'POST',
        BASE_TEST_CONFIG.baseUrl,
        POST_TEST_OPERATION,
        [],
        [],
        [],
        '',
        context
      );

      emptyStringIncludes.forEach((snippet) => expect(code).toContain(snippet));
    }
  );

  test.each(cases)(
    '$name keeps a boolean JSON request body instead of treating false as absent',
    ({ generator, falseJsonIncludes }) => {
      const context: CodeGenerateContext = {
        ...BASE_TEST_CONFIG.context,
        requestContentType: 'application/json',
        requestBodySchema: {
          type: 'boolean',
        },
      };

      const code = generator.generateCode(
        BASE_TEST_CONFIG.path,
        'POST',
        BASE_TEST_CONFIG.baseUrl,
        POST_TEST_OPERATION,
        [],
        [],
        [],
        false,
        context
      );

      falseJsonIncludes.forEach((snippet) => expect(code).toContain(snippet));
    }
  );
});
