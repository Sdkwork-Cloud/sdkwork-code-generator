import { BaseRequestCodeGenerator } from '@/openapi/generator/generator';
import {
  CodeGenerateContext,
  ExampleOpenAPIParameter,
  HttpMethod,
  Language,
  OpenAPIOperation,
} from '@/types';

export class RetrofitKotlinRequestCodeGenerator extends BaseRequestCodeGenerator {
  getLanguage(): Language {
    return 'kotlin';
  }

  getLibrary(): string {
    return 'retrofit';
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
    const binaryRequestBodySetup = this.buildBinaryRequestBodySetup(
      method,
      requestBody,
      context
    );
    const handlesBinaryResponse = this.isBinaryResponse(context);
    const responseType = handlesBinaryResponse
      ? 'ResponseBody'
      : this.usesStringResponse(context)
      ? 'String'
      : 'Any';
    const scalarConverterImport =
      this.usesStringResponse(context) && !handlesBinaryResponse
        ? 'import retrofit2.converter.scalars.ScalarsConverterFactory\n'
        : '';
    const scalarConverterFactory =
      this.usesStringResponse(context) && !handlesBinaryResponse
        ? '        .addConverterFactory(ScalarsConverterFactory.create())\n'
        : '';
    const responseBodyImport = handlesBinaryResponse
      ? 'import okhttp3.ResponseBody\n'
      : '';
    const expectedSuccessStatusCode =
      this.getExpectedSuccessStatusCode(context);
    const successStatusCheck = this.usesAny2xxSuccessStatus(context)
      ? 'response.code() < 200 || response.code() >= 300'
      : `response.code() != ${expectedSuccessStatusCode}`;
    const responseLoggingCode = handlesBinaryResponse
      ? 'val responseBytes = data?.bytes() ?: ByteArray(0)\n    println("Response bytes: ${responseBytes.size}")'
      : this.usesStringResponse(context)
      ? 'println("Response: ${data}")'
      : 'println("Response: ${Gson().toJson(data)}")';
    const serverUrl = this.parseServerUrl(baseUrl);
    const requestBaseUrl = this.escapeDoubleQuotedString(serverUrl.origin);
    const requestPath = this.combineServerPath(baseUrl, path);

    return `import com.google.gson.Gson
import java.io.File
import okhttp3.MediaType
import okhttp3.MultipartBody
import okhttp3.RequestBody
${responseBodyImport}import retrofit2.Call
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
${scalarConverterImport}import retrofit2.http.*

/**
 * ${operation.summary || operation.description || 'API request'}
 * ${operation.description ? ` * ${operation.description}` : ''}
 */

interface ApiService {
    ${this.buildMethodAnnotations(
      method,
      requestPath,
      headers,
      requestBody,
      context
    )}
    fun ${operationId}(
        ${this.buildRetrofitAnnotations(
          cookies,
          queryParams,
          headers,
          requestBody,
          context
        )}
    ): Call<${responseType}>
}

fun main() {
    ${operationId}()
}

fun ${operationId}() {
    ${this.buildCookiesCode(cookies)}

    val retrofit = Retrofit.Builder()
        .baseUrl("${requestBaseUrl}")
${scalarConverterFactory}        .addConverterFactory(GsonConverterFactory.create())
        .build()

    val service = retrofit.create(ApiService::class.java)
    ${binaryRequestBodySetup}
    val call = service.${operationId}(
        ${this.buildRetrofitParameters(
          cookies,
          queryParams,
          headers,
          requestBody,
          context
        )}
    )

    val response = call.execute()
    if (${successStatusCheck}) {
        throw RuntimeException("HTTP error! status: \${response.code()}")
    }

    val data = response.body()
    ${responseLoggingCode}
}`;
  }

  private buildCookiesCode(cookies: ExampleOpenAPIParameter[]): string {
    if (cookies.length === 0) {
      return '';
    }

    return `val cookieHeader = "${this.escapeDoubleQuoted(
      this.buildCookieHeaderValue(cookies)
    )}"`;
  }

  private buildMethodAnnotations(
    method: HttpMethod,
    path: string,
    headers: ExampleOpenAPIParameter[],
    requestBody: any,
    context: CodeGenerateContext
  ): string {
    const annotations: string[] = [];

    if (this.isMultipartRequestBody(context) && requestBody !== undefined) {
      annotations.push('@Multipart');
    }

    if (
      this.hasRequestBody(method, requestBody) &&
      this.shouldAutoAddContentTypeHeader(context) &&
      !headers.some((header) => header.name.toLowerCase() === 'content-type')
    ) {
      annotations.push(
        `@Headers("Content-Type: ${context.requestContentType}")`
      );
    }

    annotations.push(
      `@${method.toUpperCase()}("${this.escapeDoubleQuoted(path)}")`
    );

    return annotations.join('\n    ');
  }

  private buildRetrofitAnnotations(
    cookies: ExampleOpenAPIParameter[],
    queryParams: ExampleOpenAPIParameter[],
    headers: ExampleOpenAPIParameter[],
    requestBody: any,
    context: CodeGenerateContext
  ): string {
    const annotations: string[] = [];
    const queryBindings = this.buildQueryParameterBindings(queryParams);

    if (cookies.length > 0) {
      annotations.push(`@Header("Cookie") cookie: String`);
    }

    queryBindings.forEach((binding) => {
      annotations.push(
        binding.allowReserved
          ? `@Query(value = "${this.escapeDoubleQuoted(
              binding.name
            )}", encoded = true) ${binding.identifier}: String`
          : `@Query("${this.escapeDoubleQuoted(binding.name)}") ${
              binding.identifier
            }: String`
      );
    });

    headers.forEach((header) => {
      const headerName = this.toIdentifier(header.name, 'header', 'camel');
      annotations.push(
        `@Header("${this.escapeDoubleQuoted(
          header.name
        )}") ${headerName}: String`
      );
    });

    if (this.isMultipartRequestBody(context)) {
      this.getMultipartFieldParts(requestBody).forEach((part) => {
        const partName = this.toIdentifier(part.name, 'part', 'camel');
        annotations.push(
          `@Part("${this.escapeDoubleQuoted(
            part.name
          )}") ${partName}: RequestBody`
        );
      });
      this.getMultipartFileParts(requestBody).forEach((part) => {
        const partName = this.toIdentifier(part.name, 'part', 'camel');
        annotations.push(`@Part ${partName}: MultipartBody.Part`);
      });
      return annotations.join(',\n        ');
    }

    if (requestBody !== undefined && requestBody !== null) {
      annotations.push(
        this.isBinaryRequestBody(context) || this.usesStringRequestBody(context)
          ? `@Body body: RequestBody`
          : `@Body body: Any`
      );
    }

    return annotations.join(',\n        ');
  }

  private buildRetrofitParameters(
    cookies: ExampleOpenAPIParameter[],
    queryParams: ExampleOpenAPIParameter[],
    headers: ExampleOpenAPIParameter[],
    requestBody: any,
    context: CodeGenerateContext
  ): string {
    const params: string[] = [];
    const queryBindings = this.buildQueryParameterBindings(queryParams);

    if (cookies.length > 0) {
      params.push(`cookieHeader`);
    }

    queryBindings.forEach((binding) => {
      params.push(
        `"${this.escapeDoubleQuoted(
          binding.allowReserved
            ? this.encodeQueryParameterValue(binding.value, true)
            : binding.value
        )}"`
      );
    });

    headers.forEach((header) => {
      params.push(
        `"${this.escapeDoubleQuoted(
          this.serializeHeaderParameterValue(header)
        )}"`
      );
    });

    if (this.isMultipartRequestBody(context)) {
      this.getMultipartFieldParts(requestBody).forEach((part) => {
        params.push(
          `RequestBody.create(MediaType.parse("text/plain"), "${this.escapeDoubleQuoted(
            part.value
          )}")`
        );
      });
      this.getMultipartFileParts(requestBody).forEach((part) => {
        params.push(
          `MultipartBody.Part.createFormData("${this.escapeDoubleQuoted(
            part.name
          )}", "${this.escapeDoubleQuoted(
            part.filename || part.name
          )}", RequestBody.create(MediaType.parse("${this.escapeDoubleQuoted(
            part.contentType || 'application/octet-stream'
          )}"), "${this.escapeDoubleQuoted(part.value)}"))`
        );
      });
      return params.join(',\n        ');
    }

    if (requestBody !== undefined && requestBody !== null) {
      if (this.isBinaryRequestBody(context)) {
        const contentType =
          context.requestContentType || 'application/octet-stream';
        params.push(
          `RequestBody.create(MediaType.parse("${contentType}"), requestBody)`
        );
      } else if (this.usesStringRequestBody(context)) {
        const contentType = context.requestContentType || 'text/plain';
        params.push(
          `RequestBody.create(MediaType.parse("${contentType}"), "${this.escapeDoubleQuoted(
            this.serializeStringRequestBody(requestBody, context)
          )}")`
        );
      } else {
        params.push(
          `Gson().fromJson("${this.escapeDoubleQuoted(
            JSON.stringify(requestBody, null, 2)
          )}", Any::class.java)`
        );
      }
    }

    return params.join(',\n        ');
  }

  private hasRequestBody(method: HttpMethod, requestBody: any): boolean {
    return (
      ['POST', 'PUT', 'PATCH'].includes(method) &&
      requestBody !== undefined &&
      requestBody !== null
    );
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

    return `val requestBody = File("${this.escapeDoubleQuoted(
      this.getBinaryRequestBodyFileName(requestBody)
    )}").readBytes()`;
  }

  private escapeDoubleQuoted(value: string): string {
    return value
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\r?\n/g, '\\n');
  }
}
