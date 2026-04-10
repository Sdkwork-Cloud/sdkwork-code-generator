import {
  ExampleMultipartPart,
  OpenAPIEncoding,
  OpenAPIOperation,
  OpenAPIParameter,
  OpenAPIResponse,
  OpenAPISpec,
} from '@/types';
import {
  ApiRequestDefinition,
  CodeGenerateContext,
  CodeGenerateResult,
  ExampleOpenAPIParameter,
  HttpMethod,
  Language,
  RequestCodeGenerator,
} from '@/types/code';
import { getGeneratedCodeDependencies } from './dependencies';
import { DefaultExampleGenerator } from './languages/example';

type RequestBodySelection = {
  contentType?: string;
  schema?: any;
  encoding?: Record<string, OpenAPIEncoding>;
};

type ResponseSelection = {
  statusCode?: string;
  contentType?: string;
  schema?: any;
};

type SerializedParameterEntry = {
  name: string;
  value: string;
  allowReserved?: boolean;
};

type SerializedParameterBinding = SerializedParameterEntry & {
  identifier: string;
};

type ParsedServerUrl = {
  origin: string;
  host: string;
  hostname: string;
  port: string;
  basePath: string;
  protocol: string;
};

const RESERVED_IDENTIFIERS = new Set<string>([
  'abstract',
  'as',
  'assert',
  'async',
  'await',
  'break',
  'case',
  'catch',
  'class',
  'const',
  'continue',
  'crate',
  'def',
  'default',
  'defer',
  'delete',
  'do',
  'dyn',
  'else',
  'enum',
  'except',
  'export',
  'extends',
  'false',
  'finally',
  'fn',
  'for',
  'from',
  'func',
  'function',
  'go',
  'goto',
  'guard',
  'if',
  'impl',
  'import',
  'in',
  'init',
  'interface',
  'internal',
  'is',
  'lambda',
  'let',
  'library',
  'loop',
  'match',
  'mixin',
  'mod',
  'module',
  'mut',
  'namespace',
  'new',
  'nil',
  'nonlocal',
  'not',
  'null',
  'open',
  'operator',
  'or',
  'override',
  'package',
  'part',
  'pass',
  'private',
  'protected',
  'protocol',
  'pub',
  'public',
  'raise',
  'range',
  'readonly',
  'record',
  'repeat',
  'required',
  'return',
  'sealed',
  'select',
  'self',
  'Self',
  'static',
  'struct',
  'subscript',
  'super',
  'switch',
  'this',
  'throw',
  'trait',
  'true',
  'try',
  'type',
  'typedef',
  'typeof',
  'union',
  'unsafe',
  'use',
  'using',
  'var',
  'virtual',
  'void',
  'when',
  'where',
  'while',
  'with',
  'yield',
]);

const RESERVED_QUERY_CHARACTERS = [
  ':',
  '/',
  '?',
  '#',
  '[',
  ']',
  '@',
  '!',
  '$',
  '&',
  "'",
  '(',
  ')',
  '*',
  '+',
  ',',
  ';',
  '=',
];

export abstract class BaseRequestCodeGenerator implements RequestCodeGenerator {
  protected exampleGenerator = new DefaultExampleGenerator();

  protected escapeDoubleQuotedString(value: string): string {
    return value
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\r?\n/g, '\\n');
  }

  protected escapeSingleQuotedString(value: string): string {
    return value
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/\r?\n/g, '\\n');
  }

  protected parseServerUrl(baseUrl: string): ParsedServerUrl {
    try {
      const parsedUrl = new URL(baseUrl);
      const protocol = parsedUrl.protocol;
      const defaultPort =
        protocol === 'https:' ? '443' : protocol === 'http:' ? '80' : '';
      const basePath =
        parsedUrl.pathname && parsedUrl.pathname !== '/'
          ? parsedUrl.pathname.replace(/\/+$/, '')
          : '';

      return {
        origin: `${parsedUrl.protocol}//${parsedUrl.host}`,
        host: parsedUrl.host,
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || defaultPort,
        basePath,
        protocol,
      };
    } catch {
      const origin = baseUrl.replace(/\/+$/, '');
      const host = origin.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '');

      return {
        origin,
        host,
        hostname: host,
        port: '',
        basePath: '',
        protocol: '',
      };
    }
  }

  protected combineServerPath(baseUrl: string, path: string): string {
    const { basePath } = this.parseServerUrl(baseUrl);
    const normalizedBasePath =
      basePath && basePath !== '/' ? basePath.replace(/\/+$/, '') : '';
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    return normalizedBasePath
      ? `${normalizedBasePath}${normalizedPath}`
      : normalizedPath;
  }

  protected buildRequestUrl(baseUrl: string, path: string): string {
    const serverUrl = this.parseServerUrl(baseUrl);
    const requestPath = this.combineServerPath(baseUrl, path);

    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(serverUrl.origin)) {
      return `${serverUrl.origin}${requestPath}`;
    }

    const normalizedBaseUrl = baseUrl.replace(/\/+$/, '');
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    return normalizedBaseUrl
      ? `${normalizedBaseUrl}${normalizedPath}`
      : normalizedPath;
  }

  generate(
    requestDefinition: ApiRequestDefinition,
    context: CodeGenerateContext
  ): CodeGenerateResult {
    const operation = requestDefinition.operation;
    const parameters = this.getResolvedParameters(requestDefinition, context);
    const requestBodySelection = this.selectRequestBody(operation, context);
    const responseSelection = this.selectResponse(operation, context);
    const generationContext: CodeGenerateContext = {
      ...context,
      requestContentType: requestBodySelection.contentType,
      requestBodySchema: requestBodySelection.schema,
      responseContentType: responseSelection.contentType,
      responseBodySchema: responseSelection.schema,
      responseStatusCode: responseSelection.statusCode,
    };

    const pathVariables = parameters.filter((param) => param.in === 'path');
    const headers = parameters.filter((param) => param.in === 'header');
    const cookies = parameters.filter((param) => param.in === 'cookie');
    const queryParams = parameters.filter((param) => param.in === 'query');

    return this.handleGenerate(
      requestDefinition.path,
      requestDefinition.method,
      pathVariables,
      headers,
      cookies,
      queryParams,
      requestBodySelection.schema,
      requestBodySelection.encoding,
      operation,
      generationContext
    );
  }

  handleGenerate(
    path: string,
    method: HttpMethod,
    pathVariables: OpenAPIParameter[],
    headers: OpenAPIParameter[],
    cookies: OpenAPIParameter[],
    queryParams: OpenAPIParameter[],
    requestBody: any,
    requestBodyEncoding: Record<string, OpenAPIEncoding> | undefined,
    operation: OpenAPIOperation,
    context: CodeGenerateContext
  ): CodeGenerateResult {
    const examplePathVariables = this.exampleGenerator.generateParameters(
      pathVariables,
      operation,
      context
    );
    const exampleHeaders = this.exampleGenerator.generateHeaders(
      headers,
      operation,
      context
    );
    const exampleCookies = this.exampleGenerator.generateCookies(
      cookies,
      operation,
      context
    );
    const exampleQueryParams = this.exampleGenerator.generateQueryParams(
      queryParams,
      operation,
      context
    );
    const exampleRequestBody = this.exampleGenerator.generateBody(
      requestBody,
      operation,
      context
    );
    const preparedRequestBody = this.isMultipartRequestBody(context)
      ? this.buildMultipartRequestBody(
          requestBody,
          requestBodyEncoding,
          exampleRequestBody
        )
      : exampleRequestBody;

    const fullPath = this.completePath(path, examplePathVariables);

    const code = this.generateCode(
      fullPath,
      method,
      context.baseUrl,
      operation,
      exampleCookies,
      exampleHeaders,
      exampleQueryParams,
      preparedRequestBody,
      context
    );

    return {
      code,
      language: this.getLanguage(),
      library: this.getLibrary(),
      dependencies: this.getDependencies(),
    };
  }

  protected completePath(
    path: string,
    pathVariables: ExampleOpenAPIParameter[]
  ): string {
    let url = path;

    pathVariables.forEach((param) => {
      url = url.replace(`{${param.name}}`, this.serializePathParameter(param));
    });

    return url;
  }

  private serializePathParameter(param: ExampleOpenAPIParameter): string {
    const style = param.style ?? 'simple';
    const explode = param.explode ?? false;
    const parameterName = this.encodePathSegment(param.name);

    if (Array.isArray(param.value)) {
      const values = param.value.map((item) =>
        this.encodePathSegment(this.parameterPrimitiveValue(item))
      );

      switch (style) {
        case 'label':
          return `.${values.join(explode ? '.' : ',')}`;
        case 'matrix':
          return explode
            ? values.map((value) => `;${parameterName}=${value}`).join('')
            : `;${parameterName}=${values.join(',')}`;
        case 'simple':
        default:
          return values.join(',');
      }
    }

    if (this.isSerializableObject(param.value)) {
      const entries = Object.entries(
        param.value as Record<string, unknown>
      ).map(([key, value]) => [
        this.encodePathSegment(key),
        this.encodePathSegment(this.parameterPrimitiveValue(value)),
      ]);
      const flattenedEntries = entries
        .flatMap(([key, value]) => [key, value])
        .join(',');

      switch (style) {
        case 'label':
          return explode
            ? `.${entries.map(([key, value]) => `${key}=${value}`).join('.')}`
            : `.${flattenedEntries}`;
        case 'matrix':
          return explode
            ? entries.map(([key, value]) => `;${key}=${value}`).join('')
            : `;${parameterName}=${flattenedEntries}`;
        case 'simple':
        default:
          return explode
            ? entries.map(([key, value]) => `${key}=${value}`).join(',')
            : flattenedEntries;
      }
    }

    const encodedValue = this.encodePathSegment(
      this.parameterPrimitiveValue(param.value)
    );

    switch (style) {
      case 'label':
        return `.${encodedValue}`;
      case 'matrix':
        return `;${parameterName}=${encodedValue}`;
      case 'simple':
      default:
        return encodedValue;
    }
  }

  abstract getLanguage(): Language;

  abstract getLibrary(): string;

  abstract generateCode(
    path: string,
    method: HttpMethod,
    baseUrl: string,
    operation: OpenAPIOperation,
    cookies: ExampleOpenAPIParameter[],
    headers: ExampleOpenAPIParameter[],
    queryParams: ExampleOpenAPIParameter[],
    requestBody: any,
    context: CodeGenerateContext
  ): string;

  protected usesStringRequestBody(context: CodeGenerateContext): boolean {
    const contentType = this.normalizeMediaType(context.requestContentType);

    if (
      !contentType ||
      contentType === 'multipart/form-data' ||
      this.isBinaryRequestBody(context)
    ) {
      return false;
    }

    if (contentType === 'application/x-www-form-urlencoded') {
      return true;
    }

    return !contentType.includes('json');
  }

  protected isBinaryRequestBody(context: CodeGenerateContext): boolean {
    const contentType = this.normalizeMediaType(context.requestContentType);
    const schemaFormat = context.requestBodySchema?.format?.toLowerCase();

    return (
      contentType === 'application/octet-stream' || schemaFormat === 'binary'
    );
  }

  protected isMultipartRequestBody(context: CodeGenerateContext): boolean {
    return (
      this.normalizeMediaType(context.requestContentType) ===
      'multipart/form-data'
    );
  }

  protected usesJsonResponse(context: CodeGenerateContext): boolean {
    return this.isJsonMediaType(context.responseContentType);
  }

  protected usesStringResponse(context: CodeGenerateContext): boolean {
    const contentType = this.normalizeMediaType(context.responseContentType);

    if (this.isBinaryResponse(context)) {
      return false;
    }

    if (!contentType) {
      return true;
    }

    return !this.isJsonMediaType(contentType);
  }

  protected isBinaryResponse(context: CodeGenerateContext): boolean {
    const contentType = this.normalizeMediaType(context.responseContentType);
    const schemaFormat = context.responseBodySchema?.format?.toLowerCase();

    return (
      contentType === 'application/octet-stream' || schemaFormat === 'binary'
    );
  }

  protected getExpectedSuccessStatusCode(
    context: CodeGenerateContext,
    fallback = 200
  ): number {
    const statusCode = context.responseStatusCode?.trim();

    if (statusCode && /^\d{3}$/.test(statusCode)) {
      return Number(statusCode);
    }

    return fallback;
  }

  protected usesAny2xxSuccessStatus(context: CodeGenerateContext): boolean {
    const normalizedStatusCode = context.responseStatusCode
      ?.trim()
      .toUpperCase();

    return normalizedStatusCode === '2XX' || normalizedStatusCode === 'DEFAULT';
  }

  protected getBinaryRequestBodyFileName(requestBody: any): string {
    return typeof requestBody === 'string' && requestBody.trim().length > 0
      ? requestBody
      : 'example-file.bin';
  }

  protected shouldAutoAddContentTypeHeader(
    context: CodeGenerateContext
  ): boolean {
    return (
      Boolean(context.requestContentType) &&
      !this.isMultipartRequestBody(context)
    );
  }

  protected hasRequestBodyValue(
    method: HttpMethod,
    requestBody: unknown
  ): boolean {
    return (
      ['POST', 'PUT', 'PATCH'].includes(method) &&
      requestBody !== undefined &&
      requestBody !== null
    );
  }

  protected serializeStringRequestBody(
    requestBody: any,
    context: CodeGenerateContext
  ): string {
    if (
      this.normalizeMediaType(context.requestContentType) ===
      'application/x-www-form-urlencoded'
    ) {
      return this.buildFormUrlEncodedString(requestBody);
    }

    return String(requestBody);
  }

  protected toIdentifier(
    value: string | undefined,
    fallback: string,
    style: 'camel' | 'pascal' | 'snake' = 'camel'
  ): string {
    const fallbackIdentifier =
      this.buildIdentifier(this.tokenizeIdentifier(fallback), style) ||
      (style === 'pascal' ? 'ApiRequest' : 'apiRequest');
    const tokens = this.tokenizeIdentifier(value);
    let identifier = this.buildIdentifier(tokens, style) || fallbackIdentifier;

    if (/^\d/.test(identifier) || this.isReservedIdentifier(identifier)) {
      if (style === 'snake') {
        identifier = `${fallbackIdentifier}_${identifier}`;
      } else {
        identifier = `${fallbackIdentifier}${
          identifier.charAt(0).toUpperCase() + identifier.slice(1)
        }`;
      }
    }

    return identifier;
  }

  protected toTypeScriptPropertyKey(key: string): string {
    return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key) ? key : JSON.stringify(key);
  }

  protected toGoStringLiteral(value: string): string {
    return value.includes('`') ? JSON.stringify(value) : `\`${value}\``;
  }

  protected toPythonLiteral(value: unknown, indent = 0): string {
    const currentIndent = ' '.repeat(indent);
    const nextIndent = ' '.repeat(indent + 4);

    if (value === null || value === undefined) {
      return 'None';
    }

    if (typeof value === 'string') {
      return JSON.stringify(value);
    }

    if (typeof value === 'number') {
      return Number.isFinite(value) ? String(value) : 'None';
    }

    if (typeof value === 'boolean') {
      return value ? 'True' : 'False';
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return '[]';
      }

      return `[\n${value
        .map((item) => `${nextIndent}${this.toPythonLiteral(item, indent + 4)}`)
        .join(',\n')}\n${currentIndent}]`;
    }

    if (typeof value === 'object') {
      const entries = Object.entries(value as Record<string, unknown>);

      if (entries.length === 0) {
        return '{}';
      }

      return `{\n${entries
        .map(
          ([key, itemValue]) =>
            `${nextIndent}${JSON.stringify(key)}: ${this.toPythonLiteral(
              itemValue,
              indent + 4
            )}`
        )
        .join(',\n')}\n${currentIndent}}`;
    }

    return JSON.stringify(String(value));
  }

  protected toCppStringLiteral(value: string): string {
    return JSON.stringify(value);
  }

  protected toPascalHttpMethod(method: HttpMethod): string {
    return this.toIdentifier(method, 'get', 'pascal');
  }

  protected getDependencies() {
    return getGeneratedCodeDependencies(this.getLanguage(), this.getLibrary());
  }

  protected isMultipartPartsRequestBody(
    requestBody: any
  ): requestBody is ExampleMultipartPart[] {
    return (
      Array.isArray(requestBody) &&
      requestBody.every(
        (part) =>
          part &&
          typeof part === 'object' &&
          typeof part.name === 'string' &&
          (part.kind === 'field' || part.kind === 'file')
      )
    );
  }

  protected getMultipartParts(requestBody: any): ExampleMultipartPart[] {
    return this.isMultipartPartsRequestBody(requestBody) ? requestBody : [];
  }

  protected getMultipartFieldParts(requestBody: any): ExampleMultipartPart[] {
    return this.getMultipartParts(requestBody).filter(
      (part) => part.kind === 'field'
    );
  }

  protected getMultipartFileParts(requestBody: any): ExampleMultipartPart[] {
    return this.getMultipartParts(requestBody).filter(
      (part) => part.kind === 'file'
    );
  }

  protected buildRawMultipartBody(
    parts: ExampleMultipartPart[],
    boundary = this.buildMultipartBoundary()
  ): string {
    const lines = parts.flatMap((part) => {
      const headerLines = [
        `--${boundary}`,
        part.kind === 'file'
          ? `Content-Disposition: form-data; name="${part.name}"; filename="${
              part.filename || part.value
            }"`
          : `Content-Disposition: form-data; name="${part.name}"`,
      ];

      if (part.contentType) {
        headerLines.push(`Content-Type: ${part.contentType}`);
      }

      return [...headerLines, '', part.value];
    });

    return [...lines, `--${boundary}--`].join('\r\n');
  }

  protected buildMultipartBoundary(): string {
    return '----SDKWorkFormBoundary';
  }

  pathVariables(
    operation: OpenAPIOperation,
    context: CodeGenerateContext
  ): OpenAPIParameter[] {
    return this.resolveParameterList(
      operation.parameters || [],
      context
    ).filter((param) => param.in === 'path');
  }

  headers(
    operation: OpenAPIOperation,
    context: CodeGenerateContext
  ): OpenAPIParameter[] {
    return this.resolveParameterList(
      operation.parameters || [],
      context
    ).filter((param) => param.in === 'header');
  }

  cookies(
    operation: OpenAPIOperation,
    context: CodeGenerateContext
  ): OpenAPIParameter[] {
    return this.resolveParameterList(
      operation.parameters || [],
      context
    ).filter((param) => param.in === 'cookie');
  }

  queryParams(
    operation: OpenAPIOperation,
    context: CodeGenerateContext
  ): OpenAPIParameter[] {
    return this.resolveParameterList(
      operation.parameters || [],
      context
    ).filter((param) => param.in === 'query');
  }

  requestBody(operation: OpenAPIOperation, context: CodeGenerateContext) {
    return this.selectRequestBody(operation, context).schema;
  }

  protected buildFormUrlEncodedString(requestBody: any): string {
    if (typeof requestBody === 'string') {
      return this.encodeFormUrlEncodedComponent(requestBody);
    }

    const entries: string[] = [];
    this.appendFormUrlEncodedEntries(entries, undefined, requestBody);
    return entries.join('&');
  }

  protected buildCookieParameterEntries(
    cookies: ExampleOpenAPIParameter[]
  ): SerializedParameterEntry[] {
    return cookies.flatMap((cookie) => this.serializeCookieParameter(cookie));
  }

  protected buildCookieParameterBindings(
    cookies: ExampleOpenAPIParameter[],
    style: 'camel' | 'pascal' | 'snake' = 'camel',
    fallback = 'cookie'
  ): SerializedParameterBinding[] {
    const seenIdentifiers = new Set<string>();

    return this.buildCookieParameterEntries(cookies).map((entry) => {
      const baseIdentifier = this.toIdentifier(entry.name, fallback, style);
      let identifier = baseIdentifier;
      let suffix = 2;

      while (seenIdentifiers.has(identifier)) {
        identifier =
          style === 'snake'
            ? `${baseIdentifier}_${suffix}`
            : `${baseIdentifier}${suffix}`;
        suffix += 1;
      }

      seenIdentifiers.add(identifier);

      return {
        ...entry,
        identifier,
      };
    });
  }

  protected buildCookieHeaderValue(cookies: ExampleOpenAPIParameter[]): string {
    return this.buildCookieParameterEntries(cookies)
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join('; ');
  }

  protected buildCookieHeaderParameter(
    cookies: ExampleOpenAPIParameter[],
    name = 'Cookie'
  ): ExampleOpenAPIParameter | null {
    if (cookies.length === 0) {
      return null;
    }

    return {
      name,
      in: 'header',
      required: false,
      schema: { type: 'string' },
      value: this.buildCookieHeaderValue(cookies),
    };
  }

  protected buildQueryParameterEntries(
    queryParams: ExampleOpenAPIParameter[]
  ): SerializedParameterEntry[] {
    return queryParams.flatMap((param) => this.serializeQueryParameter(param));
  }

  protected buildQueryParameterBindings(
    queryParams: ExampleOpenAPIParameter[],
    style: 'camel' | 'pascal' | 'snake' = 'camel',
    fallback = 'queryParam'
  ): SerializedParameterBinding[] {
    const seenIdentifiers = new Set<string>();

    return this.buildQueryParameterEntries(queryParams).map((entry) => {
      const baseIdentifier = this.toIdentifier(entry.name, fallback, style);
      let identifier = baseIdentifier;
      let suffix = 2;

      while (seenIdentifiers.has(identifier)) {
        identifier =
          style === 'snake'
            ? `${baseIdentifier}_${suffix}`
            : `${baseIdentifier}${suffix}`;
        suffix += 1;
      }

      seenIdentifiers.add(identifier);

      return {
        ...entry,
        identifier,
      };
    });
  }

  protected hasAllowReservedQueryParameters(
    queryParams: ExampleOpenAPIParameter[]
  ): boolean {
    return this.buildQueryParameterEntries(queryParams).some(
      (param) => param.allowReserved
    );
  }

  protected buildSerializedQueryString(
    queryParams: ExampleOpenAPIParameter[]
  ): string {
    return this.buildQueryParameterEntries(queryParams)
      .map(
        (param) =>
          `${this.encodeQueryParameterName(
            param.name
          )}=${this.encodeQueryComponent(param.value, param.allowReserved)}`
      )
      .join('&');
  }

  protected encodeQueryParameterName(value: string): string {
    return this.encodeQueryComponent(value)
      .replace(/%5B/g, '[')
      .replace(/%5D/g, ']');
  }

  protected encodeQueryParameterValue(
    value: string,
    allowReserved = false
  ): string {
    return this.encodeQueryComponent(value, allowReserved);
  }

  protected serializeHeaderParameterValue(
    header: ExampleOpenAPIParameter
  ): string {
    const explode = header.explode ?? false;

    if (Array.isArray(header.value)) {
      return header.value
        .map((item) => this.parameterPrimitiveValue(item))
        .join(',');
    }

    if (this.isSerializableObject(header.value)) {
      const entries = Object.entries(header.value as Record<string, unknown>);

      return explode
        ? entries
            .map(
              ([key, value]) => `${key}=${this.parameterPrimitiveValue(value)}`
            )
            .join(',')
        : entries
            .flatMap(([key, value]) => [
              key,
              this.parameterPrimitiveValue(value),
            ])
            .join(',');
    }

    return this.parameterPrimitiveValue(header.value);
  }

  protected buildMultipartRequestBody(
    schema: any,
    encoding: Record<string, OpenAPIEncoding> | undefined,
    exampleBody: any
  ): ExampleMultipartPart[] {
    if (this.isMultipartPartsRequestBody(exampleBody)) {
      return exampleBody;
    }

    if (
      !exampleBody ||
      typeof exampleBody !== 'object' ||
      Array.isArray(exampleBody)
    ) {
      return [
        this.createMultipartPart('file', exampleBody, schema, encoding?.file),
      ];
    }

    return Object.entries(exampleBody).flatMap(([name, value]) => {
      const propertySchema = schema?.properties?.[name];
      const propertyEncoding = encoding?.[name];

      if (Array.isArray(value)) {
        return value.map((item) =>
          this.createMultipartPart(name, item, propertySchema, propertyEncoding)
        );
      }

      return [
        this.createMultipartPart(name, value, propertySchema, propertyEncoding),
      ];
    });
  }

  private getResolvedParameters(
    requestDefinition: ApiRequestDefinition,
    context: CodeGenerateContext
  ): OpenAPIParameter[] {
    const merged = new Map<string, OpenAPIParameter>();

    this.addParametersToMap(
      merged,
      requestDefinition.pathItem.parameters || [],
      context
    );
    this.addParametersToMap(
      merged,
      requestDefinition.operation.parameters || [],
      context
    );

    for (const authParameter of this.getSecurityParameters(
      requestDefinition.operation,
      context
    )) {
      const key = this.parameterKey(authParameter);
      if (!merged.has(key)) {
        merged.set(key, authParameter);
      }
    }

    return [...merged.values()];
  }

  private addParametersToMap(
    target: Map<string, OpenAPIParameter>,
    parameters: any[],
    context: CodeGenerateContext
  ): void {
    for (const parameter of this.resolveParameterList(parameters, context)) {
      target.set(this.parameterKey(parameter), parameter);
    }
  }

  private resolveParameterList(
    parameters: any[],
    context: CodeGenerateContext
  ): OpenAPIParameter[] {
    return parameters
      .map((parameter) => this.resolveParameter(parameter, context.openAPISpec))
      .filter((parameter): parameter is OpenAPIParameter => Boolean(parameter));
  }

  private resolveParameter(
    parameter: any,
    spec: OpenAPISpec | undefined
  ): OpenAPIParameter | null {
    if (!parameter) {
      return null;
    }

    if (parameter.$ref) {
      const resolved = this.resolveDocumentRef(parameter.$ref, spec);
      return this.resolveParameter(resolved, spec);
    }

    if (!parameter.name || !parameter.in) {
      return null;
    }

    return {
      ...parameter,
      schema: this.resolveSchemaRef(parameter.schema, spec),
    };
  }

  private selectRequestBody(
    operation: OpenAPIOperation,
    context: CodeGenerateContext
  ): RequestBodySelection {
    const requestBody = this.resolveRequestBody(
      operation.requestBody as any,
      context.openAPISpec
    );

    if (!requestBody?.content) {
      return {};
    }

    const availableTypes = Object.keys(requestBody.content);
    if (availableTypes.length === 0) {
      return {};
    }

    const contentType = this.selectPreferredContentType(availableTypes, [
      'application/json',
      'application/x-www-form-urlencoded',
      'multipart/form-data',
      'application/xml',
      'text/plain',
    ]);
    const mediaType = requestBody.content[contentType];

    if (!mediaType) {
      return {};
    }

    let schema = this.resolveSchemaRef(mediaType.schema, context.openAPISpec);

    if (mediaType.example !== undefined) {
      schema = this.attachExample(schema, mediaType.example);
    } else if (mediaType.examples) {
      const firstExample = Object.values(mediaType.examples).find(
        (example: any) => example?.value !== undefined
      );
      if ((firstExample as any)?.value !== undefined) {
        schema = this.attachExample(schema, (firstExample as any).value);
      }
    }

    return {
      contentType,
      schema,
      encoding: mediaType.encoding as
        | Record<string, OpenAPIEncoding>
        | undefined,
    };
  }

  private selectResponse(
    operation: OpenAPIOperation,
    context: CodeGenerateContext
  ): ResponseSelection {
    const responses = this.resolveResponses(
      operation.responses || {},
      context.openAPISpec
    );
    const responseEntries = this.getPreferredResponseEntries(responses);
    const successEntries = responseEntries.filter(([statusCode]) =>
      this.isSuccessResponseStatusCode(statusCode)
    );
    const candidateEntries =
      successEntries.length > 0 ? successEntries : responseEntries;

    for (const [statusCode, response] of candidateEntries) {
      const availableTypes = Object.keys(response?.content || {});
      if (availableTypes.length === 0) {
        continue;
      }

      const contentType = this.selectPreferredContentType(availableTypes, [
        'application/json',
        'application/xml',
        'text/plain',
        'application/octet-stream',
      ]);
      const mediaType = response.content?.[contentType];

      if (!mediaType) {
        continue;
      }

      let schema = this.resolveSchemaRef(mediaType.schema, context.openAPISpec);

      if (mediaType.example !== undefined) {
        schema = this.attachExample(schema, mediaType.example);
      } else if (mediaType.examples) {
        const firstExample = Object.values(mediaType.examples).find(
          (example: any) => example?.value !== undefined
        );
        if ((firstExample as any)?.value !== undefined) {
          schema = this.attachExample(schema, (firstExample as any).value);
        }
      }

      return {
        statusCode,
        contentType,
        schema,
      };
    }

    if (candidateEntries.length === 0) {
      return {};
    }

    return {
      statusCode: candidateEntries[0][0],
    };
  }

  private resolveRequestBody(
    requestBody: any,
    spec: OpenAPISpec | undefined
  ): any {
    if (!requestBody) {
      return undefined;
    }

    if (requestBody.$ref) {
      const resolved = this.resolveDocumentRef(requestBody.$ref, spec);
      return resolved ? this.resolveRequestBody(resolved, spec) : undefined;
    }

    const contentEntries = Object.entries(requestBody.content || {}).map(
      ([contentType, mediaType]) => [
        contentType,
        {
          ...(mediaType as Record<string, unknown>),
          schema: this.resolveSchemaRef((mediaType as any).schema, spec),
        },
      ]
    );

    return {
      ...requestBody,
      content: Object.fromEntries(contentEntries),
    };
  }

  private resolveResponses(
    responses: Record<string, any>,
    spec: OpenAPISpec | undefined
  ): Record<string, OpenAPIResponse> {
    return Object.fromEntries(
      Object.entries(responses || {})
        .map(([statusCode, response]) => [
          statusCode,
          this.resolveResponse(response, spec),
        ])
        .filter((entry): entry is [string, OpenAPIResponse] =>
          Boolean(entry[1])
        )
    );
  }

  private resolveResponse(
    response: any,
    spec: OpenAPISpec | undefined
  ): OpenAPIResponse | undefined {
    if (!response) {
      return undefined;
    }

    if (response.$ref) {
      const resolved = this.resolveDocumentRef(response.$ref, spec);
      return resolved ? this.resolveResponse(resolved, spec) : undefined;
    }

    const contentEntries = Object.entries(response.content || {}).map(
      ([contentType, mediaType]) => [
        contentType,
        {
          ...(mediaType as Record<string, unknown>),
          schema: this.resolveSchemaRef((mediaType as any).schema, spec),
        },
      ]
    );

    return {
      ...response,
      content: Object.fromEntries(contentEntries),
    };
  }

  private attachExample(schema: any, example: unknown): any {
    if (!schema || typeof schema !== 'object') {
      return {
        example,
      };
    }

    return {
      ...schema,
      example,
    };
  }

  private resolveSchemaRef(schema: any, spec: OpenAPISpec | undefined): any {
    if (!schema || !spec) {
      return schema;
    }

    if (schema.$ref) {
      const resolved = this.resolveDocumentRef(schema.$ref, spec);
      if (!resolved || resolved === schema) {
        return schema;
      }
      return this.resolveSchemaRef(resolved, spec);
    }

    const resolvedSchema = { ...schema };

    if (resolvedSchema.properties) {
      resolvedSchema.properties = Object.fromEntries(
        Object.entries(resolvedSchema.properties).map(
          ([key, propertySchema]) => [
            key,
            this.resolveSchemaRef(propertySchema, spec),
          ]
        )
      );
    }

    if (resolvedSchema.items) {
      resolvedSchema.items = this.resolveSchemaRef(resolvedSchema.items, spec);
    }

    if (resolvedSchema.additionalProperties) {
      resolvedSchema.additionalProperties = this.resolveSchemaRef(
        resolvedSchema.additionalProperties,
        spec
      );
    }

    if (resolvedSchema.allOf) {
      resolvedSchema.allOf = resolvedSchema.allOf.map((part: any) =>
        this.resolveSchemaRef(part, spec)
      );
    }

    if (resolvedSchema.anyOf) {
      resolvedSchema.anyOf = resolvedSchema.anyOf.map((part: any) =>
        this.resolveSchemaRef(part, spec)
      );
    }

    if (resolvedSchema.oneOf) {
      resolvedSchema.oneOf = resolvedSchema.oneOf.map((part: any) =>
        this.resolveSchemaRef(part, spec)
      );
    }

    if (resolvedSchema.not) {
      resolvedSchema.not = this.resolveSchemaRef(resolvedSchema.not, spec);
    }

    if (resolvedSchema.patternProperties) {
      resolvedSchema.patternProperties = Object.fromEntries(
        Object.entries(resolvedSchema.patternProperties).map(
          ([key, propertySchema]) => [
            key,
            this.resolveSchemaRef(propertySchema, spec),
          ]
        )
      );
    }

    return resolvedSchema;
  }

  private resolveDocumentRef(ref: string, spec: OpenAPISpec | undefined): any {
    if (!spec || !ref.startsWith('#/')) {
      return undefined;
    }

    const pathParts = ref
      .slice(2)
      .split('/')
      .map((part) => part.replace(/~1/g, '/').replace(/~0/g, '~'));

    let current: any = spec;
    for (const part of pathParts) {
      current = current?.[part];
      if (current === undefined) {
        return undefined;
      }
    }

    return current;
  }

  private getSecurityParameters(
    operation: OpenAPIOperation,
    context: CodeGenerateContext
  ): OpenAPIParameter[] {
    const requirements =
      operation.security ?? context.openAPISpec.security ?? [];
    const parameters: OpenAPIParameter[] = [];
    const seen = new Set<string>();

    for (const requirement of requirements) {
      for (const schemeName of Object.keys(requirement)) {
        const scheme =
          context.openAPISpec.components?.securitySchemes?.[schemeName];
        const parameter = this.parameterFromSecurityScheme(scheme);

        if (!parameter) {
          continue;
        }

        const key = this.parameterKey(parameter);
        if (seen.has(key)) {
          continue;
        }

        seen.add(key);
        parameters.push(parameter);
      }
    }

    return parameters;
  }

  private parameterFromSecurityScheme(scheme: any): OpenAPIParameter | null {
    if (!scheme) {
      return null;
    }

    if (scheme.type === 'apiKey' && scheme.name && scheme.in) {
      return {
        name: scheme.name,
        in: scheme.in,
        required: true,
        schema: { type: 'string' },
        example: `<${scheme.name}>`,
      };
    }

    if (scheme.type === 'http') {
      return {
        name: 'Authorization',
        in: 'header',
        required: true,
        schema: { type: 'string' },
        example: this.authorizationExampleForScheme(scheme.scheme),
      };
    }

    if (scheme.type === 'oauth2' || scheme.type === 'openIdConnect') {
      return {
        name: 'Authorization',
        in: 'header',
        required: true,
        schema: { type: 'string' },
        example: 'Bearer <access_token>',
      };
    }

    return null;
  }

  private authorizationExampleForScheme(scheme?: string): string {
    const normalized = (scheme || '').toLowerCase();

    if (normalized === 'bearer') {
      return 'Bearer <token>';
    }

    if (normalized === 'basic') {
      return 'Basic <credentials>';
    }

    return `${scheme || 'Auth'} <credentials>`;
  }

  private getPreferredResponseEntries(
    responses: Record<string, OpenAPIResponse>
  ): [string, OpenAPIResponse][] {
    const entries = Object.entries(responses);
    const ordered: [string, OpenAPIResponse][] = [];
    const seen = new Set<string>();

    const exactSuccessEntries = entries
      .filter(
        ([statusCode]) =>
          !seen.has(statusCode) &&
          this.isExactSuccessResponseStatusCode(statusCode)
      )
      .sort((left, right) => Number(left[0]) - Number(right[0]));

    exactSuccessEntries.forEach((entry) => {
      ordered.push(entry);
      seen.add(entry[0]);
    });

    const wildcardSuccessEntry = entries.find(
      ([statusCode]) =>
        !seen.has(statusCode) && statusCode.trim().toUpperCase() === '2XX'
    );
    if (wildcardSuccessEntry) {
      ordered.push(wildcardSuccessEntry);
      seen.add(wildcardSuccessEntry[0]);
    }

    const defaultEntry = entries.find(
      ([statusCode]) =>
        !seen.has(statusCode) && statusCode.trim().toLowerCase() === 'default'
    );
    if (defaultEntry) {
      ordered.push(defaultEntry);
      seen.add(defaultEntry[0]);
    }

    entries
      .filter(([statusCode]) => !seen.has(statusCode))
      .forEach((entry) => ordered.push(entry));

    return ordered;
  }

  private selectPreferredContentType(
    availableTypes: string[],
    preferredTypes: string[]
  ): string {
    const normalizedTypeMap = new Map(
      availableTypes.map((candidate) => [
        this.normalizeMediaType(candidate) || candidate.toLowerCase(),
        candidate,
      ])
    );

    const exactJson = preferredTypes.find((candidate) => {
      const normalizedCandidate = this.normalizeMediaType(candidate);
      return (
        normalizedCandidate === 'application/json' &&
        normalizedTypeMap.has(normalizedCandidate)
      );
    });
    if (exactJson) {
      return normalizedTypeMap.get(this.normalizeMediaType(exactJson)!)!;
    }

    const structuredJson = availableTypes.find((candidate) =>
      this.isJsonMediaType(candidate)
    );
    if (structuredJson) {
      return structuredJson;
    }

    const exactXml = preferredTypes.find((candidate) => {
      const normalizedCandidate = this.normalizeMediaType(candidate);
      return (
        normalizedCandidate === 'application/xml' &&
        normalizedTypeMap.has(normalizedCandidate)
      );
    });
    if (exactXml) {
      return normalizedTypeMap.get(this.normalizeMediaType(exactXml)!)!;
    }

    const structuredXml = availableTypes.find((candidate) =>
      this.isXmlMediaType(candidate)
    );
    if (structuredXml) {
      return structuredXml;
    }

    return (
      preferredTypes
        .map((candidate) =>
          normalizedTypeMap.get(this.normalizeMediaType(candidate)!)
        )
        .find((candidate): candidate is string => Boolean(candidate)) ||
      availableTypes[0]
    );
  }

  private parameterKey(parameter: OpenAPIParameter): string {
    return `${parameter.in}:${parameter.name}`;
  }

  private createMultipartPart(
    name: string,
    value: any,
    schema: any,
    encoding: OpenAPIEncoding | undefined
  ): ExampleMultipartPart {
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      !this.isBinarySchema(schema)
    ) {
      return {
        name,
        kind: 'field',
        value: JSON.stringify(value, null, 2),
        contentType: encoding?.contentType || 'application/json',
      };
    }

    if (this.isBinarySchema(schema)) {
      const filename =
        typeof value === 'string' && value.trim().length > 0
          ? value
          : 'example-file.bin';

      return {
        name,
        kind: 'file',
        value: 'example file contents',
        filename,
        contentType: encoding?.contentType || 'application/octet-stream',
      };
    }

    return {
      name,
      kind: 'field',
      value: value === undefined || value === null ? '' : String(value),
      contentType: encoding?.contentType,
    };
  }

  private isBinarySchema(schema: any): boolean {
    return schema?.type === 'string' && schema.format === 'binary';
  }

  private appendFormUrlEncodedEntries(
    entries: string[],
    key: string | undefined,
    value: any
  ): void {
    if (value === undefined) {
      return;
    }

    if (value === null) {
      if (key) {
        entries.push(`${this.encodeFormUrlEncodedComponent(key)}=`);
      }
      return;
    }

    if (Array.isArray(value)) {
      if (!key) {
        value.forEach((item) =>
          this.appendFormUrlEncodedEntries(entries, undefined, item)
        );
        return;
      }

      value.forEach((item) =>
        this.appendFormUrlEncodedEntries(entries, `${key}[]`, item)
      );
      return;
    }

    if (typeof value === 'object') {
      const objectEntries = Object.entries(value);

      if (objectEntries.length === 0) {
        if (key) {
          entries.push(`${this.encodeFormUrlEncodedComponent(key)}=`);
        }
        return;
      }

      objectEntries.forEach(([childKey, childValue]) => {
        const nextKey = key ? `${key}[${childKey}]` : childKey;
        this.appendFormUrlEncodedEntries(entries, nextKey, childValue);
      });
      return;
    }

    if (!key) {
      entries.push(this.encodeFormUrlEncodedComponent(String(value)));
      return;
    }

    entries.push(
      `${this.encodeFormUrlEncodedComponent(
        key
      )}=${this.encodeFormUrlEncodedComponent(String(value))}`
    );
  }

  private encodeFormUrlEncodedComponent(value: string): string {
    return encodeURIComponent(value).replace(/%20/g, '+');
  }

  private encodePathSegment(value: string): string {
    return encodeURIComponent(value);
  }

  private isSerializableObject(
    value: unknown
  ): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private parameterPrimitiveValue(value: unknown): string {
    return value === undefined || value === null ? '' : String(value);
  }

  private serializeQueryParameter(
    param: ExampleOpenAPIParameter
  ): SerializedParameterEntry[] {
    const style = param.style ?? 'form';
    const explode = param.explode ?? style === 'form';

    if (Array.isArray(param.value)) {
      const values = param.value.map((item) =>
        this.parameterPrimitiveValue(item)
      );

      switch (style) {
        case 'spaceDelimited':
          return [
            {
              name: param.name,
              value: values.join(' '),
              allowReserved: param.allowReserved,
            },
          ];
        case 'pipeDelimited':
          return [
            {
              name: param.name,
              value: values.join('|'),
              allowReserved: param.allowReserved,
            },
          ];
        case 'deepObject':
          return values.map((value, index) => ({
            name: `${param.name}[${index}]`,
            value,
            allowReserved: param.allowReserved,
          }));
        case 'form':
        default:
          return explode
            ? values.map((value) => ({
                name: param.name,
                value,
                allowReserved: param.allowReserved,
              }))
            : [
                {
                  name: param.name,
                  value: values.join(','),
                  allowReserved: param.allowReserved,
                },
              ];
      }
    }

    if (this.isSerializableObject(param.value)) {
      const entries = Object.entries(
        param.value as Record<string, unknown>
      ).map(([key, value]) => ({
        name: key,
        value: this.parameterPrimitiveValue(value),
      }));

      switch (style) {
        case 'deepObject':
          return entries.map(({ name, value }) => ({
            name: `${param.name}[${name}]`,
            value,
            allowReserved: param.allowReserved,
          }));
        case 'form':
        default:
          return explode
            ? entries.map((entry) => ({
                ...entry,
                allowReserved: param.allowReserved,
              }))
            : [
                {
                  name: param.name,
                  value: entries
                    .flatMap(({ name, value }) => [name, value])
                    .join(','),
                  allowReserved: param.allowReserved,
                },
              ];
      }
    }

    return [
      {
        name: param.name,
        value: this.parameterPrimitiveValue(param.value),
        allowReserved: param.allowReserved,
      },
    ];
  }

  private encodeQueryComponent(value: string, allowReserved = false): string {
    let encoded = this.strictUriEncode(value);

    if (!allowReserved) {
      return encoded;
    }

    RESERVED_QUERY_CHARACTERS.forEach((char) => {
      encoded = encoded.split(this.strictUriEncode(char)).join(char);
    });

    return encoded;
  }

  private strictUriEncode(value: string): string {
    return encodeURIComponent(value).replace(
      /[!'()*]/g,
      (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`
    );
  }

  private serializeCookieParameter(
    param: ExampleOpenAPIParameter
  ): SerializedParameterEntry[] {
    const explode = param.explode ?? true;

    if (Array.isArray(param.value)) {
      const values = param.value.map((item) =>
        this.parameterPrimitiveValue(item)
      );

      return explode
        ? values.map((value) => ({ name: param.name, value }))
        : [{ name: param.name, value: values.join(',') }];
    }

    if (this.isSerializableObject(param.value)) {
      const entries = Object.entries(
        param.value as Record<string, unknown>
      ).map(([key, value]) => ({
        name: key,
        value: this.parameterPrimitiveValue(value),
      }));

      return explode
        ? entries
        : [
            {
              name: param.name,
              value: entries
                .flatMap(({ name, value }) => [name, value])
                .join(','),
            },
          ];
    }

    return [
      {
        name: param.name,
        value: this.parameterPrimitiveValue(param.value),
      },
    ];
  }

  private isJsonMediaType(contentType?: string): boolean {
    const normalized = this.normalizeMediaType(contentType);
    if (!normalized) {
      return false;
    }

    return normalized.includes('/json') || normalized.endsWith('+json');
  }

  private isXmlMediaType(contentType?: string): boolean {
    const normalized = this.normalizeMediaType(contentType);
    if (!normalized) {
      return false;
    }

    return normalized.includes('/xml') || normalized.endsWith('+xml');
  }

  private isSuccessResponseStatusCode(statusCode: string): boolean {
    const normalized = statusCode.trim().toUpperCase();
    return (
      normalized === '2XX' || this.isExactSuccessResponseStatusCode(statusCode)
    );
  }

  private isExactSuccessResponseStatusCode(statusCode: string): boolean {
    return /^2\d\d$/.test(statusCode.trim());
  }

  private normalizeMediaType(contentType?: string): string | undefined {
    const normalized = contentType?.split(';', 1)[0].trim().toLowerCase();
    return normalized || undefined;
  }

  private tokenizeIdentifier(value?: string): string[] {
    if (!value) {
      return [];
    }

    const normalized = value
      .trim()
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/[^A-Za-z0-9]+/g, ' ')
      .trim();

    if (!normalized) {
      return [];
    }

    return normalized
      .split(/\s+/)
      .map((token) => token.toLowerCase())
      .filter(Boolean);
  }

  private buildIdentifier(
    tokens: string[],
    style: 'camel' | 'pascal' | 'snake'
  ): string {
    if (tokens.length === 0) {
      return '';
    }

    if (style === 'snake') {
      return tokens.join('_');
    }

    const [firstToken, ...restTokens] = tokens;
    const capitalizedRest = restTokens.map((token) => this.capitalize(token));

    if (style === 'pascal') {
      return [this.capitalize(firstToken), ...capitalizedRest].join('');
    }

    return [firstToken, ...capitalizedRest].join('');
  }

  private capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  private isReservedIdentifier(value: string): boolean {
    return RESERVED_IDENTIFIERS.has(value);
  }
}
