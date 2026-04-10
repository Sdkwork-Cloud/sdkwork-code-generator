import { BaseRequestCodeGenerator } from '@/openapi/generator/generator';
import {
  CodeGenerateContext,
  ExampleOpenAPIParameter,
  HttpMethod,
  Language,
  OpenAPIOperation,
} from '@/types';

export class HttpClientCSharpRequestCodeGenerator extends BaseRequestCodeGenerator {
  getLanguage(): Language {
    return 'csharp';
  }

  getLibrary(): string {
    return 'httpclient';
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
    return this.generateCSharpClass(
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

  private generateCSharpClass(
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
    const csharpMethod = this.toPascalHttpMethod(method);
    const methodName = `${this.toIdentifier(
      operation.operationId,
      'apiRequest',
      'camel'
    )}Async`;
    const url = this.escapeDoubleQuotedString(
      this.buildRequestUrl(baseUrl, path)
    );
    const expectedSuccessStatusCode =
      this.getExpectedSuccessStatusCode(context);
    const successStatusCheck = this.usesAny2xxSuccessStatus(context)
      ? '(int)response.StatusCode < 200 || (int)response.StatusCode >= 300'
      : `(int)response.StatusCode != ${expectedSuccessStatusCode}`;
    const handlesBinaryResponse = this.isBinaryResponse(context);
    const responseHandlingCode = handlesBinaryResponse
      ? `var responseBody = await response.Content.ReadAsByteArrayAsync();
            Console.WriteLine($"Status: {response.StatusCode}");
            Console.WriteLine($"Response bytes: {responseBody.Length}");
            return responseBody;`
      : `var responseBody = await response.Content.ReadAsStringAsync();
            Console.WriteLine($"Status: {response.StatusCode}");
            Console.WriteLine($"Response: {responseBody}");`;
    const mainInvocation = handlesBinaryResponse
      ? `var result = await ${methodName}();
        Console.WriteLine($"Success: {result.Length} bytes");`
      : `await ${methodName}();`;

    return `using System;
using System.IO;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;

public class ${className}
{
    private static readonly HttpClient client = new HttpClient();

    /**
     * ${operation.summary || operation.description || 'API request'}
     */
    public static async Task${
      handlesBinaryResponse ? '<byte[]>' : ''
    } ${methodName}()
    {
        var url = "${url}";
        ${this.buildQueryParamsCode(queryParams)}

        var request = new HttpRequestMessage
        {
            Method = HttpMethod.${csharpMethod},
            RequestUri = new Uri(url)
        };

        ${this.buildCookiesCode(cookies)}
        ${this.buildHeadersCode(headers)}
        ${this.buildRequestBodyCode(requestBody, method, context)}

        try
        {
            var response = await client.SendAsync(request);
            if (${successStatusCheck})
            {
                throw new HttpRequestException($"HTTP error! status: {response.StatusCode}");
            }

            ${responseHandlingCode}
        }
        catch (HttpRequestException e)
        {
            Console.WriteLine($"Error: {e.Message}");
            throw;
        }
    }

    public static async Task Main(string[] args)
    {
        ${mainInvocation}
    }
}`;
  }

  private buildQueryParamsCode(queryParams: ExampleOpenAPIParameter[]): string {
    if (this.hasAllowReservedQueryParameters(queryParams)) {
      return `url += (url.Contains("?") ? "&" : "?") + "${this.escapeDoubleQuoted(
        this.buildSerializedQueryString(queryParams)
      )}";`;
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
          )}=" + Uri.EscapeDataString("${this.escapeDoubleQuoted(
            param.value
          )}");`
      )
      .join('\n        ');
  }

  private buildRequestBodyCode(
    requestBody: any,
    method: HttpMethod,
    context: CodeGenerateContext
  ): string {
    if (!this.hasRequestBody(method, requestBody)) {
      return '';
    }

    if (this.isMultipartRequestBody(context)) {
      const fieldLines = this.getMultipartFieldParts(requestBody).map(
        (part) =>
          `formData.Add(new StringContent("${this.escapeDoubleQuoted(
            part.value
          )}"), "${this.escapeDoubleQuoted(part.name)}");`
      );
      const filePart = this.getMultipartFileParts(requestBody)[0];

      return `var formData = new MultipartFormDataContent();
        ${fieldLines.join('\n        ')}
        var fileContent = new ByteArrayContent(Encoding.UTF8.GetBytes("${this.escapeDoubleQuoted(
          filePart?.value || 'example file contents'
        )}"));
        fileContent.Headers.ContentType = new MediaTypeHeaderValue("${this.escapeDoubleQuoted(
          filePart?.contentType || 'application/octet-stream'
        )}");
        formData.Add(fileContent, "${this.escapeDoubleQuoted(
          filePart?.name || 'file'
        )}", "${this.escapeDoubleQuoted(
        filePart?.filename || 'example-file.bin'
      )}");
        request.Content = formData;`;
    }

    if (this.isBinaryRequestBody(context)) {
      const contentType =
        context.requestContentType || 'application/octet-stream';
      return `var requestBody = File.ReadAllBytes("${this.escapeDoubleQuoted(
        this.getBinaryRequestBodyFileName(requestBody)
      )}");
        request.Content = new ByteArrayContent(requestBody);
        request.Content.Headers.ContentType = new MediaTypeHeaderValue("${contentType}");`;
    }

    if (this.usesStringRequestBody(context)) {
      const contentType = context.requestContentType || 'text/plain';
      return `request.Content = new StringContent("${this.escapeDoubleQuoted(
        this.serializeStringRequestBody(requestBody, context)
      )}", Encoding.UTF8, "${contentType}");`;
    }

    const jsonBody = this.escapeVerbatimString(
      JSON.stringify(requestBody, null, 2)
    );
    const contentType = context.requestContentType || 'application/json';
    return `var json = @"${jsonBody}";
        request.Content = new StringContent(json, Encoding.UTF8, "${contentType}");`;
  }

  private buildHeadersCode(headers: ExampleOpenAPIParameter[]): string {
    if (headers.length === 0) {
      return '';
    }

    return headers
      .map(
        (header) =>
          `request.Headers.Add("${header.name}", "${this.escapeDoubleQuoted(
            this.serializeHeaderParameterValue(header)
          )}");`
      )
      .join('\n        ');
  }

  private buildCookiesCode(cookies: ExampleOpenAPIParameter[]): string {
    if (cookies.length === 0) {
      return '';
    }

    return `request.Headers.Add("Cookie", "${this.escapeDoubleQuoted(
      this.buildCookieHeaderValue(cookies)
    )}");`;
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
