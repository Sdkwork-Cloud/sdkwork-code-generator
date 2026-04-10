import { BaseRequestCodeGenerator } from '@/openapi/generator/generator';
import {
  CodeGenerateContext,
  ExampleOpenAPIParameter,
  HttpMethod,
  Language,
  OpenAPIOperation,
} from '@/types';

export class RestsharpCsharpRequestCodeGenerator extends BaseRequestCodeGenerator {
  getLanguage(): Language {
    return 'csharp';
  }

  getLibrary(): string {
    return 'restsharp';
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
    const csharpMethod = this.toPascalHttpMethod(method);
    const methodName = this.toIdentifier(
      operation.operationId,
      'apiRequest',
      'camel'
    );
    const expectedSuccessStatusCode =
      this.getExpectedSuccessStatusCode(context);
    const successStatusCheck = this.usesAny2xxSuccessStatus(context)
      ? '(int)response.StatusCode < 200 || (int)response.StatusCode >= 300'
      : `(int)response.StatusCode != ${expectedSuccessStatusCode}`;
    const handlesBinaryResponse = this.isBinaryResponse(context);
    const responseHandlingCode = handlesBinaryResponse
      ? `var data = response.RawBytes ?? Array.Empty<byte>();
        Console.WriteLine("Response bytes: " + data.Length);
        return data;`
      : this.usesStringResponse(context)
      ? `var data = response.Content;
        Console.WriteLine("Response: " + data);`
      : `var data = JsonConvert.DeserializeObject<object>(response.Content);
        Console.WriteLine("Response: " + JsonConvert.SerializeObject(data, Formatting.Indented));`;
    const mainInvocation = handlesBinaryResponse
      ? `var result = ${methodName}();
        Console.WriteLine("Success bytes: " + result.Length);`
      : `${methodName}();`;
    const serverUrl = this.parseServerUrl(baseUrl);
    const requestBaseUrl = this.escapeDoubleQuotedString(serverUrl.origin);
    const requestPath = this.escapeDoubleQuotedString(
      this.combineServerPath(baseUrl, path)
    );

    return `using System;
using System.IO;
using RestSharp;
using Newtonsoft.Json;

/**
 * ${operation.summary || operation.description || 'API request'}
 * ${operation.description ? ` * ${operation.description}` : ''}
 */
class ${className}
{
    static void Main(string[] args)
    {
        ${mainInvocation}
    }

    static ${handlesBinaryResponse ? 'byte[]' : 'void'} ${methodName}()
    {
        var client = new RestClient("${requestBaseUrl}");
        var request = new RestRequest("${requestPath}", Method.${csharpMethod});

        ${this.buildCookiesCode(cookies, 'request')}
        ${this.buildQueryParamsCode(queryParams, 'request')}
        ${this.buildHeadersCode(
          headers,
          'request',
          method,
          requestBody,
          context
        )}
        ${this.buildRequestBodyCode(method, requestBody, 'request', context)}

        var response = client.Execute(request);

        if (${successStatusCheck})
        {
            throw new Exception($"HTTP error! status: {response.StatusCode}");
        }

        ${responseHandlingCode}
    }
}`;
  }

  private buildCookiesCode(
    cookies: ExampleOpenAPIParameter[],
    requestVar: string
  ): string {
    if (cookies.length === 0) {
      return '';
    }

    return this.buildCookieParameterEntries(cookies)
      .map(
        (cookie) =>
          `${requestVar}.AddCookie("${cookie.name}", "${this.escapeDoubleQuoted(
            cookie.value
          )}");`
      )
      .join('\n        ');
  }

  private buildQueryParamsCode(
    queryParams: ExampleOpenAPIParameter[],
    requestVar: string
  ): string {
    const paramEntries = this.buildQueryParameterEntries(queryParams);

    if (paramEntries.length === 0) {
      return '';
    }

    return paramEntries
      .map((param) =>
        param.allowReserved
          ? `${requestVar}.AddQueryParameter("${this.escapeDoubleQuoted(
              param.name
            )}", "${this.escapeDoubleQuoted(
              this.encodeQueryParameterValue(String(param.value), true)
            )}", false);`
          : `${requestVar}.AddQueryParameter("${this.escapeDoubleQuoted(
              param.name
            )}", "${this.escapeDoubleQuoted(String(param.value))}");`
      )
      .join('\n        ');
  }

  private buildHeadersCode(
    headers: ExampleOpenAPIParameter[],
    requestVar: string,
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
          `${requestVar}.AddHeader("${header.name}", "${this.escapeDoubleQuoted(
            this.serializeHeaderParameterValue(header)
          )}");`
      )
      .join('\n        ');
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
      const fieldLines = this.getMultipartFieldParts(requestBody).map(
        (part) =>
          `${requestVar}.AddParameter("${this.escapeDoubleQuoted(
            part.name
          )}", "${this.escapeDoubleQuoted(part.value)}");`
      );
      const filePart = this.getMultipartFileParts(requestBody)[0];

      return `${requestVar}.AlwaysMultipartFormData = true;
        ${fieldLines.join('\n        ')}
        ${requestVar}.AddFile("${this.escapeDoubleQuoted(
        filePart?.name || 'file'
      )}", "${this.escapeDoubleQuoted(
        filePart?.filename || 'example-file.bin'
      )}");`;
    }

    if (this.isBinaryRequestBody(context)) {
      const contentType =
        context.requestContentType || 'application/octet-stream';
      return `var requestBody = File.ReadAllBytes("${this.escapeDoubleQuoted(
        this.getBinaryRequestBodyFileName(requestBody)
      )}");
        ${requestVar}.AddParameter("${contentType}", requestBody, ParameterType.RequestBody);`;
    }

    if (this.usesStringRequestBody(context)) {
      const serializedBody = this.escapeDoubleQuoted(
        this.serializeStringRequestBody(requestBody, context)
      );

      if (context.requestContentType === 'application/x-www-form-urlencoded') {
        return `${requestVar}.AddParameter("application/x-www-form-urlencoded", "${serializedBody}", ParameterType.RequestBody);`;
      }

      return `${requestVar}.AddStringBody("${serializedBody}", DataFormat.None);`;
    }

    return `var requestBody = @"${this.escapeVerbatimString(
      JSON.stringify(requestBody, null, 2)
    )}";
        ${requestVar}.AddStringBody(requestBody, DataFormat.Json);`;
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

  private escapeVerbatimString(value: string): string {
    return value.replace(/"/g, '""');
  }
}
