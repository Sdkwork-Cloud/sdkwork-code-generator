import { BaseRequestCodeGenerator } from '@/openapi/generator/generator';
import {
  CodeGenerateContext,
  ExampleOpenAPIParameter,
  HttpMethod,
  Language,
  OpenAPIOperation,
} from '@/types';

export class OkHttpJavaRequestCodeGenerator extends BaseRequestCodeGenerator {
  getLanguage(): Language {
    return 'java';
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
    return this.generateJavaClass(
      baseUrl,
      path,
      method,
      cookies,
      headers,
      queryParams,
      requestBody,
      operation,
      context
    );
  }

  private generateJavaClass(
    baseUrl: string,
    path: string,
    method: HttpMethod,
    cookies: ExampleOpenAPIParameter[],
    headers: ExampleOpenAPIParameter[],
    queryParams: ExampleOpenAPIParameter[],
    requestBody: any,
    operation: OpenAPIOperation,
    context: CodeGenerateContext
  ): string {
    const className = this.toIdentifier(
      operation.operationId,
      'ApiRequest',
      'pascal'
    );
    const methodName = this.toIdentifier(
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
      ? 'response.code() < 200 || response.code() >= 300'
      : `response.code() != ${expectedSuccessStatusCode}`;
    const responseHandlingCode = this.isBinaryResponse(context)
      ? `byte[] data = response.body().bytes();
            System.out.println("Response bytes: " + data.length);`
      : `System.out.println("Response: " + response.body().string());`;
    const requestBodySetup = this.hasRequestBody(method, requestBody)
      ? this.buildRequestBodySetup(requestBody, context)
      : '';
    const requestMethod = this.hasRequestBody(method, requestBody)
      ? `.${method.toLowerCase()}(requestBody)`
      : `.${method.toLowerCase()}()`;

    return `import java.nio.file.Files;
import java.nio.file.Paths;
import okhttp3.*;

public class ${className} {

    private static final OkHttpClient client = new OkHttpClient();

    /**
     * ${operation.summary || operation.description || 'API request'}
     */
    public static void ${methodName}() throws Exception {
        HttpUrl.Builder urlBuilder = HttpUrl.parse("${url}").newBuilder();
        ${this.buildQueryParamsCode(queryParams)}

        ${requestBodySetup}
        Request.Builder requestBuilder = new Request.Builder()
            .url(urlBuilder.build())
            ${requestMethod};

        ${this.buildCookiesCode(cookies)}
        ${this.buildHeadersCode(headers)}

        Request request = requestBuilder.build();

        try (Response response = client.newCall(request).execute()) {
            if (${successStatusCheck}) {
                throw new RuntimeException("Unexpected code " + response);
            }

            System.out.println("Status: " + response.code());
            ${responseHandlingCode}
        }
    }

    public static void main(String[] args) {
        try {
            ${methodName}();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}`;
  }

  private buildQueryParamsCode(queryParams: ExampleOpenAPIParameter[]): string {
    const paramEntries = this.buildQueryParameterEntries(queryParams);

    if (paramEntries.length === 0) {
      return '';
    }

    if (this.hasAllowReservedQueryParameters(queryParams)) {
      return paramEntries
        .map(
          (param) =>
            `urlBuilder.addEncodedQueryParameter("${this.escapeDoubleQuoted(
              param.name
            )}", "${this.escapeDoubleQuoted(
              this.encodeQueryParameterValue(param.value, param.allowReserved)
            )}");`
        )
        .join('\n        ');
    }

    return paramEntries
      .map(
        (param) =>
          `urlBuilder.addQueryParameter("${this.escapeDoubleQuoted(
            param.name
          )}", "${this.escapeDoubleQuoted(param.value)}");`
      )
      .join('\n        ');
  }

  private buildRequestBodySetup(
    requestBody: any,
    context: CodeGenerateContext
  ): string {
    if (this.isBinaryRequestBody(context)) {
      const contentType =
        context.requestContentType || 'application/octet-stream';
      return `RequestBody requestBody = RequestBody.create(MediaType.parse("${contentType}"), Files.readAllBytes(Paths.get("${this.escapeDoubleQuoted(
        this.getBinaryRequestBodyFileName(requestBody)
      )}")));`;
    }

    if (this.usesStringRequestBody(context)) {
      const contentType = context.requestContentType || 'text/plain';
      return `RequestBody requestBody = RequestBody.create(MediaType.parse("${contentType}"), "${this.escapeDoubleQuoted(
        this.serializeStringRequestBody(requestBody, context)
      )}");`;
    }

    if (this.isMultipartRequestBody(context)) {
      return this.buildMultipartRequestBodySetup(requestBody);
    }

    const jsonBody = JSON.stringify(requestBody, null, 2).replace(/"/g, '\\"');
    const contentType = context.requestContentType || 'application/json';
    return `RequestBody requestBody = RequestBody.create(
            MediaType.parse("${contentType}"),
            "${jsonBody}");`;
  }

  private buildMultipartRequestBodySetup(requestBody: any): string {
    const fieldLines = this.getMultipartFieldParts(requestBody).map(
      (part) =>
        `            .addFormDataPart("${this.escapeDoubleQuoted(
          part.name
        )}", "${this.escapeDoubleQuoted(part.value)}")`
    );
    const filePart = this.getMultipartFileParts(requestBody)[0];
    const fileLines = filePart
      ? [
          `            .addFormDataPart("${this.escapeDoubleQuoted(
            filePart.name
          )}", "${this.escapeDoubleQuoted(
            filePart.filename || filePart.name
          )}", RequestBody.create(MediaType.parse("${this.escapeDoubleQuoted(
            filePart.contentType || 'application/octet-stream'
          )}"), "${this.escapeDoubleQuoted(filePart.value)}".getBytes()))`,
        ]
      : [];

    return `RequestBody requestBody = new MultipartBody.Builder()
            .setType(MultipartBody.FORM)
${[...fieldLines, ...fileLines].join('\n')}
            .build();`;
  }

  private buildHeadersCode(headers: ExampleOpenAPIParameter[]): string {
    if (headers.length === 0) {
      return '';
    }

    return headers
      .map(
        (header) =>
          `requestBuilder.addHeader("${
            header.name
          }", "${this.escapeDoubleQuoted(
            this.serializeHeaderParameterValue(header)
          )}");`
      )
      .join('\n        ');
  }

  private buildCookiesCode(cookies: ExampleOpenAPIParameter[]): string {
    if (cookies.length === 0) {
      return '';
    }

    return `requestBuilder.addHeader("Cookie", "${this.escapeDoubleQuoted(
      this.buildCookieHeaderValue(cookies)
    )}");`;
  }

  private toCamelCase(str: string, firstUpper: boolean): string {
    const words = str.split(/[_\-\s]/);
    return words
      .map((word, index) => {
        if (index === 0 && !firstUpper) {
          return word.toLowerCase();
        }
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join('');
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
