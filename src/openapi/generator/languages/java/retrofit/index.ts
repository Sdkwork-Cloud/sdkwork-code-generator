import { BaseRequestCodeGenerator } from '@/openapi/generator/generator';
import {
  CodeGenerateContext,
  ExampleOpenAPIParameter,
  HttpMethod,
  Language,
  OpenAPIOperation,
} from '@/types';

export class RetrofitJavaRequestCodeGenerator extends BaseRequestCodeGenerator {
  getLanguage(): Language {
    return 'java';
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
    const className = this.toIdentifier(
      operation.operationId,
      'ApiRequest',
      'pascal'
    );
    const methodName = this.toIdentifier(
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
      : 'Object';
    const scalarConverterImport =
      this.usesStringResponse(context) && !handlesBinaryResponse
        ? 'import retrofit2.converter.scalars.ScalarsConverterFactory;\n'
        : '';
    const scalarConverterFactory =
      this.usesStringResponse(context) && !handlesBinaryResponse
        ? '            .addConverterFactory(ScalarsConverterFactory.create())\n'
        : '';
    const responseBodyImport = handlesBinaryResponse
      ? 'import okhttp3.ResponseBody;\n'
      : '';
    const expectedSuccessStatusCode =
      this.getExpectedSuccessStatusCode(context);
    const successStatusCheck = this.usesAny2xxSuccessStatus(context)
      ? 'response.code() < 200 || response.code() >= 300'
      : `response.code() != ${expectedSuccessStatusCode}`;
    const responseHandlingCode = handlesBinaryResponse
      ? `ResponseBody data = response.body();
        byte[] responseBytes = data != null ? data.bytes() : new byte[0];
        System.out.println("Response bytes: " + responseBytes.length);`
      : this.usesStringResponse(context)
      ? `String data = response.body();
        System.out.println("Response: " + data);`
      : `Object data = response.body();
        System.out.println("Response: " + data);`;
    const serverUrl = this.parseServerUrl(baseUrl);
    const requestBaseUrl = this.escapeDoubleQuotedString(serverUrl.origin);
    const requestPath = this.combineServerPath(baseUrl, path);

    return `import com.google.gson.Gson;
import java.nio.file.Files;
import java.nio.file.Paths;
import okhttp3.MediaType;
import okhttp3.MultipartBody;
import okhttp3.RequestBody;
${responseBodyImport}import retrofit2.Call;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;
${scalarConverterImport}import retrofit2.http.*;

/**
 * ${operation.summary || operation.description || 'API request'}
 * ${operation.description ? ` * ${operation.description}` : ''}
 */
public class ${className} {

    public interface ApiService {
        ${this.buildMethodAnnotations(
          method,
          requestPath,
          headers,
          requestBody,
          context
        )}
        Call<${responseType}> ${methodName}(
            ${this.buildRetrofitAnnotations(
              queryParams,
              headers,
              requestBody,
              context
            )}
        );
    }

    public static void main(String[] args) {
        try {
            ${methodName}();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public static void ${methodName}() throws Exception {
        Retrofit retrofit = new Retrofit.Builder()
            .baseUrl("${requestBaseUrl}")
${scalarConverterFactory}            .addConverterFactory(GsonConverterFactory.create())
            .build();

        ApiService service = retrofit.create(ApiService.class);
        ${binaryRequestBodySetup}
        Call<${responseType}> call = service.${methodName}(
            ${this.buildRetrofitParameters(
              queryParams,
              headers,
              requestBody,
              context
            )}
        );

        retrofit2.Response<${responseType}> response = call.execute();
        if (${successStatusCheck}) {
            throw new RuntimeException("HTTP error! status: " + response.code());
        }

        ${responseHandlingCode}
    }
}`;
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

    return annotations.join('\n        ');
  }

  private buildRetrofitAnnotations(
    queryParams: ExampleOpenAPIParameter[],
    headers: ExampleOpenAPIParameter[],
    requestBody: any,
    context: CodeGenerateContext
  ): string {
    const annotations: string[] = [];
    const queryBindings = this.buildQueryParameterBindings(queryParams);

    queryBindings.forEach((binding) => {
      annotations.push(
        binding.allowReserved
          ? `@Query(value = "${this.escapeDoubleQuoted(
              binding.name
            )}", encoded = true) String ${binding.identifier}`
          : `@Query("${this.escapeDoubleQuoted(binding.name)}") String ${
              binding.identifier
            }`
      );
    });

    headers.forEach((header) => {
      const headerName = this.toIdentifier(header.name, 'header', 'camel');
      annotations.push(
        `@Header("${this.escapeDoubleQuoted(
          header.name
        )}") String ${headerName}`
      );
    });

    if (this.isMultipartRequestBody(context)) {
      this.getMultipartFieldParts(requestBody).forEach((part) => {
        const partName = this.toIdentifier(part.name, 'part', 'camel');
        annotations.push(
          `@Part("${this.escapeDoubleQuoted(
            part.name
          )}") RequestBody ${partName}`
        );
      });
      this.getMultipartFileParts(requestBody).forEach((part) => {
        const partName = this.toIdentifier(part.name, 'part', 'camel');
        annotations.push(`@Part MultipartBody.Part ${partName}`);
      });
      return annotations.join(',\n            ');
    }

    if (requestBody !== undefined && requestBody !== null) {
      annotations.push(
        this.isBinaryRequestBody(context) || this.usesStringRequestBody(context)
          ? `@Body RequestBody body`
          : `@Body Object body`
      );
    }

    return annotations.join(',\n            ');
  }

  private buildRetrofitParameters(
    queryParams: ExampleOpenAPIParameter[],
    headers: ExampleOpenAPIParameter[],
    requestBody: any,
    context: CodeGenerateContext
  ): string {
    const params: string[] = [];
    const queryBindings = this.buildQueryParameterBindings(queryParams);

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
          )}"), "${this.escapeDoubleQuoted(part.value)}".getBytes()))`
        );
      });
      return params.join(',\n            ');
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
          `new Gson().fromJson("${this.escapeDoubleQuoted(
            JSON.stringify(requestBody, null, 2)
          )}", Object.class)`
        );
      }
    }

    return params.join(',\n            ');
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

    return `byte[] requestBody = Files.readAllBytes(Paths.get("${this.escapeDoubleQuoted(
      this.getBinaryRequestBodyFileName(requestBody)
    )}"));`;
  }

  private escapeDoubleQuoted(value: string): string {
    return value
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\r?\n/g, '\\n');
  }
}
