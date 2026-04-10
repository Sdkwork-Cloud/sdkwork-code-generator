import { BaseRequestCodeGenerator } from '@/openapi/generator/generator';
import {
  CodeGenerateContext,
  ExampleOpenAPIParameter,
  HttpMethod,
  Language,
  OpenAPIOperation,
} from '@/types';

export class UnirestJavaRequestCodeGenerator extends BaseRequestCodeGenerator {
  getLanguage(): Language {
    return 'java';
  }

  getLibrary(): string {
    return 'unirest';
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
    const handlesBinaryResponse = this.isBinaryResponse(context);
    const responseType = handlesBinaryResponse
      ? 'byte[]'
      : this.usesStringResponse(context)
      ? 'String'
      : 'JsonNode';
    const responseExecution = handlesBinaryResponse
      ? '.asBytes();'
      : this.usesStringResponse(context)
      ? '.asString();'
      : '.asJson();';
    const successStatusCode = this.getExpectedSuccessStatusCode(context);
    const successStatusCheck = this.usesAny2xxSuccessStatus(context)
      ? 'response.getStatus() < 200 || response.getStatus() >= 300'
      : `response.getStatus() != ${successStatusCode}`;
    const responseHandlingCode = handlesBinaryResponse
      ? `byte[] data = response.getBody();
        System.out.println("Response bytes: " + data.length);`
      : this.usesStringResponse(context)
      ? `String data = response.getBody();
        System.out.println("Response: " + data);`
      : `JSONObject data = response.getBody().getObject();
        System.out.println("Response: " + data);`;
    const usesSerializedQueryString =
      this.hasAllowReservedQueryParameters(queryParams);
    const queryParamsSetup = usesSerializedQueryString
      ? `String url = "${url}";
        ${this.buildSerializedQueryStringSetup(queryParams)}`
      : '';
    const requestTarget = usesSerializedQueryString ? 'url' : `"${url}"`;

    return `import kong.unirest.HttpResponse;
import kong.unirest.JsonNode;
import kong.unirest.Unirest;
import kong.unirest.json.JSONObject;
import java.io.File;
import java.nio.file.Files;
import java.nio.file.Paths;

/**
 * ${operation.summary || operation.description || 'API request'}
 * ${operation.description ? ` * ${operation.description}` : ''}
 */
public class ${className} {

    public static void main(String[] args) {
        try {
            ${methodName}();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public static void ${methodName}() throws Exception {
        ${this.buildBinaryRequestBodySetup(method, requestBody, context)}
        ${queryParamsSetup}
        HttpResponse<${responseType}> response = Unirest.${method.toLowerCase()}(${requestTarget})
            ${this.buildCookiesCode(cookies)}
            ${this.buildQueryParamsCode(queryParams)}
            ${this.buildHeadersCode(headers, method, requestBody, context)}
            ${this.buildRequestBodyCode(method, requestBody, context)}
            ${responseExecution}

        if (${successStatusCheck}) {
            throw new RuntimeException("HTTP error! status: " + response.getStatus());
        }

        ${responseHandlingCode}
    }
}`;
  }

  private buildCookiesCode(cookies: ExampleOpenAPIParameter[]): string {
    if (cookies.length === 0) {
      return '';
    }

    return `.header("Cookie", "${this.escapeDoubleQuoted(
      this.buildCookieHeaderValue(cookies)
    )}")`;
  }

  private buildQueryParamsCode(queryParams: ExampleOpenAPIParameter[]): string {
    if (this.hasAllowReservedQueryParameters(queryParams)) {
      return '';
    }

    const paramEntries = this.buildQueryParameterEntries(queryParams);

    if (paramEntries.length === 0) {
      return '';
    }

    return paramEntries
      .map(
        (param) =>
          `.queryString("${this.escapeDoubleQuoted(
            param.name
          )}", "${this.escapeDoubleQuoted(String(param.value))}")`
      )
      .join('\n            ');
  }

  private buildSerializedQueryStringSetup(
    queryParams: ExampleOpenAPIParameter[]
  ): string {
    return `url += (url.contains("?") ? "&" : "?") + "${this.escapeDoubleQuoted(
      this.buildSerializedQueryString(queryParams)
    )}";`;
  }

  private buildHeadersCode(
    headers: ExampleOpenAPIParameter[],
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

    return requestHeaders
      .map(
        (header) =>
          `.header("${header.name}", "${this.escapeDoubleQuoted(
            this.serializeHeaderParameterValue(header)
          )}")`
      )
      .join('\n            ');
  }

  private buildRequestBodyCode(
    method: HttpMethod,
    requestBody: any,
    context: CodeGenerateContext
  ): string {
    if (!this.hasRequestBody(method, requestBody)) {
      return '';
    }

    if (this.isMultipartRequestBody(context)) {
      return this.buildMultipartRequestBodyCode(requestBody);
    }

    if (this.isBinaryRequestBody(context)) {
      return '.body(requestBody)';
    }

    if (this.usesStringRequestBody(context)) {
      return `.body("${this.escapeDoubleQuoted(
        this.serializeStringRequestBody(requestBody, context)
      )}")`;
    }

    return `.body("${this.escapeDoubleQuoted(
      JSON.stringify(requestBody, null, 2)
    )}")`;
  }

  private buildMultipartRequestBodyCode(requestBody: any): string {
    const fieldLines = this.getMultipartFieldParts(requestBody).map(
      (part) =>
        `.field("${this.escapeDoubleQuoted(
          part.name
        )}", "${this.escapeDoubleQuoted(part.value)}")`
    );
    const filePart = this.getMultipartFileParts(requestBody)[0];
    const fileLines = filePart
      ? [
          `.field("${this.escapeDoubleQuoted(
            filePart.name
          )}", new File("${this.escapeDoubleQuoted(
            filePart.filename || filePart.name
          )}"), "${this.escapeDoubleQuoted(
            filePart.contentType || 'application/octet-stream'
          )}")`,
        ]
      : [];

    return [...fieldLines, ...fileLines].join('\n            ');
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

    return `byte[] requestBody = Files.readAllBytes(Paths.get("${this.escapeDoubleQuoted(
      this.getBinaryRequestBodyFileName(requestBody)
    )}"));`;
  }

  private toPascalCase(str: string): string {
    const words = str.split(/[_\-\s]/);
    return words
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
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
