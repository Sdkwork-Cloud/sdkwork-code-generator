import { BaseRequestCodeGenerator } from '@/openapi/generator/generator';
import {
  CodeGenerateContext,
  ExampleOpenAPIParameter,
  HttpMethod,
  Language,
  OpenAPIOperation,
} from '@/types';

export class CurlPhpRequestCodeGenerator extends BaseRequestCodeGenerator {
  getLanguage(): Language {
    return 'php';
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
    const operationId = this.toIdentifier(
      operation.operationId,
      'apiRequest',
      'camel'
    );
    const url = this.escapeDoubleQuotedString(
      this.buildRequestUrl(baseUrl, path)
    );
    const expectedSuccessStatusCode =
      this.getExpectedSuccessStatusCode(context);
    const successStatusCheck = this.usesAny2xxSuccessStatus(context)
      ? '$http_code < 200 || $http_code >= 300'
      : `$http_code != ${expectedSuccessStatusCode}`;
    const requestBodySetup = this.buildBinaryRequestBodySetup(
      method,
      requestBody,
      context
    );
    const responseHandlingCode = this.isBinaryResponse(context)
      ? `$data = $response;
    echo 'Response bytes: ' . strlen($data) . PHP_EOL;
    return $data;`
      : this.usesStringResponse(context)
      ? `$data = $response;
    echo 'Response: ' . $data . PHP_EOL;
    return $data;`
      : `$data = json_decode($response, true);
    echo 'Response: ' . print_r($data, true) . PHP_EOL;
    return $data;`;

    return `<?php
/**
 * ${operation.summary || operation.description || 'API request'}
 * ${operation.description ? ` * ${operation.description}` : ''}
 */

function ${operationId}() {
    $url = "${url}";
    ${this.buildQueryParamsCode(queryParams)}
${requestBodySetup}

    $ch = curl_init();

    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, '${method.toUpperCase()}');

    ${this.buildCookiesCode(cookies, '$ch')}
    ${this.buildHeadersCode(headers, '$ch', method, requestBody, context)}
    ${this.buildRequestBodyCode(method, requestBody, '$ch', context)}

    $response = curl_exec($ch);

    if (curl_errno($ch)) {
        throw new Exception('cURL Error: ' . curl_error($ch));
    }

    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    if (${successStatusCheck}) {
        throw new Exception('HTTP error! status: ' . $http_code);
    }

    curl_close($ch);

    ${responseHandlingCode}
}

${operationId}();
?>`;
  }

  private buildCookiesCode(
    cookies: ExampleOpenAPIParameter[],
    chVar: string
  ): string {
    if (cookies.length === 0) {
      return '';
    }

    return `curl_setopt(${chVar}, CURLOPT_COOKIE, '${this.escapeSingleQuoted(
      this.buildCookieHeaderValue(cookies)
    )}');`;
  }

  private buildQueryParamsCode(queryParams: ExampleOpenAPIParameter[]): string {
    if (this.hasAllowReservedQueryParameters(queryParams)) {
      return `$url .= (strpos($url, '?') !== false ? '&' : '?') . '${this.escapeSingleQuoted(
        this.buildSerializedQueryString(queryParams)
      )}';`;
    }

    const paramEntries = this.buildQueryParameterEntries(queryParams);

    if (paramEntries.length === 0) {
      return '';
    }

    return paramEntries
      .map(
        (param) =>
          `$url .= (strpos($url, '?') !== false ? '&' : '?') . '${this.escapeSingleQuoted(
            param.name
          )}=' . urlencode('${this.escapeSingleQuoted(param.value)}');`
      )
      .join('\n    ');
  }

  private buildHeadersCode(
    headers: ExampleOpenAPIParameter[],
    chVar: string,
    method: HttpMethod,
    requestBody: any,
    context: CodeGenerateContext
  ): string {
    const requestHeaders = [...headers];

    if (
      this.hasRequestBody(method, requestBody) &&
      this.shouldAutoAddContentTypeHeader(context) &&
      !requestHeaders.some(
        (header) => header.name.toLowerCase() === 'content-type'
      )
    ) {
      requestHeaders.push({
        name: 'Content-Type',
        in: 'header',
        required: false,
        schema: { type: 'string' },
        value: context.requestContentType,
      });
    }

    if (requestHeaders.length === 0) {
      return '';
    }

    const headerEntries = requestHeaders.map(
      (header) =>
        `'${this.escapeSingleQuoted(header.name)}: ${this.escapeSingleQuoted(
          this.serializeHeaderParameterValue(header)
        )}'`
    );

    return `curl_setopt(${chVar}, CURLOPT_HTTPHEADER, [\n        ${headerEntries.join(
      ',\n        '
    )}\n    ]);`;
  }

  private buildRequestBodyCode(
    method: HttpMethod,
    requestBody: any,
    chVar: string,
    context: CodeGenerateContext
  ): string {
    if (!this.hasRequestBody(method, requestBody)) {
      return '';
    }

    if (this.isMultipartRequestBody(context)) {
      return this.buildMultipartRequestBodyCode(requestBody, chVar);
    }

    if (this.isBinaryRequestBody(context)) {
      return `curl_setopt(${chVar}, CURLOPT_POSTFIELDS, $requestBody);`;
    }

    if (this.usesStringRequestBody(context)) {
      return `curl_setopt(${chVar}, CURLOPT_POSTFIELDS, '${this.escapeSingleQuoted(
        this.serializeStringRequestBody(requestBody, context)
      )}');`;
    }

    return `curl_setopt(${chVar}, CURLOPT_POSTFIELDS, '${this.escapeSingleQuoted(
      JSON.stringify(requestBody, null, 2)
    )}');`;
  }

  private buildMultipartRequestBodyCode(
    requestBody: any,
    chVar: string
  ): string {
    const fieldLines = this.getMultipartFieldParts(requestBody).map(
      (part) =>
        `    '${this.escapeSingleQuoted(
          part.name
        )}' => '${this.escapeSingleQuoted(part.value)}'`
    );
    const filePart = this.getMultipartFileParts(requestBody)[0];
    const fileLines = filePart
      ? [
          `    '${this.escapeSingleQuoted(
            filePart.name
          )}' => new CURLFile('${this.escapeSingleQuoted(
            filePart.filename || filePart.name
          )}', '${this.escapeSingleQuoted(
            filePart.contentType || 'application/octet-stream'
          )}', '${this.escapeSingleQuoted(
            filePart.filename || filePart.name
          )}')`,
        ]
      : [];

    return `$postFields = [\n${[...fieldLines, ...fileLines].join(
      ',\n'
    )}\n];\n    curl_setopt(${chVar}, CURLOPT_POSTFIELDS, $postFields);`;
  }

  private buildBinaryRequestBodySetup(
    method: HttpMethod,
    requestBody: any,
    context: CodeGenerateContext
  ): string {
    if (
      !this.hasRequestBody(method, requestBody) ||
      !this.isBinaryRequestBody(context)
    ) {
      return '';
    }

    return `    $requestBody = file_get_contents('${this.escapeSingleQuoted(
      this.getBinaryRequestBodyFileName(requestBody)
    )}');`;
  }

  private hasRequestBody(method: HttpMethod, requestBody: any): boolean {
    return (
      ['POST', 'PUT', 'PATCH'].includes(method) &&
      requestBody !== undefined &&
      requestBody !== null
    );
  }

  private escapeSingleQuoted(value: string): string {
    return value
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/\r?\n/g, '\\n');
  }
}
