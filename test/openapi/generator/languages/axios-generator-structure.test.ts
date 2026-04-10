import { AxiosJavaScriptRequestCodeGenerator } from '../../../../src/openapi/generator/languages/javascript/axios';
import { AxiosTypeScriptRequestCodeGenerator } from '../../../../src/openapi/generator/languages/typescript/axios';
import { ExampleOpenAPIParameter } from '../../../../src/types';
import { BASE_TEST_CONFIG, TEST_OPERATION } from './test-data';

describe('axios generator structure', () => {
  test('javascript/axios imports axios before using it', () => {
    const generator = new AxiosJavaScriptRequestCodeGenerator();
    const code = generator.generateCode(
      BASE_TEST_CONFIG.path,
      'GET',
      BASE_TEST_CONFIG.baseUrl,
      TEST_OPERATION,
      [],
      [],
      [],
      undefined,
      BASE_TEST_CONFIG.context
    );

    expect(code).toContain("const axios = require('axios');");
  });

  test('typescript/axios imports axios and returns the declared response wrapper shape', () => {
    const generator = new AxiosTypeScriptRequestCodeGenerator();
    const code = generator.generateCode(
      BASE_TEST_CONFIG.path,
      'GET',
      BASE_TEST_CONFIG.baseUrl,
      TEST_OPERATION,
      [],
      [],
      [],
      undefined,
      BASE_TEST_CONFIG.context
    );

    expect(code).toContain("import axios from 'axios';");
    expect(code).toContain('interface GetUsersResponse {');
    expect(code).toContain('statusText: string;');
    expect(code).toContain('return {');
    expect(code).toContain('data: response.data,');
    expect(code).toContain('status: response.status,');
    expect(code).toContain('statusText: response.statusText');
    expect(code).not.toContain('return response.data;');
  });

  test('javascript/axios relies on withCredentials instead of generating a Cookie header', () => {
    const generator = new AxiosJavaScriptRequestCodeGenerator();
    const cookies: ExampleOpenAPIParameter[] = [
      {
        name: 'session',
        in: 'cookie',
        required: false,
        schema: { type: 'string' },
        value: 'abc123',
      },
    ];
    const code = generator.generateCode(
      BASE_TEST_CONFIG.path,
      'GET',
      BASE_TEST_CONFIG.baseUrl,
      TEST_OPERATION,
      cookies,
      [],
      [],
      undefined,
      BASE_TEST_CONFIG.context
    );

    expect(code).toContain('withCredentials: true');
    expect(code).not.toContain("'Cookie': 'session=abc123'");
  });

  test('typescript/axios relies on withCredentials instead of generating a Cookie header', () => {
    const generator = new AxiosTypeScriptRequestCodeGenerator();
    const cookies: ExampleOpenAPIParameter[] = [
      {
        name: 'session',
        in: 'cookie',
        required: false,
        schema: { type: 'string' },
        value: 'abc123',
      },
    ];
    const code = generator.generateCode(
      BASE_TEST_CONFIG.path,
      'GET',
      BASE_TEST_CONFIG.baseUrl,
      TEST_OPERATION,
      cookies,
      [],
      [],
      undefined,
      BASE_TEST_CONFIG.context
    );

    expect(code).toContain('withCredentials: true');
    expect(code).not.toContain("'Cookie': 'session=abc123'");
  });
});
