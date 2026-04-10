import { BaseRequestCodeGenerator } from '@/openapi/generator/generator';
import {
  CodeGenerateContext,
  ExampleOpenAPIParameter,
  HttpMethod,
  Language,
  OpenAPIOperation,
} from '@/types';

export class NetHttpGoRequestCodeGenerator extends BaseRequestCodeGenerator {
  getLanguage(): Language {
    return 'go';
  }

  getLibrary(): string {
    return 'net/http';
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
    const packageCode = this.generatePackageCode(queryParams);
    const functionCode = this.generateFunctionCode(
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

    return `${packageCode}

${functionCode}`;
  }

  private generatePackageCode(queryParams: ExampleOpenAPIParameter[]): string {
    const queryEncodingImport =
      queryParams.length > 0 &&
      !this.hasAllowReservedQueryParameters(queryParams)
        ? '    "net/url"\n'
        : '';

    return `package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io"
    "mime/multipart"
    "net/http"
${queryEncodingImport}    "os"
    "strings"
)`;
  }

  private generateFunctionCode(
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
      ? 'resp.StatusCode < 200 || resp.StatusCode >= 300'
      : `resp.StatusCode != ${expectedSuccessStatusCode}`;
    const handlesBinaryResponse = this.isBinaryResponse(context);
    const errorReturnPrefix = this.buildErrorReturnPrefix(context);
    const queryParamsCode = this.buildQueryParamsCode(queryParams);
    const requestBodyCode = this.buildRequestBodyCode(
      requestBody,
      method,
      context
    );
    const headersCode = this.buildHeadersCode(
      headers,
      method,
      requestBody,
      context
    );
    const cookiesCode = this.buildCookiesCode(cookies);
    const responseHandlingCode = handlesBinaryResponse
      ? `fmt.Printf("Status: %s\\n", resp.Status)
    fmt.Printf("Response bytes: %d\\n", len(body))

    return body, nil`
      : `fmt.Printf("Status: %s\\n", resp.Status)
    fmt.Printf("Response: %s\\n", string(body))

    return nil`;
    const mainFunctionCode = handlesBinaryResponse
      ? `func main() {
    result, err := ${operationId}()
    if err != nil {
        fmt.Printf("Error: %v\\n", err)
        return
    }

    fmt.Printf("Success: %d bytes\\n", len(result))
}`
      : `func main() {
    if err := ${operationId}(); err != nil {
        fmt.Printf("Error: %v\\n", err)
    }
}`;

    return `// ${operation.summary || operation.description || 'API request'}
func ${operationId}() ${handlesBinaryResponse ? '([]byte, error)' : 'error'} {
    baseURL := "${url}"
    ${queryParamsCode}

    ${requestBodyCode}

    ${cookiesCode}

    ${headersCode}

    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        return ${errorReturnPrefix}fmt.Errorf("request failed: %v", err)
    }
    defer resp.Body.Close()

    body, err := io.ReadAll(resp.Body)
    if err != nil {
        return ${errorReturnPrefix}fmt.Errorf("reading response failed: %v", err)
    }

    if ${successStatusCheck} {
        return ${errorReturnPrefix}fmt.Errorf("HTTP error! status: %s", resp.Status)
    }

    ${responseHandlingCode}
}

${mainFunctionCode}`;
  }

  private buildQueryParamsCode(queryParams: ExampleOpenAPIParameter[]): string {
    if (this.hasAllowReservedQueryParameters(queryParams)) {
      return `urlStr := baseURL + "?${this.escapeDoubleQuoted(
        this.buildSerializedQueryString(queryParams)
      )}"`;
    }

    if (queryParams.length === 0) {
      return 'urlStr := baseURL';
    }

    const paramEntries = this.buildQueryParameterEntries(queryParams).map(
      (param) =>
        `q.Add("${this.escapeDoubleQuoted(
          param.name
        )}", "${this.escapeDoubleQuoted(param.value)}")`
    );

    return `q := url.Values{}
${paramEntries.join('\n')}
urlStr := baseURL + "?" + q.Encode()`;
  }

  private buildRequestBodyCode(
    requestBody: any,
    method: HttpMethod,
    context: CodeGenerateContext
  ): string {
    const errorReturnPrefix = this.buildErrorReturnPrefix(context);
    const hasRequestBody = this.hasRequestBodyValue(method, requestBody);

    if (!hasRequestBody) {
      return `req, err := http.NewRequest("${method}", urlStr, nil)
    if err != nil {
        return ${errorReturnPrefix}fmt.Errorf("creating request failed: %v", err)
    }`;
    }

    if (this.isMultipartRequestBody(context)) {
      const fieldLines = this.getMultipartFieldParts(requestBody).map(
        (part) =>
          `err = writer.WriteField("${this.escapeDoubleQuoted(
            part.name
          )}", "${this.escapeDoubleQuoted(
            part.value
          )}")\n    if err != nil {\n        return fmt.Errorf("writing form field failed: %v", err)\n    }`
      );
      const fileParts = this.getMultipartFileParts(requestBody);
      const fileLines = fileParts.flatMap((part, index) => [
        `${
          index === 0 ? 'part' : `part${index}`
        }, err := writer.CreateFormFile("${this.escapeDoubleQuoted(
          part.name
        )}", "${this.escapeDoubleQuoted(part.filename || part.name)}")`,
        `if err != nil {\n        return fmt.Errorf("creating file part failed: %v", err)\n    }`,
        `_, err = ${
          index === 0 ? 'part' : `part${index}`
        }.Write([]byte("${this.escapeDoubleQuoted(part.value)}"))`,
        `if err != nil {\n        return fmt.Errorf("writing file part failed: %v", err)\n    }`,
      ]);

      return `var body bytes.Buffer
    writer := multipart.NewWriter(&body)
    ${fieldLines.join('\n    ')}
    ${fileLines.join('\n    ')}
    err = writer.Close()
    if err != nil {
        return ${errorReturnPrefix}fmt.Errorf("closing multipart writer failed: %v", err)
    }

    req, err := http.NewRequest("${method}", urlStr, &body)
    if err != nil {
        return ${errorReturnPrefix}fmt.Errorf("creating request failed: %v", err)
    }
    req.Header.Set("Content-Type", writer.FormDataContentType())`;
    }

    if (this.isBinaryRequestBody(context)) {
      return `requestBody, err := os.ReadFile("${this.escapeDoubleQuoted(
        this.getBinaryRequestBodyFileName(requestBody)
      )}")
    if err != nil {
        return ${errorReturnPrefix}fmt.Errorf("reading request body failed: %v", err)
    }

    req, err := http.NewRequest("${method}", urlStr, bytes.NewReader(requestBody))
    if err != nil {
        return ${errorReturnPrefix}fmt.Errorf("creating request failed: %v", err)
    }`;
    }

    if (this.usesStringRequestBody(context)) {
      return `req, err := http.NewRequest("${method}", urlStr, strings.NewReader(${this.toGoStringLiteral(
        this.serializeStringRequestBody(requestBody, context)
      )}))
    if err != nil {
        return ${errorReturnPrefix}fmt.Errorf("creating request failed: %v", err)
    }`;
    }

    const jsonBody = JSON.stringify(requestBody, null, 2);
    return `req, err := http.NewRequest("${method}", urlStr, strings.NewReader(${this.toGoStringLiteral(
      jsonBody
    )}))
    if err != nil {
        return ${errorReturnPrefix}fmt.Errorf("creating request failed: %v", err)
    }`;
  }

  private buildHeadersCode(
    headers: ExampleOpenAPIParameter[],
    method: HttpMethod,
    requestBody: any,
    context: CodeGenerateContext
  ): string {
    const requestHeaders = [...headers];
    const hasRequestBody = this.hasRequestBodyValue(method, requestBody);

    if (
      hasRequestBody &&
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
        `req.Header.Set("${header.name}", "${this.escapeDoubleQuoted(
          this.serializeHeaderParameterValue(header)
        )}")`
    );

    return headerEntries.join('\n    ');
  }

  private buildCookiesCode(cookies: ExampleOpenAPIParameter[]): string {
    if (cookies.length === 0) {
      return '';
    }

    return `req.Header.Set("Cookie", "${this.escapeDoubleQuoted(
      this.buildCookieHeaderValue(cookies)
    )}")`;
  }

  private escapeDoubleQuoted(value: string): string {
    return value
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\r?\n/g, '\\n');
  }

  private buildErrorReturnPrefix(context: CodeGenerateContext): string {
    return this.isBinaryResponse(context) ? 'nil, ' : '';
  }
}
