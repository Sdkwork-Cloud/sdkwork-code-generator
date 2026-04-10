import { BaseRequestCodeGenerator } from '@/openapi/generator/generator';
import {
  CodeGenerateContext,
  ExampleOpenAPIParameter,
  HttpMethod,
  Language,
  OpenAPIOperation,
} from '@/types';

export class GuzzlePhpRequestCodeGenerator extends BaseRequestCodeGenerator {
  getLanguage(): Language {
    return 'php';
  }

  getLibrary(): string {
    return 'guzzle';
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
      ? '$response->getStatusCode() < 200 || $response->getStatusCode() >= 300'
      : `$response->getStatusCode() != ${expectedSuccessStatusCode}`;
    const requestBodySetup = this.buildBinaryRequestBodySetup(
      method,
      requestBody,
      context
    );
    const responseHandlingCode = this.isBinaryResponse(context)
      ? `$data = $response->getBody()->getContents();
        echo "Response bytes: " . strlen($data) . "\\n";

        return $data;`
      : this.usesStringResponse(context)
      ? `$data = (string) $response->getBody();
        echo "Response: " . $data . "\\n";

        return $data;`
      : `$data = json_decode($response->getBody(), true);
        echo "Response: " . $response->getBody() . "\\n";

        return $data;`;

    return `<?php
require_once 'vendor/autoload.php';

use GuzzleHttp\\Client;
use GuzzleHttp\\Exception\\RequestException;

/**
 * ${operation.summary || operation.description || 'API request'}
 */
function ${operationId}() {
    $client = new Client();

    $url = "${url}";
    ${this.buildQueryParamsCode(queryParams)}
${requestBodySetup}
    $options = [
        ${this.buildRequestOptions(
          method,
          cookies,
          headers,
          requestBody,
          context
        )}
    ];

    try {
        $response = $client->request('${method}', $url, $options);

        if (${successStatusCheck}) {
            throw new RuntimeException("HTTP error! status: " . $response->getStatusCode());
        }

        echo "Status: " . $response->getStatusCode() . "\\n";
        ${responseHandlingCode}
    } catch (RequestException $e) {
        echo "Error: " . $e->getMessage() . "\\n";
        throw $e;
    }
}

${operationId}();
?>`;
  }

  private buildRequestOptions(
    method: HttpMethod,
    cookies: ExampleOpenAPIParameter[],
    headers: ExampleOpenAPIParameter[],
    requestBody: any,
    context: CodeGenerateContext
  ): string {
    const options: string[] = [];
    const requestHeaders = [...headers];

    if (cookies.length > 0) {
      requestHeaders.push({
        name: 'Cookie',
        in: 'header',
        required: false,
        schema: { type: 'string' },
        value: this.buildCookieHeaderValue(cookies),
      });
    }

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

    if (requestHeaders.length > 0) {
      options.push(`'headers' => ${this.buildHeadersObject(requestHeaders)}`);
    }

    if (this.hasRequestBody(method, requestBody)) {
      if (this.isMultipartRequestBody(context)) {
        options.push(this.buildMultipartOption(requestBody));
      } else if (this.isBinaryRequestBody(context)) {
        options.push(`'body' => $requestBody`);
      } else if (this.usesStringRequestBody(context)) {
        options.push(
          `'body' => '${this.escapeSingleQuoted(
            this.serializeStringRequestBody(requestBody, context)
          )}'`
        );
      } else {
        options.push(
          `'body' => '${this.escapeSingleQuoted(
            JSON.stringify(requestBody, null, 2)
          )}'`
        );
      }
    }

    return options.join(',\n        ');
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

  private buildHeadersObject(headers: ExampleOpenAPIParameter[]): string {
    const headerEntries = headers.map(
      (header) =>
        `'${this.escapeSingleQuoted(
          header.name
        )}' => '${this.escapeSingleQuoted(
          this.serializeHeaderParameterValue(header)
        )}'`
    );

    return `[\n            ${headerEntries.join(',\n            ')}\n        ]`;
  }
  private buildMultipartOption(requestBody: any): string {
    const fieldEntries = this.getMultipartFieldParts(requestBody).map(
      (part) =>
        `[
                'name' => '${this.escapeSingleQuoted(part.name)}',
                'contents' => '${this.escapeSingleQuoted(part.value)}'
            ]`
    );
    const filePart = this.getMultipartFileParts(requestBody)[0];
    const fileEntries = filePart
      ? [
          `[
                'name' => '${this.escapeSingleQuoted(filePart.name)}',
                'contents' => '${this.escapeSingleQuoted(filePart.value)}',
                'filename' => '${this.escapeSingleQuoted(
                  filePart.filename || filePart.name
                )}',
                'headers' => [
                    'Content-Type' => '${this.escapeSingleQuoted(
                      filePart.contentType || 'application/octet-stream'
                    )}'
                ]
            ]`,
        ]
      : [];

    return `'multipart' => [\n            ${[
      ...fieldEntries,
      ...fileEntries,
    ].join(',\n            ')}\n        ]`;
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

    return `    $requestBody = fopen('${this.escapeSingleQuoted(
      this.getBinaryRequestBodyFileName(requestBody)
    )}', 'rb');`;
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
