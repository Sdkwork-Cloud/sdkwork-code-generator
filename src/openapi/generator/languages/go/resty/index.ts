import { BaseRequestCodeGenerator } from '@/openapi/generator/generator';
import {
  CodeGenerateContext,
  ExampleOpenAPIParameter,
  HttpMethod,
  Language,
  OpenAPIOperation,
} from '@/types';

export class RestyGoRequestCodeGenerator extends BaseRequestCodeGenerator {
  getLanguage(): Language {
    return 'go';
  }

  getLibrary(): string {
    return 'resty';
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
    const restyMethod = this.toPascalHttpMethod(method);
    const url = this.escapeDoubleQuotedString(
      this.buildRequestUrl(baseUrl, path)
    );
    const queryEncodingImport =
      queryParams.length > 0 &&
      !this.hasAllowReservedQueryParameters(queryParams)
        ? '    neturl "net/url"\n'
        : '';
    const expectedSuccessStatusCode =
      this.getExpectedSuccessStatusCode(context);
    const successStatusCheck = this.usesAny2xxSuccessStatus(context)
      ? 'resp.StatusCode() < 200 || resp.StatusCode() >= 300'
      : `resp.StatusCode() != ${expectedSuccessStatusCode}`;
    const handlesBinaryResponse = this.isBinaryResponse(context);
    const responseType = handlesBinaryResponse
      ? '[]byte'
      : this.usesStringResponse(context)
      ? 'string'
      : 'map[string]interface{}';
    const errorReturnValue = handlesBinaryResponse
      ? 'nil'
      : this.usesStringResponse(context)
      ? '""'
      : 'nil';
    const responseHandlingCode = handlesBinaryResponse
      ? `data := append([]byte(nil), resp.Body()...)
    fmt.Printf("Response bytes: %d\\n", len(data))
    return data, nil`
      : this.usesStringResponse(context)
      ? `data := string(resp.Body())
    fmt.Println("Response:", data)
    return data, nil`
      : `var data map[string]interface{}
    err = json.Unmarshal(resp.Body(), &data)
    if err != nil {
        return ${errorReturnValue}, fmt.Errorf("JSON unmarshal failed: %v", err)
    }

    fmt.Println("Response:", data)
    return data, nil`;

    return `package main

import (
    "encoding/json"
    "fmt"
    "log"
${queryEncodingImport}    "os"
    "strings"
    "github.com/go-resty/resty/v2"
)

/*
${operation.summary || operation.description || 'API request'}
${operation.description || ''}
*/

func ${operationId}() (${responseType}, error) {
    client := resty.New()
    url := "${url}"
    req := client.R()

    ${this.buildQueryParamsCode(queryParams)}

    ${this.buildCookiesCode(cookies, 'req')}
    ${this.buildHeadersCode(headers, 'req', method, requestBody, context)}
    ${this.buildRequestBodyCode(method, requestBody, 'req', context)}

    resp, err := req.${restyMethod}(url)
    if err != nil {
        return ${errorReturnValue}, fmt.Errorf("HTTP request failed: %v", err)
    }

    if ${successStatusCheck} {
        return ${errorReturnValue}, fmt.Errorf("HTTP error! status: %d", resp.StatusCode())
    }

    ${responseHandlingCode}
}

func main() {
    result, err := ${operationId}()
    if err != nil {
        log.Fatal(err)
    }
    ${
      handlesBinaryResponse
        ? 'fmt.Printf("Success: %d bytes\\n", len(result))'
        : 'fmt.Println("Success:", result)'
    }
}`;
  }

  private buildCookiesCode(
    cookies: ExampleOpenAPIParameter[],
    reqVar: string
  ): string {
    if (cookies.length === 0) {
      return '';
    }

    const cookieValue = this.buildCookieHeaderValue(cookies);

    return `${reqVar}.SetHeader("Cookie", "${this.escapeDoubleQuoted(
      cookieValue
    )}")`;
  }

  private buildQueryParamsCode(queryParams: ExampleOpenAPIParameter[]): string {
    if (this.hasAllowReservedQueryParameters(queryParams)) {
      return `url += "?${this.escapeDoubleQuoted(
        this.buildSerializedQueryString(queryParams)
      )}"`;
    }

    const paramEntries = this.buildQueryParameterEntries(queryParams);

    if (paramEntries.length === 0) {
      return '';
    }

    return `q := neturl.Values{}
${paramEntries
  .map(
    (param) =>
      `q.Add("${this.escapeDoubleQuoted(
        param.name
      )}", "${this.escapeDoubleQuoted(param.value)}")`
  )
  .join('\n')}
    url += "?" + q.Encode()`;
  }

  private buildHeadersCode(
    headers: ExampleOpenAPIParameter[],
    reqVar: string,
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
          `${reqVar}.SetHeader("${header.name}", "${this.escapeDoubleQuoted(
            this.serializeHeaderParameterValue(header)
          )}")`
      )
      .join('\n    ');
  }

  private buildRequestBodyCode(
    method: HttpMethod,
    requestBody: any,
    reqVar: string,
    context: CodeGenerateContext
  ): string {
    if (!this.hasRequestBody(method, requestBody)) {
      return '';
    }

    if (this.isMultipartRequestBody(context)) {
      const fieldParts = this.getMultipartFieldParts(requestBody);
      const fileLines = this.getMultipartFileParts(requestBody).map(
        (part) =>
          `${reqVar}.SetFileReader("${this.escapeDoubleQuoted(
            part.name
          )}", "${this.escapeDoubleQuoted(
            part.filename || part.name
          )}", strings.NewReader("${this.escapeDoubleQuoted(part.value)}"))`
      );

      return `${reqVar}.SetFormData(map[string]string{
        ${fieldParts
          .map(
            (part) =>
              `"${this.escapeDoubleQuoted(
                part.name
              )}": "${this.escapeDoubleQuoted(part.value)}"`
          )
          .join(',\n        ')}
    })
    ${fileLines.join('\n    ')}`;
    }

    if (this.isBinaryRequestBody(context)) {
      return `requestBody, err := os.ReadFile("${this.escapeDoubleQuoted(
        this.getBinaryRequestBodyFileName(requestBody)
      )}")
    if err != nil {
        return ${
          this.usesStringResponse(context) ? '""' : 'nil'
        }, fmt.Errorf("reading request body failed: %v", err)
    }
    ${reqVar}.SetBody(requestBody)`;
    }

    if (this.usesStringRequestBody(context)) {
      return `${reqVar}.SetBody(${this.toGoStringLiteral(
        this.serializeStringRequestBody(requestBody, context)
      )})`;
    }

    return `${reqVar}.SetBody(${this.toGoStringLiteral(
      JSON.stringify(requestBody, null, 2)
    )})`;
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
