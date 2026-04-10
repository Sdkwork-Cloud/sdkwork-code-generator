import { AxiosJavaScriptRequestCodeGenerator } from '../../../../src/openapi/generator/languages/javascript/axios';
import { FetchJavaScriptRequestCodeGenerator } from '../../../../src/openapi/generator/languages/javascript/fetch';
import { GotJavaScriptRequestCodeGenerator } from '../../../../src/openapi/generator/languages/javascript/got';
import { SuperagentJavaScriptRequestCodeGenerator } from '../../../../src/openapi/generator/languages/javascript/superagent';
import { AxiosTypeScriptRequestCodeGenerator } from '../../../../src/openapi/generator/languages/typescript/axios';
import { FetchTypeScriptRequestCodeGenerator } from '../../../../src/openapi/generator/languages/typescript/fetch';
import { GotTypeScriptRequestCodeGenerator } from '../../../../src/openapi/generator/languages/typescript/got';
import { SuperagentTypeScriptRequestCodeGenerator } from '../../../../src/openapi/generator/languages/typescript/superagent';
import { RequestsPythonRequestCodeGenerator } from '../../../../src/openapi/generator/languages/python/requests';
import { AiohttpPythonRequestCodeGenerator } from '../../../../src/openapi/generator/languages/python/aiohttp';
import { HttpxPythonRequestCodeGenerator } from '../../../../src/openapi/generator/languages/python/httpx';
import { HttpDartRequestCodeGenerator } from '../../../../src/openapi/generator/languages/dart/http';
import { DioDartRequestCodeGenerator } from '../../../../src/openapi/generator/languages/dart/dio';
import { CurlPhpRequestCodeGenerator } from '../../../../src/openapi/generator/languages/php/curl';
import {
  CodeGenerateContext,
  ExampleMultipartPart,
  ExampleOpenAPIParameter,
  HttpMethod,
  OpenAPIOperation,
} from '../../../../src/types';
import { BASE_TEST_CONFIG } from './test-data';

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
  expectedFieldName: string;
  expectedFilename: string;
};

const MULTIPART_OPERATION: OpenAPIOperation = {
  operationId: 'uploadAvatar',
  summary: 'Upload avatar',
  description: 'Uploads multipart form data',
  requestBody: {
    required: true,
    content: {
      'multipart/form-data': {
        schema: {
          type: 'object',
          properties: {
            "display'name": { type: 'string' },
            "avatar'file": { type: 'string', format: 'binary' },
          },
        },
      },
    },
  },
  responses: {
    '200': {
      description: 'ok',
    },
  },
};

describe('single-quoted multipart literal escaping', () => {
  const requestBody: ExampleMultipartPart[] = [
    {
      kind: 'field',
      name: "display'name",
      value: 'Jane Doe',
    },
    {
      kind: 'file',
      name: "avatar'file",
      value: 'example file contents',
      filename: "avatar'file.png",
      contentType: 'image/png',
    },
  ];
  const context: CodeGenerateContext = {
    ...BASE_TEST_CONFIG.context,
    requestContentType: 'multipart/form-data',
  };
  const rawFieldLiteral = "'display'name'";
  const rawFilenameLiteral = "'avatar'file.png'";

  const cases: GeneratorCase[] = [
    {
      name: 'javascript/axios',
      generator: new AxiosJavaScriptRequestCodeGenerator(),
      expectedFieldName: "display\\'name",
      expectedFilename: "avatar\\'file.png",
    },
    {
      name: 'javascript/fetch',
      generator: new FetchJavaScriptRequestCodeGenerator(),
      expectedFieldName: "display\\'name",
      expectedFilename: "avatar\\'file.png",
    },
    {
      name: 'javascript/got',
      generator: new GotJavaScriptRequestCodeGenerator(),
      expectedFieldName: "display\\'name",
      expectedFilename: "avatar\\'file.png",
    },
    {
      name: 'javascript/superagent',
      generator: new SuperagentJavaScriptRequestCodeGenerator(),
      expectedFieldName: "display\\'name",
      expectedFilename: "avatar\\'file.png",
    },
    {
      name: 'typescript/axios',
      generator: new AxiosTypeScriptRequestCodeGenerator(),
      expectedFieldName: "display\\'name",
      expectedFilename: "avatar\\'file.png",
    },
    {
      name: 'typescript/fetch',
      generator: new FetchTypeScriptRequestCodeGenerator(),
      expectedFieldName: "display\\'name",
      expectedFilename: "avatar\\'file.png",
    },
    {
      name: 'typescript/got',
      generator: new GotTypeScriptRequestCodeGenerator(),
      expectedFieldName: "display\\'name",
      expectedFilename: "avatar\\'file.png",
    },
    {
      name: 'typescript/superagent',
      generator: new SuperagentTypeScriptRequestCodeGenerator(),
      expectedFieldName: "display\\'name",
      expectedFilename: "avatar\\'file.png",
    },
    {
      name: 'python/requests',
      generator: new RequestsPythonRequestCodeGenerator(),
      expectedFieldName: "display\\'name",
      expectedFilename: "avatar\\'file.png",
    },
    {
      name: 'python/aiohttp',
      generator: new AiohttpPythonRequestCodeGenerator(),
      expectedFieldName: "display\\'name",
      expectedFilename: "avatar\\'file.png",
    },
    {
      name: 'python/httpx',
      generator: new HttpxPythonRequestCodeGenerator(),
      expectedFieldName: "display\\'name",
      expectedFilename: "avatar\\'file.png",
    },
    {
      name: 'dart/http',
      generator: new HttpDartRequestCodeGenerator(),
      expectedFieldName: "display\\'name",
      expectedFilename: "avatar\\'file.png",
    },
    {
      name: 'dart/dio',
      generator: new DioDartRequestCodeGenerator(),
      expectedFieldName: "display\\'name",
      expectedFilename: "avatar\\'file.png",
    },
    {
      name: 'php/curl',
      generator: new CurlPhpRequestCodeGenerator(),
      expectedFieldName: "display\\'name",
      expectedFilename: "avatar\\'file.png",
    },
  ];

  test.each(cases)(
    '$name escapes apostrophes in multipart field names and filenames embedded in single-quoted literals',
    ({ generator, expectedFieldName, expectedFilename }) => {
      const code = generator.generateCode(
        '/users/avatar',
        'POST',
        BASE_TEST_CONFIG.baseUrl,
        MULTIPART_OPERATION,
        [],
        [],
        [],
        requestBody,
        context
      );

      expect(code).toContain(expectedFieldName);
      expect(code).toContain(expectedFilename);
      expect(code).not.toContain(rawFieldLiteral);
      expect(code).not.toContain(rawFilenameLiteral);
    }
  );
});
