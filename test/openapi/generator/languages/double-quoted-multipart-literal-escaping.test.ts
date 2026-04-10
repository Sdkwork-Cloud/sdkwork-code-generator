import { HttpClientCSharpRequestCodeGenerator } from '../../../../src/openapi/generator/languages/csharp/httpclient';
import { RestsharpCsharpRequestCodeGenerator } from '../../../../src/openapi/generator/languages/csharp/restsharp';
import { FasthttpGoRequestCodeGenerator } from '../../../../src/openapi/generator/languages/go/fasthttp';
import { NetHttpGoRequestCodeGenerator } from '../../../../src/openapi/generator/languages/go/net_http';
import { RestyGoRequestCodeGenerator } from '../../../../src/openapi/generator/languages/go/resty';
import { ApacheHttpClientJavaRequestCodeGenerator } from '../../../../src/openapi/generator/languages/java/apache_httpclient';
import { OkHttpJavaRequestCodeGenerator } from '../../../../src/openapi/generator/languages/java/okhttp';
import { UnirestJavaRequestCodeGenerator } from '../../../../src/openapi/generator/languages/java/unirest';
import { OkHttpKotlinRequestCodeGenerator } from '../../../../src/openapi/generator/languages/kotlin/okhttp';
import { ReqwestRustRequestCodeGenerator } from '../../../../src/openapi/generator/languages/rust/reqwest';
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
            'display"name': { type: 'string' },
            'avatar"file': { type: 'string', format: 'binary' },
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

describe('double-quoted multipart literal escaping', () => {
  const requestBody: ExampleMultipartPart[] = [
    {
      kind: 'field',
      name: 'display"name',
      value: 'Jane Doe',
    },
    {
      kind: 'file',
      name: 'avatar"file',
      value: 'example file contents',
      filename: 'avatar"file.png',
      contentType: 'image/png',
    },
  ];
  const context: CodeGenerateContext = {
    ...BASE_TEST_CONFIG.context,
    requestContentType: 'multipart/form-data',
  };
  const expectedFieldName = 'display\\"name';
  const expectedFilename = 'avatar\\"file.png';
  const rawFieldLiteral = '"display"name"';
  const rawFilenameLiteral = '"avatar"file.png"';

  const cases: GeneratorCase[] = [
    {
      name: 'csharp/httpclient',
      generator: new HttpClientCSharpRequestCodeGenerator(),
    },
    {
      name: 'csharp/restsharp',
      generator: new RestsharpCsharpRequestCodeGenerator(),
    },
    { name: 'go/fasthttp', generator: new FasthttpGoRequestCodeGenerator() },
    { name: 'go/net_http', generator: new NetHttpGoRequestCodeGenerator() },
    { name: 'go/resty', generator: new RestyGoRequestCodeGenerator() },
    {
      name: 'java/apache_httpclient',
      generator: new ApacheHttpClientJavaRequestCodeGenerator(),
    },
    { name: 'java/okhttp', generator: new OkHttpJavaRequestCodeGenerator() },
    { name: 'java/unirest', generator: new UnirestJavaRequestCodeGenerator() },
    {
      name: 'kotlin/okhttp',
      generator: new OkHttpKotlinRequestCodeGenerator(),
    },
    { name: 'rust/reqwest', generator: new ReqwestRustRequestCodeGenerator() },
  ];

  test.each(cases)(
    '$name escapes quotes in multipart field names and filenames embedded in double-quoted literals',
    ({ generator }) => {
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
