import { AiohttpPythonRequestCodeGenerator } from '../../../../src/openapi/generator/languages/python/aiohttp';
import { HttpxPythonRequestCodeGenerator } from '../../../../src/openapi/generator/languages/python/httpx';
import { RequestsPythonRequestCodeGenerator } from '../../../../src/openapi/generator/languages/python/requests';
import { CodeGenerateContext } from '../../../../src/types';
import { BASE_TEST_CONFIG, POST_TEST_OPERATION } from './test-data';

const PYTHON_JSON_BODY = {
  enabled: true,
  archived: false,
  nickname: null,
  profile: {
    verified: true,
    alias: null,
  },
};

const PYTHON_JSON_CONTEXT: CodeGenerateContext = {
  ...BASE_TEST_CONFIG.context,
  requestContentType: 'application/json',
  requestBodySchema: {
    type: 'object',
  },
};

describe('Python JSON request body syntax', () => {
  test('requests emits Python booleans and None in json payloads', () => {
    const code = new RequestsPythonRequestCodeGenerator().generateCode(
      BASE_TEST_CONFIG.path,
      'POST',
      BASE_TEST_CONFIG.baseUrl,
      POST_TEST_OPERATION,
      [],
      [],
      [],
      PYTHON_JSON_BODY,
      PYTHON_JSON_CONTEXT
    );

    expect(code).toContain('json={');
    expect(code).toContain('"enabled": True');
    expect(code).toContain('"archived": False');
    expect(code).toContain('"nickname": None');
    expect(code).not.toContain('"enabled": true');
    expect(code).not.toContain('"archived": false');
    expect(code).not.toContain('"nickname": null');
  });

  test('aiohttp emits Python booleans and None before json.dumps', () => {
    const code = new AiohttpPythonRequestCodeGenerator().generateCode(
      BASE_TEST_CONFIG.path,
      'POST',
      BASE_TEST_CONFIG.baseUrl,
      POST_TEST_OPERATION,
      [],
      [],
      [],
      PYTHON_JSON_BODY,
      PYTHON_JSON_CONTEXT
    );

    expect(code).toContain('data = json.dumps({');
    expect(code).toContain('"enabled": True');
    expect(code).toContain('"archived": False');
    expect(code).toContain('"nickname": None');
    expect(code).not.toContain('"enabled": true');
    expect(code).not.toContain('"archived": false');
    expect(code).not.toContain('"nickname": null');
  });

  test('httpx emits Python booleans and None in json payload variables', () => {
    const code = new HttpxPythonRequestCodeGenerator().generateCode(
      BASE_TEST_CONFIG.path,
      'POST',
      BASE_TEST_CONFIG.baseUrl,
      POST_TEST_OPERATION,
      [],
      [],
      [],
      PYTHON_JSON_BODY,
      PYTHON_JSON_CONTEXT
    );

    expect(code).toContain('data = {');
    expect(code).toContain('json=data');
    expect(code).toContain('"enabled": True');
    expect(code).toContain('"archived": False');
    expect(code).toContain('"nickname": None');
    expect(code).not.toContain('"enabled": true');
    expect(code).not.toContain('"archived": false');
    expect(code).not.toContain('"nickname": null');
  });
});
