import { BaseRequestCodeGenerator } from '@/openapi/generator/generator';
import {
  CodeGenerateContext,
  ExampleOpenAPIParameter,
  HttpMethod,
  Language,
  OpenAPIOperation,
} from '@/types';

export class UrlsessionSwiftRequestCodeGenerator extends BaseRequestCodeGenerator {
  getLanguage(): Language {
    return 'swift';
  }

  getLibrary(): string {
    return 'urlsession';
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
      ? 'httpResponse.statusCode < 200 || httpResponse.statusCode >= 300'
      : `httpResponse.statusCode != ${expectedSuccessStatusCode}`;
    const responseHandlingCode = this.isBinaryResponse(context)
      ? `let responseData = data
        print("Response bytes: \\(responseData.count)")`
      : this.usesStringResponse(context)
      ? `let responseText = String(data: data, encoding: .utf8) ?? ""
        print("Response: \\(responseText)")`
      : `do {
            let jsonObject = try JSONSerialization.jsonObject(with: data)
            print("Response: \\(jsonObject)")
        } catch {
            print("JSON parsing error: \\(error)")
        }`;

    return `import Foundation

/*
${operation.summary || operation.description || 'API request'}
${operation.description ? ` * ${operation.description}` : ''}
*/

func ${operationId}() {
    var urlString = "${url}"
    ${this.buildQueryParamsCode(queryParams)}

    guard let url = URL(string: urlString) else {
        fatalError("Invalid URL")
    }

    var request = URLRequest(url: url)
    request.httpMethod = "${method.toUpperCase()}"

    ${this.buildHeadersCode(
      cookies,
      headers,
      method,
      requestBody,
      'request',
      context
    )}
    ${this.buildRequestBodyCode(method, requestBody, 'request', context)}

    let task = URLSession.shared.dataTask(with: request) { data, response, error in
        if let error = error {
            print("Error: \\(error)")
            return
        }

        guard let httpResponse = response as? HTTPURLResponse else {
            print("Invalid response")
            return
        }

        if ${successStatusCheck} {
            print("HTTP error! status: \\(httpResponse.statusCode)")
            return
        }

        guard let data = data else {
            print("No data received")
            return
        }

        ${responseHandlingCode}
    }

    task.resume()
}

${operationId}()`;
  }

  private buildHeadersCode(
    cookies: ExampleOpenAPIParameter[],
    headers: ExampleOpenAPIParameter[],
    method: HttpMethod,
    requestBody: any,
    requestVar: string,
    context: CodeGenerateContext
  ): string {
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

    if (requestHeaders.length === 0) {
      return '';
    }

    return requestHeaders
      .map(
        (header) =>
          `${requestVar}.setValue("${this.escapeSwiftString(
            this.serializeHeaderParameterValue(header)
          )}", forHTTPHeaderField: "${this.escapeSwiftString(header.name)}")`
      )
      .join('\n    ');
  }

  private buildQueryParamsCode(queryParams: ExampleOpenAPIParameter[]): string {
    if (this.hasAllowReservedQueryParameters(queryParams)) {
      return `urlString += (urlString.contains("?") ? "&" : "?") + "${this.escapeSwiftString(
        this.buildSerializedQueryString(queryParams)
      )}"`;
    }

    const paramEntries = this.buildQueryParameterEntries(queryParams);

    if (paramEntries.length === 0) {
      return '';
    }

    return paramEntries
      .map(
        (param) =>
          `urlString += (urlString.contains("?") ? "&" : "?") + "${this.escapeSwiftString(
            param.name
          )}=" + "${this.escapeSwiftString(
            String(param.value)
          )}".addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed.subtracting(CharacterSet(charactersIn: "&=?+")))!`
      )
      .join('\n    ');
  }

  private buildRequestBodyCode(
    method: HttpMethod,
    requestBody: any,
    requestVar: string,
    context: CodeGenerateContext
  ): string {
    if (!this.hasRequestBody(method, requestBody)) {
      return '';
    }

    if (this.isMultipartRequestBody(context)) {
      const rawBody = this.buildRawMultipartBody(
        this.getMultipartParts(requestBody)
      );

      return `let boundary = "${this.buildMultipartBoundary()}"
    ${requestVar}.setValue("multipart/form-data; boundary=\\(boundary)", forHTTPHeaderField: "Content-Type")
    let requestData = """
${rawBody.replace(
  new RegExp(this.buildMultipartBoundary(), 'g'),
  '\\(boundary)'
)}
""".data(using: .utf8)
    ${requestVar}.httpBody = requestData`;
    }

    if (this.isBinaryRequestBody(context)) {
      return `let requestBody = try! Data(contentsOf: URL(fileURLWithPath: "${this.escapeSwiftString(
        this.getBinaryRequestBodyFileName(requestBody)
      )}"))
    ${requestVar}.httpBody = requestBody`;
    }

    if (this.usesStringRequestBody(context)) {
      return `${requestVar}.httpBody = "${this.escapeSwiftString(
        this.serializeStringRequestBody(requestBody, context)
      )}".data(using: .utf8)`;
    }

    return `let requestData = "${this.escapeSwiftString(
      JSON.stringify(requestBody, null, 2)
    )}".data(using: .utf8)
    ${requestVar}.httpBody = requestData`;
  }

  private hasRequestBody(method: HttpMethod, requestBody: any): boolean {
    return (
      ['POST', 'PUT', 'PATCH'].includes(method) &&
      requestBody !== undefined &&
      requestBody !== null
    );
  }

  private escapeSwiftString(value: string): string {
    return value
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\r?\n/g, '\\n');
  }
}
