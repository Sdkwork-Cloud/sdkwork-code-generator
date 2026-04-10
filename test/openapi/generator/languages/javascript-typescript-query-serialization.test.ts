import { AxiosJavaScriptRequestCodeGenerator } from '../../../../src/openapi/generator/languages/javascript/axios';
import { FetchJavaScriptRequestCodeGenerator } from '../../../../src/openapi/generator/languages/javascript/fetch';
import { GotJavaScriptRequestCodeGenerator } from '../../../../src/openapi/generator/languages/javascript/got';
import { SuperagentJavaScriptRequestCodeGenerator } from '../../../../src/openapi/generator/languages/javascript/superagent';
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
  includes: string[];
  excludes: string[];
};

describe('javascript/typescript query parameter serialization', () => {
  const queryParams: ExampleOpenAPIParameter[] = [
    {
      name: 'tags',
      in: 'query',
      required: false,
      schema: {
        type: 'array',
        items: { type: 'string' },
      },
      value: ['red', 'blue green'],
    },
    {
      name: 'filter',
      in: 'query',
      required: false,
      schema: {
        type: 'object',
        properties: {
          role: { type: 'string' },
          name: { type: 'string' },
        },
      },
      value: {
        role: 'admin',
        name: 'Alex Smith',
      },
    },
  ];
  const sharedIncludes = [
    'const queryParams = new URLSearchParams();',
    "queryParams.append('tags', 'red');",
    "queryParams.append('tags', 'blue green');",
    "queryParams.append('role', 'admin');",
    "queryParams.append('name', 'Alex Smith');",
  ];
  const context: CodeGenerateContext = {
    ...BASE_TEST_CONFIG.context,
  };

  const cases: GeneratorCase[] = [
    {
      name: 'javascript/axios',
      generator: new AxiosJavaScriptRequestCodeGenerator(),
      includes: [...sharedIncludes, 'params: queryParams'],
      excludes: ["'tags': 'red,blue green'", "'filter': '[object Object]'"],
    },
    {
      name: 'typescript/axios',
      generator: new AxiosTypeScriptRequestCodeGenerator(),
      includes: [...sharedIncludes, 'params: queryParams'],
      excludes: ["'tags': 'red,blue green'", "'filter': '[object Object]'"],
    },
    {
      name: 'javascript/fetch',
      generator: new FetchJavaScriptRequestCodeGenerator(),
      includes: [
        ...sharedIncludes,
        'const queryString = queryParams.toString();',
        "url += (url.includes('?') ? '&' : '?') + queryString;",
      ],
      excludes: [
        "encodeURIComponent('red,blue green')",
        "encodeURIComponent('[object Object]')",
      ],
    },
    {
      name: 'typescript/fetch',
      generator: new FetchTypeScriptRequestCodeGenerator(),
      includes: [
        ...sharedIncludes,
        'const queryString = queryParams.toString();',
        "url += (url.includes('?') ? '&' : '?') + queryString;",
      ],
      excludes: [
        "encodeURIComponent('red,blue green')",
        "encodeURIComponent('[object Object]')",
      ],
    },
    {
      name: 'javascript/got',
      generator: new GotJavaScriptRequestCodeGenerator(),
      includes: [
        ...sharedIncludes,
        'const queryString = queryParams.toString();',
        "url += (url.includes('?') ? '&' : '?') + queryString;",
      ],
      excludes: [
        "encodeURIComponent('red,blue green')",
        "encodeURIComponent('[object Object]')",
      ],
    },
    {
      name: 'typescript/got',
      generator: new GotTypeScriptRequestCodeGenerator(),
      includes: [
        ...sharedIncludes,
        'const queryString = queryParams.toString();',
        "url += (url.includes('?') ? '&' : '?') + queryString;",
      ],
      excludes: [
        "encodeURIComponent('red,blue green')",
        "encodeURIComponent('[object Object]')",
      ],
    },
    {
      name: 'javascript/superagent',
      generator: new SuperagentJavaScriptRequestCodeGenerator(),
      includes: [
        ...sharedIncludes,
        'const queryString = queryParams.toString();',
        "url += (url.includes('?') ? '&' : '?') + queryString;",
      ],
      excludes: [
        "encodeURIComponent('red,blue green')",
        "encodeURIComponent('[object Object]')",
      ],
    },
    {
      name: 'typescript/superagent',
      generator: new SuperagentTypeScriptRequestCodeGenerator(),
      includes: [
        ...sharedIncludes,
        'const queryString = queryParams.toString();',
        "url += (url.includes('?') ? '&' : '?') + queryString;",
      ],
      excludes: [
        "encodeURIComponent('red,blue green')",
        "encodeURIComponent('[object Object]')",
      ],
    },
  ];

  test.each(cases)(
    '$name expands array and object query parameters using form-style defaults',
    ({ generator, includes, excludes }) => {
      const code = generator.generateCode(
        BASE_TEST_CONFIG.path,
        'GET',
        BASE_TEST_CONFIG.baseUrl,
        TEST_OPERATION,
        [],
        [],
        queryParams,
        undefined,
        context
      );

      includes.forEach((snippet) => expect(code).toContain(snippet));
      excludes.forEach((snippet) => expect(code).not.toContain(snippet));
    }
  );
});
