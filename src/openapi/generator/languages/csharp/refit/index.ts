import { BaseRequestCodeGenerator } from '@/openapi/generator/generator';
import {
  CodeGenerateContext,
  ExampleOpenAPIParameter,
  HttpMethod,
  Language,
  OpenAPIOperation,
} from '@/types';

export class RefitCsharpRequestCodeGenerator extends BaseRequestCodeGenerator {
  getLanguage(): Language {
    return 'csharp';
  }

  getLibrary(): string {
    return 'refit';
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
    const methodName = `${this.toIdentifier(
      operation.operationId,
      'apiRequest',
      'camel'
    )}Async`;
    const handlesBinaryResponse = this.isBinaryResponse(context);
    const responseType = this.usesStringResponse(context) ? 'string' : 'object';
    const expectedSuccessStatusCode =
      this.getExpectedSuccessStatusCode(context);
    const successStatusCheck = this.usesAny2xxSuccessStatus(context)
      ? '(int)response.StatusCode < 200 || (int)response.StatusCode >= 300'
      : `(int)response.StatusCode != ${expectedSuccessStatusCode}`;
    const responseLoggingCode = handlesBinaryResponse
      ? `var result = await response.Content.ReadAsByteArrayAsync();
        Console.WriteLine("Response bytes: " + result.Length);`
      : this.usesStringResponse(context)
      ? 'Console.WriteLine("Response: " + result);'
      : 'Console.WriteLine("Response: " + JsonConvert.SerializeObject(result, Formatting.Indented));';
    const interfaceReturnType = handlesBinaryResponse
      ? 'Task<HttpResponseMessage>'
      : `Task<ApiResponse<${responseType}>>`;
    const resultAssignment = handlesBinaryResponse
      ? ''
      : 'var result = response.Content;';
    const serverUrl = this.parseServerUrl(baseUrl);
    const requestBaseUrl = this.escapeDoubleQuotedString(serverUrl.origin);
    const requestPath = this.combineServerPath(baseUrl, path);

    return `using System;
using System.IO;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json;
using Refit;

/**
 * ${operation.summary || operation.description || 'API request'}
 * ${operation.description ? ` * ${operation.description}` : ''}
 */

public interface IApiService
{
    ${this.buildMethodAttributes(
      method,
      requestPath,
      queryParams,
      headers,
      requestBody,
      context
    )}
    ${interfaceReturnType} ${methodName}(
        ${this.buildRefitParameters(
          cookies,
          queryParams,
          headers,
          requestBody,
          context
        )}
    );
}

class ${className}
{
    static async Task Main(string[] args)
    {
        await ${methodName}();
    }

    static async Task ${methodName}()
    {
        var apiService = RestService.For<IApiService>("${requestBaseUrl}");

        var response = await apiService.${methodName}(
            ${this.buildRefitArguments(
              cookies,
              queryParams,
              headers,
              requestBody,
              context
            )}        
        );

        if (${successStatusCheck})
        {
            throw new Exception($"HTTP error! status: {response.StatusCode}");
        }

        ${resultAssignment}
        ${responseLoggingCode}
    }
}`;
  }

  private buildMethodAttributes(
    method: HttpMethod,
    path: string,
    queryParams: ExampleOpenAPIParameter[],
    headers: ExampleOpenAPIParameter[],
    requestBody: any,
    context: CodeGenerateContext
  ): string {
    const attributes: string[] = [];
    const csharpMethod = this.toPascalHttpMethod(method);

    if (
      this.hasRequestBody(method, requestBody) &&
      this.shouldAutoAddContentTypeHeader(context) &&
      !headers.some((header) => header.name.toLowerCase() === 'content-type')
    ) {
      attributes.push(
        `[Headers("Content-Type: ${context.requestContentType}")]`
      );
    }

    if (this.isMultipartRequestBody(context) && requestBody !== undefined) {
      attributes.push('[Multipart]');
    }

    if (this.hasAllowReservedQueryParameters(queryParams)) {
      attributes.push('[QueryUriFormat(UriFormat.Unescaped)]');
    }

    attributes.push(`[${csharpMethod}("${this.escapeDoubleQuoted(path)}")]`);

    return attributes.join('\n    ');
  }

  private buildRefitParameters(
    cookies: ExampleOpenAPIParameter[],
    queryParams: ExampleOpenAPIParameter[],
    headers: ExampleOpenAPIParameter[],
    requestBody: any,
    context: CodeGenerateContext
  ): string {
    const parameters: string[] = [];
    const cookieBindings = this.buildCookieParameterBindings(cookies);
    const queryBindings = this.buildQueryParameterBindings(queryParams);

    cookieBindings.forEach((cookie) => {
      const cookieName = `${this.toIdentifier(
        cookie.name,
        'cookie',
        'camel'
      )}Cookie`;
      parameters.push(`[Header("Cookie")] string ${cookieName}`);
    });

    queryBindings.forEach((binding) => {
      parameters.push(
        `[Query("${this.escapeDoubleQuoted(binding.name)}")] string ${
          binding.identifier
        }`
      );
    });

    headers.forEach((header) => {
      const headerName = this.toIdentifier(header.name, 'header', 'camel');
      parameters.push(
        `[Header("${this.escapeDoubleQuoted(
          header.name
        )}")] string ${headerName}`
      );
    });

    if (this.isMultipartRequestBody(context)) {
      this.getMultipartFieldParts(requestBody).forEach((part) => {
        const partName = this.toIdentifier(part.name, 'part', 'camel');
        parameters.push(
          `[AliasAs("${this.escapeDoubleQuoted(
            part.name
          )}")] string ${partName}`
        );
      });

      this.getMultipartFileParts(requestBody).forEach((part) => {
        const partName = this.toIdentifier(part.name, 'part', 'camel');
        parameters.push(
          `[AliasAs("${this.escapeDoubleQuoted(
            part.name
          )}")] ByteArrayPart ${partName}`
        );
      });
    } else if (requestBody !== undefined && requestBody !== null) {
      parameters.push(
        this.isBinaryRequestBody(context)
          ? `[Body] byte[] body`
          : this.usesStringRequestBody(context)
          ? `[Body] string body`
          : `[Body] object body`
      );
    }

    return parameters.join(',\n        ');
  }

  private buildRefitArguments(
    cookies: ExampleOpenAPIParameter[],
    queryParams: ExampleOpenAPIParameter[],
    headers: ExampleOpenAPIParameter[],
    requestBody: any,
    context: CodeGenerateContext
  ): string {
    const args: string[] = [];
    const cookieBindings = this.buildCookieParameterBindings(cookies);
    const queryBindings = this.buildQueryParameterBindings(queryParams);
    const usesPreEncodedQueryValues =
      this.hasAllowReservedQueryParameters(queryParams);

    cookieBindings.forEach((cookie) => {
      args.push(`"${cookie.name}=${this.escapeDoubleQuoted(cookie.value)}"`);
    });

    queryBindings.forEach((binding) => {
      args.push(
        `"${this.escapeDoubleQuoted(
          usesPreEncodedQueryValues
            ? this.encodeQueryParameterValue(
                binding.value,
                binding.allowReserved
              )
            : binding.value
        )}"`
      );
    });

    headers.forEach((header) => {
      args.push(
        `"${this.escapeDoubleQuoted(
          this.serializeHeaderParameterValue(header)
        )}"`
      );
    });

    if (this.isMultipartRequestBody(context)) {
      this.getMultipartFieldParts(requestBody).forEach((part) => {
        args.push(`"${this.escapeDoubleQuoted(part.value)}"`);
      });

      this.getMultipartFileParts(requestBody).forEach((part) => {
        args.push(
          `new ByteArrayPart(Encoding.UTF8.GetBytes("${this.escapeDoubleQuoted(
            part.value
          )}"), "${this.escapeDoubleQuoted(
            part.filename || part.name
          )}", "${this.escapeDoubleQuoted(
            part.contentType || 'application/octet-stream'
          )}")`
        );
      });
    } else if (requestBody !== undefined && requestBody !== null) {
      if (this.isBinaryRequestBody(context)) {
        args.push(
          `File.ReadAllBytes("${this.escapeDoubleQuoted(
            this.getBinaryRequestBodyFileName(requestBody)
          )}")`
        );
      } else if (this.usesStringRequestBody(context)) {
        args.push(
          `"${this.escapeDoubleQuoted(
            this.serializeStringRequestBody(requestBody, context)
          )}"`
        );
      } else {
        args.push(
          `JsonConvert.DeserializeObject<object>(@"${this.escapeVerbatimString(
            JSON.stringify(requestBody, null, 2)
          )}")`
        );
      }
    }

    return args.join(',\n            ');
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
