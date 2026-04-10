import {
  OpenAPIOperation,
  OpenAPIParameter,
  OpenAPIPathItem,
  OpenAPISchema,
  OpenAPISpec,
} from './openapi';

/**
 * Supported programming languages for code generation
 */
export type Language =
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'go'
  | 'java'
  | 'cpp'
  | 'csharp'
  | 'php'
  | 'ruby'
  | 'swift'
  | 'kotlin'
  | 'dart'
  | 'shell'
  | 'rust';

/**
 * Supported web frameworks for code generation
 */
export type Framework =
  | 'express'
  | 'koa'
  | 'nestjs'
  | 'fastify'
  | 'flask'
  | 'django'
  | 'gin'
  | 'springboot'
  | 'laravel'
  | 'rails';
export interface LanguageHttpLibs {
  language: Language;
  libs: string[];
  defaultLib: string;
}

/**
 * HTTP client libraries configuration using LanguageHttpLib interface
 */
export const language_http_libs_config: LanguageHttpLibs[] = [
  {
    language: 'javascript',
    libs: ['axios', 'fetch', 'got', 'superagent'],
    defaultLib: 'axios',
  },
  {
    language: 'typescript',
    libs: ['axios', 'fetch', 'got', 'superagent'],
    defaultLib: 'axios',
  },
  {
    language: 'python',
    libs: ['requests', 'aiohttp', 'httpx'],
    defaultLib: 'requests',
  },
  {
    language: 'go',
    libs: ['net/http', 'fasthttp', 'resty'],
    defaultLib: 'net/http',
  },
  {
    language: 'java',
    libs: ['okhttp', 'apache-httpclient', 'retrofit', 'unirest'],
    defaultLib: 'okhttp',
  },
  {
    language: 'cpp',
    libs: ['cpprest', 'cpp-httplib', 'boost-beast'],
    defaultLib: 'cpprest',
  },
  {
    language: 'csharp',
    libs: ['httpclient', 'restsharp', 'refit'],
    defaultLib: 'httpclient',
  },
  { language: 'php', libs: ['guzzle', 'curl'], defaultLib: 'guzzle' },
  { language: 'ruby', libs: ['faraday', 'httparty'], defaultLib: 'faraday' },
  {
    language: 'swift',
    libs: ['alamofire', 'urlsession'],
    defaultLib: 'alamofire',
  },
  { language: 'kotlin', libs: ['okhttp', 'retrofit'], defaultLib: 'okhttp' },
  { language: 'dart', libs: ['http', 'dio'], defaultLib: 'http' },
  { language: 'shell', libs: ['curl'], defaultLib: 'curl' },
  { language: 'rust', libs: ['reqwest'], defaultLib: 'reqwest' },
];

/**
 * HTTP methods supported by the code generator
 */
export type HttpMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'DELETE'
  | 'PATCH'
  | 'HEAD'
  | 'OPTIONS';

export type GeneratedCodeDependencyPackageManager =
  | 'npm'
  | 'pip'
  | 'go'
  | 'gradle'
  | 'nuget'
  | 'composer'
  | 'bundler'
  | 'swiftpm'
  | 'pub'
  | 'cargo'
  | 'vcpkg'
  | 'builtin'
  | 'system';

export interface GeneratedCodeDependency {
  /** Package name, module path, or dependency coordinate */
  name: string;
  /** Package manager or installation channel */
  packageManager: GeneratedCodeDependencyPackageManager;
  /** Latest stable version when applicable */
  version?: string;
  /** Example installation command or manifest snippet */
  installation: string;
  /** True when the dependency is already provided by the runtime or SDK */
  builtin?: boolean;
}

/**
 * Result of code generation process
 */
export interface CodeGenerateResult {
  /** Generated source code */
  code: string;
  /** Programming language of the generated code */
  language: Language;
  /** HTTP library used for the generated code */
  library: string;
  /** Runtime dependencies required by the generated code */
  dependencies: GeneratedCodeDependency[];
}
/**
 * Context information for code generation
 */
export interface CodeGenerateContext {
  /** Base URL for the API */
  baseUrl: string;
  /** Target programming language */
  language: Language;
  /** HTTP library to use */
  library: string;
  /** OpenAPI specification document */
  openAPISpec: OpenAPISpec;
  /** Output directory for generated files */
  outputDir?: string;
  /** Example headers for the generated code */
  exampleHeaders?: ExampleOpenAPIParameter[];
  /** Example query parameters for the generated code */
  exampleQueryParams?: ExampleOpenAPIParameter[];
  /** Example path variables for the generated code */
  examplePathVariables?: ExampleOpenAPIParameter[];
  /** Example cookies for the generated code */
  exampleCookies?: ExampleOpenAPIParameter[];
  /** Example request body for the generated code */
  exampleRequestBody?: any;
  /** Selected request body content type */
  requestContentType?: string;
  /** Selected request body schema */
  requestBodySchema?: OpenAPISchema;
  /** Selected response content type */
  responseContentType?: string;
  /** Selected response body schema */
  responseBodySchema?: OpenAPISchema;
  /** Selected success response status code */
  responseStatusCode?: string;
}

export interface ExampleMultipartPart {
  name: string;
  value: string;
  kind: 'field' | 'file';
  filename?: string;
  contentType?: string;
}

export interface ApiRequestDefinition {
  path: string;
  method: HttpMethod;
  operation: OpenAPIOperation;
  pathItem: OpenAPIPathItem;
}
/**
 * Interface for generating HTTP request code
 */
export interface RequestCodeGenerator {
  /**
   * Generate HTTP request code for a specific OpenAPI operation
   * @param operation - OpenAPI operation to generate code for
   * @param context - Code generation context
   * @returns Generated code result
   */
  generate(
    requestDefinition: ApiRequestDefinition,
    context: CodeGenerateContext
  ): CodeGenerateResult;
}
/**
 * OpenAPI parameter with example value
 */
export type ExampleOpenAPIParameter = OpenAPIParameter & { value: any };
/**
 * Interface for generating example data from OpenAPI schemas
 */
export interface ExampleGenerator {
  /**
   * Generate example values for OpenAPI parameters
   * @param parameters - Array of parameters
   * @param operation - OpenAPI operation
   * @param context - Code generation context
   * @returns Array of parameters with example values
   */
  generateParameters(
    parameters: OpenAPIParameter[],
    operation: OpenAPIOperation,
    context: CodeGenerateContext
  ): ExampleOpenAPIParameter[];

  /**
   * Generate example value for request body schema
   * @param schema - OpenAPI schema object
   * @param operation - OpenAPI operation
   * @param context - Code generation context
   * @returns Example value for the request body
   */
  generateBody(
    schema: any,
    operation: OpenAPIOperation,
    context: CodeGenerateContext
  ): any;
}

export interface RequestCodeGeneratorClient {}
