初始化当前项目，该项目是一个代码生成器，
支持nodejs，browser等方式直接引入使用，使用typescript语言，支持编译成不同的方式：支持esm，cjs，umd等方式。可以支持浏览器、nodejs、electron、小程序、uniapp等方式使用。
使用es6的语法，支持esm和cjs两种方式，支持typescript。

使用eslint进行代码检查，使用prettier进行代码格式化。
使用jest进行单元测试，使用mocha进行单元测试。
使用vite进行构建，并使用最新的nodejs技术。
作为一个公共的开源库，
该库名称叫：sdkwork-code-generator,支持标准代码生成，同时支持生成各种不同的语言，
并遵循openapi 3.x最新的标准，支持MPC工具生成，支持通过openapi标准的json格式，
生成sdk代码和HTTP请求代码。生成对应的README文档，并生成项目文档。项目文档工程在docs目录下。
支持编写单元测试，并生成单元测试代码。
目录结构：
src/
  index.ts
  prompts/
    system/
       index.ts
    index.ts
  core/
  mcp/
    http/
    index.ts
    base.ts
    parser/
  openapi/
    parser/
       json/
       yaml/
       index.ts
       base.ts
    generator/ 
       languages/
          javascript/
          typescript/
          python/
          go/
          java/
          cpp/
          csharp/
          php/
          ruby/
          swift/
          kotlin/
          dart/
       index.ts
       base.ts

  sdk/ 
    generator/
      languages/
        javascript/
        typescript/
        python/
        go/
        java/
        cpp/
        csharp/
        php/
        ruby/
        swift/
        kotlin/
        dart/
  docs/ 
  types/
      mcp.ts
      index.ts
      openapi.ts // openapi标准
      api-request.ts // 基于openapi标准生成请求代码，包括不同语言的接口实现，定义接口：RequestCodeGenerator 定义接口，generate目标语言的请求代码，以及目标语言的请求实现。
      sdk.ts  // 不同语言的sdk代码,包括SdkGenerator 定义接口，generate目标语言的sdk project，以及目标语言的sdk实现。  
      context.ts // 上下文信息
      prompts.ts // 用户输入的信息 
  utils/