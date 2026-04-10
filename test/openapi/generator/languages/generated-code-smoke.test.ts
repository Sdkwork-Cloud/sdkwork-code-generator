import { Script } from 'node:vm';
import * as ts from 'typescript';
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

function generateCode(language: Language, library: string): string {
  return CodeGeneratorFactory.generate(
    POST_REQUEST_DEFINITION,
    createContext(language, library)
  ).code;
}

function formatDiagnostic(diagnostic: ts.Diagnostic): string {
  const message = ts.flattenDiagnosticMessageText(
    diagnostic.messageText,
    '\n'
  );

  if (!diagnostic.file || diagnostic.start === undefined) {
    return message;
  }

  const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(
    diagnostic.start
  );

  return `${diagnostic.file.fileName}:${line + 1}:${character + 1} ${message}`;
}

describe('generated code smoke validation', () => {
  const javascriptLibraries = ['axios', 'fetch', 'got', 'superagent'];
  const typescriptLibraries = ['axios', 'fetch', 'got', 'superagent'];

  test.each(javascriptLibraries)(
    'javascript/%s emits script-parseable source',
    (library) => {
      const code = generateCode('javascript', library);

      expect(() => new Script(code, { filename: `${library}.js` })).not.toThrow();
    }
  );

  test.each(typescriptLibraries)(
    'typescript/%s emits TypeScript-parseable source',
    (library) => {
      const code = generateCode('typescript', library);
      const result = ts.transpileModule(code, {
        compilerOptions: {
          target: ts.ScriptTarget.ES2020,
          module: ts.ModuleKind.ESNext,
        },
        fileName: `${library}.ts`,
        reportDiagnostics: true,
      });
      const errors = (result.diagnostics || []).filter(
        (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error
      );

      expect(errors.map(formatDiagnostic)).toEqual([]);
    }
  );

  test('csharp generators emit PascalCase HTTP method symbols', () => {
    const getRequestDefinition: ApiRequestDefinition = {
      path: BASE_TEST_CONFIG.path,
      method: 'GET',
      operation: TEST_OPERATION,
      pathItem: {},
    };
    const postRequestDefinition: ApiRequestDefinition = {
      path: BASE_TEST_CONFIG.path,
      method: 'POST',
      operation: POST_TEST_OPERATION,
      pathItem: {},
    };

    const httpClientCode = CodeGeneratorFactory.generate(
      getRequestDefinition,
      createContext('csharp', 'httpclient')
    ).code;
    const restSharpCode = CodeGeneratorFactory.generate(
      postRequestDefinition,
      createContext('csharp', 'restsharp')
    ).code;
    const refitCode = CodeGeneratorFactory.generate(
      postRequestDefinition,
      createContext('csharp', 'refit')
    ).code;

    expect(httpClientCode).toContain('Method = HttpMethod.Get');
    expect(httpClientCode).not.toContain('Method = HttpMethod.GET');
    expect(restSharpCode).toContain('Method.Post');
    expect(restSharpCode).not.toContain('Method.POST');
    expect(refitCode).toContain('[Post("');
    expect(refitCode).not.toContain('[POST("');
  });
});
