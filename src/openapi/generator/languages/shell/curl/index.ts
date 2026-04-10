import { BaseRequestCodeGenerator } from '@/openapi/generator/generator';
import {
  CodeGenerateContext,
  ExampleOpenAPIParameter,
  HttpMethod,
  Language,
  OpenAPIOperation,
} from '@/types';

export class CurlShellRequestCodeGenerator extends BaseRequestCodeGenerator {
  getLanguage(): Language {
    return 'shell';
  }

  getLibrary(): string {
    return 'curl';
  }

  generateCode(
    path: string,
    method: HttpMethod,
    baseUrl: string,
    operation: OpenAPIOperation,
    cookies: ExampleOpenAPIParameter[],
    headers: ExampleOpenAPIParameter[],
    queryParams: ExampleOpenAPIParameter[],
    requestBody: any,
    context: CodeGenerateContext
  ): string {
    const url = this.buildUrl(baseUrl, path, queryParams);
    const expectedSuccessStatusCode =
      this.getExpectedSuccessStatusCode(context);
    const successStatusCheck = this.usesAny2xxSuccessStatus(context)
      ? 'if [ "$http_status" -lt 200 ] || [ "$http_status" -ge 300 ]; then'
      : `if [ "$http_status" -ne ${expectedSuccessStatusCode} ]; then`;
    const handlesBinaryResponse = this.isBinaryResponse(context);
    const outputVariable = handlesBinaryResponse
      ? 'output_file'
      : 'response_file';
    const outputSetupLines = handlesBinaryResponse
      ? [`output_file="./${this.buildBinaryOutputFileName(operation)}"`]
      : ['response_file=$(mktemp)', `trap 'rm -f "$response_file"' EXIT`];
    const successOutputLines = handlesBinaryResponse
      ? [
          'echo "Status: $http_status"',
          `echo "Saved binary response to $output_file"`,
          `echo "Response bytes: $(wc -c < "$output_file")"`,
        ]
      : [
          'echo "Status: $http_status"',
          'echo "Response:"',
          'cat "$response_file"',
        ];
    const lines = [
      '#!/usr/bin/env bash',
      `# ${operation.summary || operation.description || 'API request'}`,
      'set -euo pipefail',
      '',
      ...outputSetupLines,
      `http_status=$(curl \\`,
      `  -X ${method} \\`,
      `  '${this.escapeSingleQuoted(url)}' \\`,
      ...this.buildHeaderLines(method, headers, context, requestBody),
      ...this.buildCookieLines(cookies),
      ...this.buildBodyLines(method, requestBody, context),
      '  --silent --show-error \\',
      `  --output "$${outputVariable}" \\`,
      "  --write-out '%{http_code}')",
      successStatusCheck,
      '  echo "HTTP error! status: $http_status" >&2',
      `  if [ -s "$${outputVariable}" ]; then`,
      `    cat "$${outputVariable}" >&2`,
      '  fi',
      '  exit 1',
      'fi',
      ...successOutputLines,
    ];

    return lines.join('\n');
  }

  private buildUrl(
    baseUrl: string,
    path: string,
    queryParams: ExampleOpenAPIParameter[]
  ): string {
    if (this.hasAllowReservedQueryParameters(queryParams)) {
      const queryString = this.buildSerializedQueryString(queryParams);
      const base = this.buildRequestUrl(baseUrl, path);
      const separator = base.includes('?') ? '&' : '?';
      return queryString ? `${base}${separator}${queryString}` : base;
    }

    const url = new URL(this.buildRequestUrl(baseUrl, path));
    this.buildQueryParameterEntries(queryParams).forEach((param) =>
      url.searchParams.append(param.name, param.value)
    );
    return url.toString();
  }

  private buildHeaderLines(
    method: HttpMethod,
    headers: ExampleOpenAPIParameter[],
    context: CodeGenerateContext,
    requestBody: any
  ): string[] {
    const lines = headers.map(
      (header) =>
        `  -H '${this.escapeSingleQuoted(
          `${header.name}: ${this.serializeHeaderParameterValue(header)}`
        )}' \\`
    );

    if (
      this.hasRequestBodyValue(method, requestBody) &&
      this.shouldAutoAddContentTypeHeader(context) &&
      !headers.some((header) => header.name.toLowerCase() === 'content-type')
    ) {
      lines.push(
        `  -H '${this.escapeSingleQuoted(
          `Content-Type: ${context.requestContentType}`
        )}' \\`
      );
    }

    return lines;
  }

  private buildCookieLines(cookies: ExampleOpenAPIParameter[]): string[] {
    if (cookies.length === 0) {
      return [];
    }

    const cookieValue = this.buildCookieHeaderValue(cookies);

    return [`  --cookie '${this.escapeSingleQuoted(cookieValue)}' \\`];
  }

  private buildBodyLines(
    method: HttpMethod,
    requestBody: any,
    context: CodeGenerateContext
  ): string[] {
    if (!this.hasRequestBodyValue(method, requestBody)) {
      return [];
    }

    if (this.isMultipartRequestBody(context)) {
      return this.getMultipartParts(requestBody).map((part) =>
        part.kind === 'file'
          ? `  -F '${this.escapeSingleQuoted(
              `${part.name}=@${part.filename || part.name};type=${
                part.contentType || 'application/octet-stream'
              }`
            )}' \\`
          : `  -F '${this.escapeSingleQuoted(`${part.name}=${part.value}`)}' \\`
      );
    }

    if (this.isBinaryRequestBody(context)) {
      return [
        `  --data-binary '@${this.escapeSingleQuoted(
          this.getBinaryRequestBodyFileName(requestBody)
        )}' \\`,
      ];
    }

    if (this.usesStringRequestBody(context)) {
      return [
        `  --data-raw '${this.escapeSingleQuoted(
          this.serializeStringRequestBody(requestBody, context)
        )}' \\`,
      ];
    }

    const body =
      typeof requestBody === 'string'
        ? requestBody
        : JSON.stringify(requestBody, null, 2);

    return [`  --data-raw '${this.escapeSingleQuoted(body)}' \\`];
  }

  private escapeSingleQuoted(value: string): string {
    return value.replace(/'/g, `'\"'\"'`);
  }

  private buildBinaryOutputFileName(operation: OpenAPIOperation): string {
    const operationId = operation.operationId || 'response';
    const sanitized = operationId.replace(/[^a-zA-Z0-9_-]/g, '');

    return `${sanitized || 'response'}.bin`;
  }
}
