import { BaseRequestCodeGenerator } from '@/openapi/generator/generator';
import {
  CodeGenerateContext,
  ExampleOpenAPIParameter,
  HttpMethod,
  Language,
  OpenAPIOperation,
} from '@/types';

export class OkHttpKotlinRequestCodeGenerator extends BaseRequestCodeGenerator {
  getLanguage(): Language {
    return 'kotlin';
  }

  getLibrary(): string {
    return 'okhttp';
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
    const usesSerializedQueryString =
      this.hasAllowReservedQueryParameters(queryParams);
    const queryEncodingImports =
      queryParams.length > 0 && !usesSerializedQueryString
        ? 'import java.net.URLEncoder\nimport java.nio.charset.StandardCharsets\n'
        : '';
    const expectedSuccessStatusCode =
      this.getExpectedSuccessStatusCode(context);
    const successStatusCheck = this.usesAny2xxSuccessStatus(context)
      ? 'response.code < 200 || response.code >= 300'
      : `response.code != ${expectedSuccessStatusCode}`;
    const responseHandlingCode = this.isBinaryResponse(context)
      ? `val data = response.body?.bytes() ?: ByteArray(0)
        println("Response bytes: \${data.size}")`
      : `println("Response: \${response.body?.string()}")`;

    return `import java.io.File
${queryEncodingImports}import okhttp3.*
import java.io.IOException

// ${operation.summary || operation.description || 'API request'}
fun ${operationId}() {
    val client = OkHttpClient()

    ${this.buildKotlinRequestCode(
      method,
      cookies,
      headers,
      queryParams,
      requestBody,
      this.escapeDoubleQuotedString(this.buildRequestUrl(baseUrl, path)),
      context
    )}

    client.newCall(request).execute().use { response ->
        if (${successStatusCheck}) throw IOException("Unexpected code $response")

        println("Status: \${response.code}")
        ${responseHandlingCode}
    }
}

fun main() {
    ${operationId}()
}`;
  }

  private buildKotlinRequestCode(
    method: HttpMethod,
    cookies: ExampleOpenAPIParameter[],
    headers: ExampleOpenAPIParameter[],
    queryParams: ExampleOpenAPIParameter[],
    requestBody: any,
    url: string,
    context: CodeGenerateContext
  ): string {
    let urlCode = `var url = "${url}"`;

    if (this.hasAllowReservedQueryParameters(queryParams)) {
      const serializedQuery = this.escapeDoubleQuoted(
        this.buildSerializedQueryString(queryParams)
      );

      return `${urlCode}
    url += (if (url.contains("?")) "&" else "?") + "${serializedQuery}"
    ${
      this.buildRequestBodyCode(method, requestBody, context)
        ? `${this.buildRequestBodyCode(method, requestBody, context)}\n    `
        : ''
    }val request = Request.Builder()
        .url(url)
${this.buildHeaderLines(cookies, headers)}
        ${
          this.hasRequestBody(method, requestBody)
            ? `.${method.toLowerCase()}(requestBody)`
            : `.${method.toLowerCase()}()`
        }
        .build()`;
    }

    const paramEntries = this.buildQueryParameterEntries(queryParams);

    if (paramEntries.length > 0) {
      urlCode += `\n    ${paramEntries
        .map(
          (param, index) =>
            `url += "${index === 0 ? '?' : '&'}${this.escapeDoubleQuoted(
              param.name
            )}=" + URLEncoder.encode("${this.escapeDoubleQuoted(
              param.value
            )}", StandardCharsets.UTF_8.toString())`
        )
        .join('\n    ')}`;
    }

    const requestBodyCode = this.buildRequestBodyCode(
      method,
      requestBody,
      context
    );
    const headerLines = this.buildHeaderLines(cookies, headers);
    const requestMethod = this.hasRequestBody(method, requestBody)
      ? `.${method.toLowerCase()}(requestBody)`
      : `.${method.toLowerCase()}()`;

    return `${urlCode}
    ${
      requestBodyCode ? `${requestBodyCode}\n    ` : ''
    }val request = Request.Builder()
        .url(url)
${headerLines}
        ${requestMethod}
        .build()`;
  }

  private buildRequestBodyCode(
    method: HttpMethod,
    requestBody: any,
    context: CodeGenerateContext
  ): string {
    if (!this.hasRequestBody(method, requestBody)) {
      return '';
    }

    if (this.isBinaryRequestBody(context)) {
      const contentType =
        context.requestContentType || 'application/octet-stream';
      return `val requestBody = RequestBody.create(
        MediaType.parse("${contentType}"),
        File("${this.escapeDoubleQuoted(
          this.getBinaryRequestBodyFileName(requestBody)
        )}").readBytes()
    )`;
    }

    if (this.usesStringRequestBody(context)) {
      const contentType = context.requestContentType || 'text/plain';
      return `val requestBody = RequestBody.create(
        MediaType.parse("${contentType}"),
        "${this.escapeDoubleQuoted(
          this.serializeStringRequestBody(requestBody, context)
        )}"
    )`;
    }

    if (this.isMultipartRequestBody(context)) {
      return this.buildMultipartRequestBodyCode(requestBody);
    }

    const contentType = context.requestContentType || 'application/json';
    return `val requestBody = RequestBody.create(
        MediaType.parse("${contentType}"),
        """${JSON.stringify(requestBody, null, 2)}""".trimIndent()
    )`;
  }

  private buildMultipartRequestBodyCode(requestBody: any): string {
    const fieldLines = this.getMultipartFieldParts(requestBody).map(
      (part) =>
        `        .addFormDataPart("${this.escapeDoubleQuoted(
          part.name
        )}", "${this.escapeDoubleQuoted(part.value)}")`
    );
    const filePart = this.getMultipartFileParts(requestBody)[0];
    const fileLines = filePart
      ? [
          `        .addFormDataPart("${this.escapeDoubleQuoted(
            filePart.name
          )}", "${this.escapeDoubleQuoted(
            filePart.filename || filePart.name
          )}", RequestBody.create(MediaType.parse("${this.escapeDoubleQuoted(
            filePart.contentType || 'application/octet-stream'
          )}"), "${this.escapeDoubleQuoted(filePart.value)}"))`,
        ]
      : [];

    return `val requestBody = MultipartBody.Builder()
        .setType(MultipartBody.FORM)
${[...fieldLines, ...fileLines].join('\n')}
        .build()`;
  }

  private buildHeaderLines(
    cookies: ExampleOpenAPIParameter[],
    headers: ExampleOpenAPIParameter[]
  ): string {
    const lines: string[] = [];

    headers.forEach((header) => {
      lines.push(
        `        .addHeader("${header.name}", "${this.escapeDoubleQuoted(
          this.serializeHeaderParameterValue(header)
        )}")`
      );
    });

    if (cookies.length > 0) {
      lines.push(
        `        .addHeader("Cookie", "${this.escapeDoubleQuoted(
          this.buildCookieHeaderValue(cookies)
        )}")`
      );
    }

    return lines.join('\n');
  }

  private hasRequestBody(method: HttpMethod, requestBody: any): boolean {
    return (
      ['POST', 'PUT', 'PATCH'].includes(method) &&
      requestBody !== undefined &&
      requestBody !== null
    );
  }

  private escapeDoubleQuoted(value: string): string {
    return value
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\r?\n/g, '\\n');
  }
}
