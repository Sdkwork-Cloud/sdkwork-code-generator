import { RefitCsharpRequestCodeGenerator } from '../../../../src/openapi/generator/languages/csharp/refit';
import { RetrofitJavaRequestCodeGenerator } from '../../../../src/openapi/generator/languages/java/retrofit';
import { RetrofitKotlinRequestCodeGenerator } from '../../../../src/openapi/generator/languages/kotlin/retrofit';
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
  expectedFileFieldName?: string;
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

describe('double-quoted multipart annotation escaping', () => {
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
  const rawFieldLiteral = '"display"name"';
  const rawFileFieldLiteral = '"avatar"file"';

  const cases: GeneratorCase[] = [
    {
      name: 'csharp/refit',
      generator: new RefitCsharpRequestCodeGenerator(),
      expectedFieldName: 'display\\"name',
      expectedFileFieldName: 'avatar\\"file',
    },
    {
      name: 'java/retrofit',
      generator: new RetrofitJavaRequestCodeGenerator(),
      expectedFieldName: 'display\\"name',
    },
    {
      name: 'kotlin/retrofit',
      generator: new RetrofitKotlinRequestCodeGenerator(),
      expectedFieldName: 'display\\"name',
    },
  ];

  test.each(cases)(
    '$name escapes quotes in multipart annotation literals',
    ({ generator, expectedFieldName, expectedFileFieldName }) => {
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
      if (expectedFileFieldName) {
        expect(code).toContain(expectedFileFieldName);
      }
      expect(code).not.toContain(rawFieldLiteral);
      expect(code).not.toContain(rawFileFieldLiteral);
    }
  );
});
