import { BaseRequestCodeGenerator } from '@/openapi/generator/generator';
import {
  CodeGenerateContext,
  ExampleOpenAPIParameter,
  HttpMethod,
  Language,
  OpenAPIOperation,
} from '@/types';

export class ReqwestRustRequestCodeGenerator extends BaseRequestCodeGenerator {
  getLanguage(): Language {
    return 'rust';
  }

  getLibrary(): string {
    return 'reqwest';
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
      'api_request',
      'snake'
    );
    const url = this.escapeDoubleQuotedString(
      this.buildRequestUrl(baseUrl, path)
    );
    const requestBuilder = method.toLowerCase();
    const expectedSuccessStatusCode =
      this.getExpectedSuccessStatusCode(context);
    const successStatusCheck = this.usesAny2xxSuccessStatus(context)
      ? 'status.as_u16() < 200 || status.as_u16() >= 300'
      : `status.as_u16() != ${expectedSuccessStatusCode}`;
    const headerCode = this.buildHeadersCode(
      headers,
      cookies,
      method,
      requestBody,
      context
    );
    const queryCode = this.buildQueryCode(queryParams);
    const multipartSetup =
      this.isMultipartRequestBody(context) && requestBody
        ? `${this.buildMultipartFormSetup(requestBody)}\n\n`
        : '';
    const binarySetup = this.isBinaryRequestBody(context)
      ? `    let requestBody = std::fs::read("${this.escapeDoubleQuoted(
          this.getBinaryRequestBodyFileName(requestBody)
        )}")?;\n\n`
      : '';
    const bodyCode = this.buildBodyCode(method, requestBody, context);
    const responseHandlingCode = this.isBinaryResponse(context)
      ? `    let body = response.bytes().await?;\n\n    println!("Status: {}", status);\n    println!("Body bytes: {}", body.len());`
      : `    let body = response.text().await?;\n\n    println!("Status: {}", status);\n    println!("Body: {}", body);`;

    return `use reqwest::header::{HeaderMap, HeaderName, HeaderValue};
use reqwest::multipart::{Form, Part};
use reqwest::Client;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    ${operationId}().await
}

async fn ${operationId}() -> Result<(), Box<dyn std::error::Error>> {
    let client = Client::new();
    let mut headers = HeaderMap::new();
${headerCode}
${binarySetup}${multipartSetup}

    let request = client
        .${requestBuilder}("${url}")
        .headers(headers)
${queryCode}
${bodyCode}
        ;

    let response = request.send().await?;
    let status = response.status();
    if ${successStatusCheck} {
        return Err(format!("HTTP error! status: {}", status).into());
    }
${responseHandlingCode}

    Ok(())
}`;
  }

  private buildHeadersCode(
    headers: ExampleOpenAPIParameter[],
    cookies: ExampleOpenAPIParameter[],
    method: HttpMethod,
    requestBody: any,
    context: CodeGenerateContext
  ): string {
    const requestHeaders = [...headers];

    if (cookies.length > 0) {
      requestHeaders.push({
        name: 'cookie',
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
        name: 'content-type',
        in: 'header',
        required: false,
        schema: { type: 'string' },
        value: context.requestContentType,
      });
    }

    return requestHeaders
      .map(
        (header) =>
          `    headers.insert(HeaderName::from_static("${header.name.toLowerCase()}"), HeaderValue::from_str("${this.escapeDoubleQuoted(
            this.serializeHeaderParameterValue(header)
          )}")?);`
      )
      .join('\n');
  }

  private buildQueryCode(queryParams: ExampleOpenAPIParameter[]): string {
    if (queryParams.length === 0) {
      return '';
    }

    const pairs = this.buildQueryParameterEntries(queryParams)
      .map(
        (param) =>
          `            ("${this.escapeDoubleQuoted(
            param.name
          )}", "${this.escapeDoubleQuoted(param.value)}")`
      )
      .join(',\n');

    return `        .query(&[\n${pairs}\n        ])`;
  }

  private buildBodyCode(
    method: HttpMethod,
    requestBody: any,
    context: CodeGenerateContext
  ): string {
    if (!this.hasRequestBody(method, requestBody)) {
      return '';
    }

    if (this.isMultipartRequestBody(context)) {
      return '        .multipart(form)';
    }

    if (this.isBinaryRequestBody(context)) {
      return '        .body(requestBody)';
    }

    if (this.usesStringRequestBody(context)) {
      return `        .body("${this.escapeDoubleQuoted(
        this.serializeStringRequestBody(requestBody, context)
      )}")`;
    }

    return `        .json(&serde_json::json!(${JSON.stringify(
      requestBody,
      null,
      12
    )}))`;
  }

  private buildMultipartFormSetup(requestBody: any): string {
    const parts = this.getMultipartParts(requestBody);
    const fieldLines = parts
      .filter((part) => part.kind === 'field')
      .map(
        (part) =>
          `    .text("${this.escapeDoubleQuoted(
            part.name
          )}", "${this.escapeDoubleQuoted(part.value)}")`
      );
    const filePart = this.getMultipartFileParts(requestBody)[0];
    const fileLines = filePart
      ? [
          `    .part("${this.escapeDoubleQuoted(filePart.name)}",`,
          `        Part::bytes("${this.escapeDoubleQuoted(
            filePart.value
          )}".as_bytes().to_vec())`,
          `            .file_name("${this.escapeDoubleQuoted(
            filePart.filename || filePart.name
          )}")`,
          `            .mime_str("${this.escapeDoubleQuoted(
            filePart.contentType || 'application/octet-stream'
          )}")?`,
          '    )',
        ]
      : [];

    return `    let form = reqwest::multipart::Form::new()
${fieldLines.join('\n')}
${fileLines.join('\n')}
    ;`;
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
