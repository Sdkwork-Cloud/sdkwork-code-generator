import { BaseRequestCodeGenerator } from '@/openapi/generator/generator';
import {
  CodeGenerateContext,
  ExampleOpenAPIParameter,
  HttpMethod,
  Language,
  OpenAPIOperation,
} from '@/types';

export class AlamofireSwiftRequestCodeGenerator extends BaseRequestCodeGenerator {
  getLanguage(): Language {
    return 'swift';
  }

  getLibrary(): string {
    return 'alamofire';
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
    const expectedSuccessStatusCode =
      this.getExpectedSuccessStatusCode(context);
    const validationStatusCode = this.usesAny2xxSuccessStatus(context)
      ? '200..<300'
      : `[${expectedSuccessStatusCode}]`;
    const responseHandler = this.isBinaryResponse(context)
      ? `.responseData { response in
            switch response.result {
            case .success(let value):
                print("Success bytes: \\(value.count)")
            case .failure(let error):
                print("Error: \\(error.localizedDescription)")
            }
        }`
      : `.responseString { response in
            switch response.result {
            case .success(let value):
                print("Success: \\(value)")
            case .failure(let error):
                print("Error: \\(error.localizedDescription)")
            }
        }`;
    const requestSetup = this.buildRequestSetup(
      method,
      cookies,
      headers,
      queryParams,
      requestBody,
      this.escapeDoubleQuotedString(this.buildRequestUrl(baseUrl, path)),
      context
    );

    return `import Foundation
import Alamofire

// ${operation.summary || operation.description || 'API request'}
func ${operationId}() {
    ${requestSetup}

    request
        .validate(statusCode: ${validationStatusCode})
        ${responseHandler}
}

${operationId}()`;
  }

  private buildRequestSetup(
    method: HttpMethod,
    cookies: ExampleOpenAPIParameter[],
    headers: ExampleOpenAPIParameter[],
    queryParams: ExampleOpenAPIParameter[],
    requestBody: any,
    url: string,
    context: CodeGenerateContext
  ): string {
    const headerLines = this.buildHeaderEntries(
      cookies,
      headers,
      method,
      requestBody,
      context
    );
    const queryLines = this.buildQueryParamsCode(queryParams);

    if (this.hasRequestBody(method, requestBody)) {
      if (this.isMultipartRequestBody(context)) {
        const fieldLines = this.getMultipartFieldParts(requestBody).map(
          (part) =>
            `        multipartFormData.append(Data("${this.escapeSwiftString(
              part.value
            )}".utf8), withName: "${this.escapeSwiftString(part.name)}")`
        );
        const filePart = this.getMultipartFileParts(requestBody)[0];
        const fileLines = filePart
          ? [
              `        multipartFormData.append(Data("${this.escapeSwiftString(
                filePart.value
              )}".utf8), withName: "${this.escapeSwiftString(
                filePart.name
              )}", fileName: "${this.escapeSwiftString(
                filePart.filename || filePart.name
              )}", mimeType: "${this.escapeSwiftString(
                filePart.contentType || 'application/octet-stream'
              )}")`,
            ]
          : [];

        return `var url = "${url}"
    ${queryLines}
    let headers: HTTPHeaders = [
        ${headerLines}
    ]
    let request = AF.upload(multipartFormData: { multipartFormData in
${[...fieldLines, ...fileLines].join('\n')}
    }, to: url, method: .${method.toLowerCase()}, headers: headers)`;
      }

      if (this.isBinaryRequestBody(context)) {
        return `var url = "${url}"
    ${queryLines}
    let headers: HTTPHeaders = [
        ${headerLines}
    ]
    let requestBody = try! Data(contentsOf: URL(fileURLWithPath: "${this.escapeSwiftString(
      this.getBinaryRequestBodyFileName(requestBody)
    )}"))
    let request = AF.upload(requestBody, to: url, method: .${method.toLowerCase()}, headers: headers)`;
      }

      if (this.usesStringRequestBody(context)) {
        return `var url = "${url}"
    ${queryLines}
    let headers: HTTPHeaders = [
        ${headerLines}
    ]
    let bodyData = "${this.escapeSwiftString(
      this.serializeStringRequestBody(requestBody, context)
    )}".data(using: .utf8)!
    let request = AF.upload(bodyData, to: url, method: .${method.toLowerCase()}, headers: headers)`;
      }

      return `var url = "${url}"
    ${queryLines}
    let headers: HTTPHeaders = [
        ${headerLines}
    ]
    let bodyData = "${this.escapeSwiftString(
      JSON.stringify(requestBody, null, 2)
    )}".data(using: .utf8)!
    let request = AF.upload(bodyData, to: url, method: .${method.toLowerCase()}, headers: headers)`;
    }

    return `var url = "${url}"
    ${queryLines}
    let headers: HTTPHeaders = [
        ${headerLines}
    ]
    let request = AF.request(url, method: .${method.toLowerCase()}, headers: headers)`;
  }

  private buildHeaderEntries(
    cookies: ExampleOpenAPIParameter[],
    headers: ExampleOpenAPIParameter[],
    method: HttpMethod,
    requestBody: any,
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
          `"${this.escapeSwiftString(header.name)}": "${this.escapeSwiftString(
            this.serializeHeaderParameterValue(header)
          )}"`
      )
      .join(',\n        ');
  }

  private buildQueryParamsCode(queryParams: ExampleOpenAPIParameter[]): string {
    if (this.hasAllowReservedQueryParameters(queryParams)) {
      return `url += (url.contains("?") ? "&" : "?") + "${this.escapeSwiftString(
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
          `url += (url.contains("?") ? "&" : "?") + "${this.escapeSwiftString(
            param.name
          )}=" + "${this.escapeSwiftString(
            String(param.value)
          )}".addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed.subtracting(CharacterSet(charactersIn: "&=?+")))!`
      )
      .join('\n    ');
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
