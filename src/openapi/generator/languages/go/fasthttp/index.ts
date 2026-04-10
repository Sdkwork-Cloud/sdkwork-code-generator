import { BaseRequestCodeGenerator } from '@/openapi/generator/generator';
import {
  CodeGenerateContext,
  ExampleOpenAPIParameter,
  HttpMethod,
  Language,
  OpenAPIOperation,
} from '@/types';

export class FasthttpGoRequestCodeGenerator extends BaseRequestCodeGenerator {
  getLanguage(): Language {
    return 'go';
  }

  getLibrary(): string {
    return 'fasthttp';
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
    const queryEncodingImport =
      queryParams.length > 0 &&
      !this.hasAllowReservedQueryParameters(queryParams)
        ? '    neturl "net/url"\n'
        : '';
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
    "bytes"
    "encoding/json"
    "fmt"
    "log"
    "mime/multipart"
${queryEncodingImport}    "os"
    "github.com/valyala/fasthttp"
)

/*
${operation.summary || operation.description || 'API request'}
${operation.description || ''}
*/

func ${operationId}() (${responseType}, error) {
    url := "${url}"
    ${this.buildQueryParamsCode(queryParams)}

    req := fasthttp.AcquireRequest()
    defer fasthttp.ReleaseRequest(req)

    resp := fasthttp.AcquireResponse()
    defer fasthttp.ReleaseResponse(resp)

    req.Header.SetMethod("${method.toUpperCase()}")
    req.SetRequestURI(url)

    ${this.buildCookiesCode(cookies, 'req')}
    ${this.buildHeadersCode(headers, 'req', method, requestBody, context)}
    ${this.buildRequestBodyCode(method, requestBody, 'req', context)}

    err := fasthttp.Do(req, resp)
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

    return `${reqVar}.Header.Set("Cookie", "${this.escapeDoubleQuoted(
      this.buildCookieHeaderValue(cookies)
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

    return paramEntries
      .map(
        (param, index) =>
          `url += "${index === 0 ? '?' : '&'}${this.escapeDoubleQuoted(
            param.name
          )}=" + neturl.QueryEscape("${this.escapeDoubleQuoted(param.value)}")`
      )
      .join('\n    ');
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
          `${reqVar}.Header.Set("${header.name}", "${this.escapeDoubleQuoted(
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
      const fieldLines = this.getMultipartFieldParts(requestBody).map(
        (part) =>
          `err = writer.WriteField("${this.escapeDoubleQuoted(
            part.name
          )}", "${this.escapeDoubleQuoted(
            part.value
          )}")\n    if err != nil {\n        return ${
            this.usesStringResponse(context) ? '""' : 'nil'
          }, fmt.Errorf("writing form field failed: %v", err)\n    }`
      );
      const fileParts = this.getMultipartFileParts(requestBody);
      const fileLines = fileParts.flatMap((part, index) => [
        `${
          index === 0 ? 'part' : `part${index}`
        }, err := writer.CreateFormFile("${this.escapeDoubleQuoted(
          part.name
        )}", "${this.escapeDoubleQuoted(part.filename || part.name)}")`,
        `if err != nil {\n        return ${
          this.usesStringResponse(context) ? '""' : 'nil'
        }, fmt.Errorf("creating file part failed: %v", err)\n    }`,
        `_, err = ${
          index === 0 ? 'part' : `part${index}`
        }.Write([]byte("${this.escapeDoubleQuoted(part.value)}"))`,
        `if err != nil {\n        return ${
          this.usesStringResponse(context) ? '""' : 'nil'
        }, fmt.Errorf("writing file part failed: %v", err)\n    }`,
      ]);

      return `var body bytes.Buffer
    writer := multipart.NewWriter(&body)
    ${fieldLines.join('\n    ')}
    ${fileLines.join('\n    ')}
    err = writer.Close()
    if err != nil {
        return ${
          this.usesStringResponse(context) ? '""' : 'nil'
        }, fmt.Errorf("closing multipart writer failed: %v", err)
    }
    ${reqVar}.Header.SetContentType(writer.FormDataContentType())
    ${reqVar}.SetBody(body.Bytes())`;
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
    ${reqVar}.SetBodyRaw(requestBody)`;
    }

    if (this.usesStringRequestBody(context)) {
      return `${reqVar}.SetBodyString(${this.toGoStringLiteral(
        this.serializeStringRequestBody(requestBody, context)
      )})`;
    }

    return `${reqVar}.SetBodyString(${this.toGoStringLiteral(
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
