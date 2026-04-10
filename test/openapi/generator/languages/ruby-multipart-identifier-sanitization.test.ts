import { FaradayRubyRequestCodeGenerator } from '../../../../src/openapi/generator/languages/ruby/faraday';
import { HttpartyRubyRequestCodeGenerator } from '../../../../src/openapi/generator/languages/ruby/httparty';
import {
  CodeGenerateContext,
  ExampleMultipartPart,
  OpenAPIOperation,
} from '../../../../src/types';

const MULTIPART_IDENTIFIER_OPERATION: OpenAPIOperation = {
  operationId: 'uploadAvatar',
  summary: 'Upload avatar',
  description: 'Uploads multipart form data with non-identifier field names',
  requestBody: {
    required: true,
    content: {
      'multipart/form-data': {
        schema: {
          type: 'object',
          properties: {
            'display-name': { type: 'string' },
            'profile-image': {
              type: 'string',
              format: 'binary',
            },
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

const MULTIPART_IDENTIFIER_CONTEXT: CodeGenerateContext = {
  baseUrl: 'https://api.example.com',
  language: 'ruby',
  library: 'faraday',
  openAPISpec: {
    openapi: '3.0.0',
    info: {
      title: 'Ruby Multipart Identifier API',
      version: '1.0.0',
    },
    paths: {},
  },
  requestContentType: 'multipart/form-data',
  requestBodySchema: {
    type: 'object',
    properties: {
      'display-name': { type: 'string' },
      'profile-image': {
        type: 'string',
        format: 'binary',
      },
    },
  },
  responseStatusCode: '200',
};

const MULTIPART_IDENTIFIER_BODY: ExampleMultipartPart[] = [
  {
    kind: 'field',
    name: 'display-name',
    value: 'Jane Doe',
  },
  {
    kind: 'file',
    name: 'profile-image',
    value: 'example image contents',
    filename: 'avatar.png',
    contentType: 'image/png',
  },
];

describe('ruby multipart identifier sanitization', () => {
  test('uses quoted hash keys for non-identifier multipart fields in faraday', () => {
    const code = new FaradayRubyRequestCodeGenerator().generateCode(
      '/users/avatar',
      'POST',
      'https://api.example.com',
      MULTIPART_IDENTIFIER_OPERATION,
      [],
      [],
      [],
      MULTIPART_IDENTIFIER_BODY,
      MULTIPART_IDENTIFIER_CONTEXT
    );

    expect(code).toContain("'display-name' => 'Jane Doe'");
    expect(code).toContain(
      "'profile-image' => Faraday::Multipart::FilePart.new('avatar.png', 'image/png')"
    );
    expect(code).not.toContain('display-name:');
    expect(code).not.toContain('profile-image:');
  });

  test('uses quoted hash keys for non-identifier multipart fields in httparty', () => {
    const code = new HttpartyRubyRequestCodeGenerator().generateCode(
      '/users/avatar',
      'POST',
      'https://api.example.com',
      MULTIPART_IDENTIFIER_OPERATION,
      [],
      [],
      [],
      MULTIPART_IDENTIFIER_BODY,
      MULTIPART_IDENTIFIER_CONTEXT
    );

    expect(code).toContain("'display-name' => 'Jane Doe'");
    expect(code).toContain("'profile-image' => File.open('avatar.png')");
    expect(code).not.toContain('display-name:');
    expect(code).not.toContain('profile-image:');
  });
});
