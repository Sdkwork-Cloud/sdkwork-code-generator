import { AxiosJavaScriptRequestCodeGenerator } from '../../../../src/openapi/generator/languages/javascript/axios';
import { FetchJavaScriptRequestCodeGenerator } from '../../../../src/openapi/generator/languages/javascript/fetch';
import { GotJavaScriptRequestCodeGenerator } from '../../../../src/openapi/generator/languages/javascript/got';
import { SuperagentJavaScriptRequestCodeGenerator } from '../../../../src/openapi/generator/languages/javascript/superagent';
import { RequestsPythonRequestCodeGenerator } from '../../../../src/openapi/generator/languages/python/requests';
import { AiohttpPythonRequestCodeGenerator } from '../../../../src/openapi/generator/languages/python/aiohttp';
import { HttpxPythonRequestCodeGenerator } from '../../../../src/openapi/generator/languages/python/httpx';
import { AxiosTypeScriptRequestCodeGenerator } from '../../../../src/openapi/generator/languages/typescript/axios';
import { FetchTypeScriptRequestCodeGenerator } from '../../../../src/openapi/generator/languages/typescript/fetch';
import { GotTypeScriptRequestCodeGenerator } from '../../../../src/openapi/generator/languages/typescript/got';
import { SuperagentTypeScriptRequestCodeGenerator } from '../../../../src/openapi/generator/languages/typescript/superagent';
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
};

describe('single-quoted header name escaping', () => {
  const headers: ExampleOpenAPIParameter[] = [
    {
      name: "X-Client's-Trace",
      in: 'header',
      required: false,
      schema: { type: 'string' },
      value: 'trace-token',
    },
  ];
  const context: CodeGenerateContext = {
    ...BASE_TEST_CONFIG.context,
  };
  const escapedHeaderName = "X-Client\\'s-Trace";
  const unescapedHeaderName = "X-Client's-Trace";

  const cases: GeneratorCase[] = [
    { name: 'javascript/axios', generator: new AxiosJavaScriptRequestCodeGenerator() },
    { name: 'javascript/fetch', generator: new FetchJavaScriptRequestCodeGenerator() },
    { name: 'javascript/got', generator: new GotJavaScriptRequestCodeGenerator() },
    {
      name: 'javascript/superagent',
      generator: new SuperagentJavaScriptRequestCodeGenerator(),
    },
    { name: 'typescript/axios', generator: new AxiosTypeScriptRequestCodeGenerator() },
    { name: 'typescript/fetch', generator: new FetchTypeScriptRequestCodeGenerator() },
    { name: 'typescript/got', generator: new GotTypeScriptRequestCodeGenerator() },
    {
      name: 'typescript/superagent',
      generator: new SuperagentTypeScriptRequestCodeGenerator(),
    },
    { name: 'python/requests', generator: new RequestsPythonRequestCodeGenerator() },
    { name: 'python/aiohttp', generator: new AiohttpPythonRequestCodeGenerator() },
    { name: 'python/httpx', generator: new HttpxPythonRequestCodeGenerator() },
  ];

  test.each(cases)(
    '$name escapes apostrophes in header names embedded in single-quoted literals',
    ({ generator }) => {
      const code = generator.generateCode(
        BASE_TEST_CONFIG.path,
        'GET',
        BASE_TEST_CONFIG.baseUrl,
        TEST_OPERATION,
        [],
        headers,
        [],
        undefined,
        context
      );

      expect(code).toContain(escapedHeaderName);
      expect(code).not.toContain(`'${unescapedHeaderName}': 'trace-token'`);
      expect(code).not.toContain(`set('${unescapedHeaderName}', 'trace-token')`);
    }
  );
});
