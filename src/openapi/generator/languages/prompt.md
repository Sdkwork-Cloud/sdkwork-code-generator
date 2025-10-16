实现代码请求示例代码的流程：
1. 根据代码的语言和选择的Http请求框架，明确编码语言和Http请求框架。建立对应的库的目录，在该目录下创建以库名的代码生成器，
   目录java/okhttp/index.ts,譬如OkHttpRequestCodeGenerator extends BaseRequestCodeGenerator;
   目录java/httpclient/index.ts,譬如HttpClientRequestCodeGenerator extends BaseRequestCodeGenerator;
   每个语言要有统一的export
2. 解析openapi operation的的参数，解析对应的headers、query params、cookies、body内容。
3. 实现方法：abstract handleGenerate(
    pathVariables: OpenAPIParameter[],
    headers: OpenAPIParameter[],
    cookies: OpenAPIParameter[],
    queryParams: OpenAPIParameter[],
    requestBody: any,
    operation: OpenAPIOperation,
    context: CodeGenerateContext
  ): CodeGenerateResult;

4. 先调用exampleGenerator,实现模拟请求数据。详细参考定义
5. 处理pathVariables参数
6. 处理queryParams参数
7. 处理headers参数
8. 处理cookies参数
9. 处理requestBody参数
10. 生成代码请求示例
