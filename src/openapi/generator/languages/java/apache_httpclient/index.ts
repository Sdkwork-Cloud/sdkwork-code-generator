import { BaseRequestCodeGenerator } from '@/openapi/generator/generator';
import {
  CodeGenerateContext,
  ExampleOpenAPIParameter,
  HttpMethod,
  Language,
  OpenAPIOperation,
} from '@/types';

export class ApacheHttpClientJavaRequestCodeGenerator extends BaseRequestCodeGenerator {
  getLanguage(): Language {
    return 'java';
  }

  getLibrary(): string {
    return 'apache-httpclient';
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
    const expectedSuccessStatusCode =
      this.getExpectedSuccessStatusCode(context);
    const successStatusCheck = this.usesAny2xxSuccessStatus(context)
      ? 'response.getStatusLine().getStatusCode() < 200 || response.getStatusLine().getStatusCode() >= 300'
      : `response.getStatusLine().getStatusCode() != ${expectedSuccessStatusCode}`;
    const handlesBinaryResponse = this.isBinaryResponse(context);
    const objectMapperImport = handlesBinaryResponse
      ? ''
      : 'import com.fasterxml.jackson.databind.ObjectMapper;\n';
    const objectMapperField = handlesBinaryResponse
      ? ''
      : '    private static final ObjectMapper objectMapper = new ObjectMapper();\n\n';
    const responseDataType = handlesBinaryResponse ? 'byte[]' : 'Object';
    const responseBodyReadCode = handlesBinaryResponse
      ? 'byte[] responseBody = EntityUtils.toByteArray(entity);'
      : 'String responseBody = EntityUtils.toString(entity);';
    const resultCreationCode = handlesBinaryResponse
      ? 'byte[] result = responseBody;'
      : 'Object result = objectMapper.readValue(responseBody, Object.class);';
    const responseLoggingCode = handlesBinaryResponse
      ? 'System.out.println("Response bytes: " + responseBody.length);'
      : 'System.out.println("Response: " + result);';
    const requestClass = `Http${
      method.charAt(0).toUpperCase() + method.slice(1).toLowerCase()
    }`;
    const queryEncodingImports =
      queryParams.length > 0 &&
      !this.hasAllowReservedQueryParameters(queryParams)
        ? 'import java.net.URLEncoder;\nimport java.nio.charset.StandardCharsets;\n'
        : '';

    return `${objectMapperImport}import java.io.File;
import java.net.URI;
${queryEncodingImports}import org.apache.http.HttpEntity;
import org.apache.http.HttpResponse;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.${requestClass};
import org.apache.http.entity.ContentType;
import org.apache.http.entity.FileEntity;
import org.apache.http.entity.StringEntity;
import org.apache.http.entity.mime.MultipartEntityBuilder;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.util.EntityUtils;

/**
 * ${operation.summary || operation.description || 'API request'}
 */
public class ${className} {

${objectMapperField}    public static ${className}Response ${methodName}() throws Exception {
        String url = "${this.escapeDoubleQuotedString(
          this.buildRequestUrl(baseUrl, path)
        )}";
        ${this.buildQueryParamsCode(queryParams)}

        HttpClient httpClient = HttpClients.createDefault();
        ${requestClass} request = new ${requestClass}();
        request.setURI(new URI(url));

        ${this.buildHeadersCode(
          headers,
          method,
          requestBody,
          context,
          'request'
        )}
        ${this.buildRequestBodyCode(method, requestBody, context, 'request')}

        HttpResponse response = httpClient.execute(request);
        HttpEntity entity = response.getEntity();

        if (${successStatusCheck}) {
            throw new RuntimeException("HTTP error! status: " + response.getStatusLine().getStatusCode());
        }

        ${responseBodyReadCode}
        ${resultCreationCode}

        ${responseLoggingCode}

        return new ${className}Response(result, response.getStatusLine().getStatusCode());
    }

    public static class ${className}Response {
        private ${responseDataType} data;
        private int status;

        public ${className}Response(${responseDataType} data, int status) {
            this.data = data;
            this.status = status;
        }

        public ${responseDataType} getData() { return data; }
        public void setData(${responseDataType} data) { this.data = data; }
        public int getStatus() { return status; }
        public void setStatus(int status) { this.status = status; }
    }

    public static void main(String[] args) {
        try {
            ${className}Response result = ${methodName}();
            System.out.println("Success: " + result.getData());
        } catch (Exception e) {
            System.err.println("Error: " + e.getMessage());
            e.printStackTrace();
        }
    }
}`;
  }

  private buildQueryParamsCode(queryParams: ExampleOpenAPIParameter[]): string {
    if (this.hasAllowReservedQueryParameters(queryParams)) {
      return `url += (url.contains("?") ? "&" : "?") + "${this.escapeDoubleQuoted(
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
          )}=" + URLEncoder.encode("${this.escapeDoubleQuoted(
            String(param.value)
          )}", StandardCharsets.UTF_8.toString());`
      )
      .join('\n        ');
  }

  private buildHeadersCode(
    headers: ExampleOpenAPIParameter[],
    method: HttpMethod,
    requestBody: any,
    context: CodeGenerateContext,
    requestVar: string
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
          `${requestVar}.setHeader("${header.name}", "${this.escapeDoubleQuoted(
            this.serializeHeaderParameterValue(header)
          )}");`
      )
      .join('\n        ');
  }

  private buildRequestBodyCode(
    method: HttpMethod,
    requestBody: any,
    context: CodeGenerateContext,
    requestVar: string
  ): string {
    if (!this.hasRequestBody(method, requestBody)) {
      return '';
    }

    if (this.isMultipartRequestBody(context)) {
      return this.buildMultipartRequestBodyCode(requestBody, requestVar);
    }

    if (this.isBinaryRequestBody(context)) {
      return `HttpEntity requestBody = new FileEntity(new File("${this.escapeDoubleQuoted(
        this.getBinaryRequestBodyFileName(requestBody)
      )}"), ContentType.APPLICATION_OCTET_STREAM);
        ${requestVar}.setEntity(requestBody);`;
    }

    if (this.usesStringRequestBody(context)) {
      return `String requestBody = "${this.escapeDoubleQuoted(
        this.serializeStringRequestBody(requestBody, context)
      )}";
        ${requestVar}.setEntity(new StringEntity(requestBody, StandardCharsets.UTF_8));`;
    }

    return `String requestBody = "${this.escapeDoubleQuoted(
      JSON.stringify(requestBody, null, 2)
    )}";
        ${requestVar}.setEntity(new StringEntity(requestBody, StandardCharsets.UTF_8));`;
  }

  private buildMultipartRequestBodyCode(
    requestBody: any,
    requestVar: string
  ): string {
    const fieldLines = this.getMultipartFieldParts(requestBody).map(
      (part) =>
        `            .addTextBody("${this.escapeDoubleQuoted(
          part.name
        )}", "${this.escapeDoubleQuoted(part.value)}")`
    );
    const filePart = this.getMultipartFileParts(requestBody)[0];
    const fileLines = filePart
      ? [
          `            .addBinaryBody("${this.escapeDoubleQuoted(
            filePart.name
          )}", "${this.escapeDoubleQuoted(
            filePart.value
          )}".getBytes(StandardCharsets.UTF_8), ContentType.create("${this.escapeDoubleQuoted(
            filePart.contentType || 'application/octet-stream'
          )}"), "${this.escapeDoubleQuoted(
            filePart.filename || filePart.name
          )}")`,
        ]
      : [];

    return `HttpEntity requestBody = MultipartEntityBuilder.create()
${[...fieldLines, ...fileLines].join('\n')}
            .build();
        ${requestVar}.setEntity(requestBody);`;
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
}
