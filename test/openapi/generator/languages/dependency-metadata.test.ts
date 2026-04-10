import { CodeGeneratorFactory } from '../../../../src/openapi/generator/factory';
import {
  ApiRequestDefinition,
  CodeGenerateContext,
  Language,
} from '../../../../src/types';
import {
  BASE_TEST_CONFIG,
  POST_TEST_OPERATION,
  TEST_OPERATION,
} from './test-data';

const GET_REQUEST_DEFINITION: ApiRequestDefinition = {
  path: BASE_TEST_CONFIG.path,
  method: 'GET',
  operation: TEST_OPERATION,
  pathItem: {},
};

const POST_REQUEST_DEFINITION: ApiRequestDefinition = {
  path: BASE_TEST_CONFIG.path,
  method: 'POST',
  operation: POST_TEST_OPERATION,
  pathItem: {},
};

function createContext(
  language: Language,
  library: string
): CodeGenerateContext {
  return {
    ...BASE_TEST_CONFIG.context,
    language,
    library,
  };
}

describe('generated dependency metadata', () => {
  test('javascript/axios returns latest npm dependency metadata', () => {
    const result = CodeGeneratorFactory.generate(
      POST_REQUEST_DEFINITION,
      createContext('javascript', 'axios')
    );

    expect(result.dependencies).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'axios',
          packageManager: 'npm',
          version: '1.11.0',
          installation: 'npm install axios@1.11.0',
        }),
      ])
    );
  });

  test('javascript/fetch reports a built-in runtime dependency', () => {
    const result = CodeGeneratorFactory.generate(
      GET_REQUEST_DEFINITION,
      createContext('javascript', 'fetch')
    );

    expect(result.dependencies).toEqual([
      expect.objectContaining({
        name: 'fetch',
        packageManager: 'builtin',
        builtin: true,
      }),
    ]);
  });

  test('javascript/got emits ESM-compatible code for latest got', () => {
    const result = CodeGeneratorFactory.generate(
      POST_REQUEST_DEFINITION,
      createContext('javascript', 'got')
    );

    expect(result.dependencies).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'got',
          packageManager: 'npm',
          version: '14.4.7',
          installation: 'npm install got@14.4.7',
        }),
      ])
    );
    expect(result.code).toContain(
      "const { default: got } = await import('got');"
    );
    expect(result.code).not.toContain("const got = require('got');");
  });

  test('java/retrofit includes all required runtime libraries', () => {
    const result = CodeGeneratorFactory.generate(
      POST_REQUEST_DEFINITION,
      createContext('java', 'retrofit')
    );

    expect(result.dependencies).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'com.squareup.retrofit2:retrofit',
          packageManager: 'gradle',
          version: '3.0.0',
        }),
        expect.objectContaining({
          name: 'com.squareup.retrofit2:converter-gson',
          packageManager: 'gradle',
          version: '3.0.0',
        }),
        expect.objectContaining({
          name: 'com.squareup.retrofit2:converter-scalars',
          packageManager: 'gradle',
          version: '3.0.0',
        }),
        expect.objectContaining({
          name: 'com.squareup.okhttp3:okhttp',
          packageManager: 'gradle',
          version: '5.3.2',
        }),
        expect.objectContaining({
          name: 'com.google.code.gson:gson',
          packageManager: 'gradle',
          version: '2.13.2',
        }),
      ])
    );
  });

  test('csharp/restsharp includes JSON support package metadata', () => {
    const result = CodeGeneratorFactory.generate(
      POST_REQUEST_DEFINITION,
      createContext('csharp', 'restsharp')
    );

    expect(result.dependencies).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'RestSharp',
          packageManager: 'nuget',
          version: '114.0.0',
        }),
        expect.objectContaining({
          name: 'Newtonsoft.Json',
          packageManager: 'nuget',
          version: '13.0.4',
        }),
      ])
    );
  });

  test('rust/reqwest includes async runtime and json helpers', () => {
    const result = CodeGeneratorFactory.generate(
      POST_REQUEST_DEFINITION,
      createContext('rust', 'reqwest')
    );

    expect(result.dependencies).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'reqwest',
          packageManager: 'cargo',
          version: '0.13.2',
        }),
        expect.objectContaining({
          name: 'tokio',
          packageManager: 'cargo',
          version: '1.50.0',
        }),
        expect.objectContaining({
          name: 'serde_json',
          packageManager: 'cargo',
          version: '1.0.149',
        }),
      ])
    );
  });
});
