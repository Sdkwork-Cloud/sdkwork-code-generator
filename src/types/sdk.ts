/**
 * SDK 代码生成相关类型定义
 */

import {
  ApiRequestDefinition,
  CodeGenerateContext,
  CodeGenerateResult,
} from './code';

export interface SDKConfig {
  /** SDK 名称 */
  name: string;
  /** SDK 版本 */
  version: string;
  /** SDK 描述 */
  description?: string;
  /** SDK 作者 */
  author?: string;
  /** SDK 许可证 */
  license?: string;
  /** 目标语言 */
  language:
    | 'javascript'
    | 'typescript'
    | 'python'
    | 'go'
    | 'java'
    | 'cplusplus'
    | 'csharp'
    | 'php'
    | 'ruby'
    | 'swift'
    | 'kotlin'
    | 'dart';
  /** 目标框架 */
  framework?:
    | 'axios'
    | 'fetch'
    | 'requests'
    | 'http.client'
    | 'net/http'
    | 'okhttp'
    | 'retrofit'
    | 'restclient'
    | 'faraday'
    | 'alamofire'
    | 'http';
  /** 包管理器 */
  packageManager?:
    | 'npm'
    | 'yarn'
    | 'pnpm'
    | 'pip'
    | 'poetry'
    | 'go mod'
    | 'maven'
    | 'gradle'
    | 'composer'
    | 'bundler'
    | 'carthage'
    | 'pub';
  /** 输出目录 */
  outputDir: string;
  /** 基础URL */
  baseUrl?: string;
  /** 认证配置 */
  auth?: {
    /** 认证类型 */
    type: 'bearer' | 'basic' | 'api_key' | 'oauth2' | 'custom';
    /** 令牌字段名 */
    tokenField?: string;
    /** 令牌前缀 */
    tokenPrefix?: string;
    /** 认证头名称 */
    headerName?: string;
    /** 查询参数名 */
    queryParam?: string;
  };
  /** HTTP客户端配置 */
  httpClient?: {
    /** 超时时间(毫秒) */
    timeout?: number;
    /** 重试次数 */
    retry?: number;
    /** 重试间隔(毫秒) */
    retryDelay?: number;
    /** 是否启用代理 */
    proxy?: boolean;
    /** 代理配置 */
    proxyConfig?: {
      /** 代理协议 */
      protocol: 'http' | 'https' | 'socks';
      /** 代理主机 */
      host: string;
      /** 代理端口 */
      port: number;
      /** 代理认证 */
      auth?: {
        /** 用户名 */
        username: string;
        /** 密码 */
        password: string;
      };
    };
    /** 是否启用缓存 */
    cache?: boolean;
    /** 缓存配置 */
    cacheConfig?: {
      /** 缓存类型 */
      type:
        | 'memory'
        | 'localStorage'
        | 'sessionStorage'
        | 'redis'
        | 'memcached';
      /** 缓存时间(秒) */
      ttl: number;
      /** 缓存键前缀 */
      keyPrefix?: string;
    };
    /** 是否启用日志 */
    logging?: boolean;
    /** 日志级别 */
    logLevel?: 'debug' | 'info' | 'warn' | 'error';
  };
  /** 代码风格配置 */
  codeStyle?: {
    /** 缩进类型 */
    indent: 'space' | 'tab';
    /** 缩进大小 */
    indentSize: number;
    /** 引号类型 */
    quotes: 'single' | 'double';
    /** 分号 */
    semicolons: boolean;
    /** 行尾符 */
    lineEndings: 'lf' | 'crlf';
    /** 最大行长度 */
    maxLineLength?: number;
    /** 是否使用尾随逗号 */
    trailingCommas?: boolean;
    /** 是否使用括号间距 */
    bracketSpacing?: boolean;
  };
  /** 生成选项 */
  generation?: {
    /** 是否生成类型定义 */
    generateTypes?: boolean;
    /** 是否生成接口定义 */
    generateInterfaces?: boolean;
    /** 是否生成类定义 */
    generateClasses?: boolean;
    /** 是否生成工具函数 */
    generateUtilities?: boolean;
    /** 是否生成测试代码 */
    generateTests?: boolean;
    /** 是否生成文档 */
    generateDocs?: boolean;
    /** 是否生成示例 */
    generateExamples?: boolean;
    /** 是否生成配置 */
    generateConfig?: boolean;
    /** 是否生成包管理文件 */
    generatePackageFiles?: boolean;
    /** 是否生成Dockerfile */
    generateDockerfile?: boolean;
    /** 是否生成CI/CD配置 */
    generateCICD?: boolean;
  };
}

export interface SDKModule {
  /** 模块名称 */
  name: string;
  /** 模块描述 */
  description?: string;
  /** 模块版本 */
  version?: string;
  /** 模块路径 */
  path: string;
  /** 模块依赖 */
  dependencies?: string[];
  /** 模块接口 */
  interfaces: SDKInterface[];
  /** 模块类 */
  classes: SDKClass[];
  /** 模块函数 */
  functions: SDFunction[];
  /** 模块类型 */
  types: SDKType[];
  /** 模块工具 */
  utilities: SDKUtility[];
}

export interface SDKInterface {
  /** 接口名称 */
  name: string;
  /** 接口描述 */
  description?: string;
  /** 接口方法 */
  methods: SDKMethod[];
  /** 接口属性 */
  properties: SDKProperty[];
  /** 是否导出 */
  export: boolean;
  /** 是否默认导出 */
  defaultExport?: boolean;
  /** 接口扩展 */
  extends?: string[];
  /** 接口实现 */
  implements?: string[];
}

export interface SDKClass {
  /** 类名称 */
  name: string;
  /** 类描述 */
  description?: string;
  /** 类构造函数 */
  constructor?: SDKConstructor;
  /** 类方法 */
  methods: SDKMethod[];
  /** 类属性 */
  properties: SDKProperty[];
  /** 类静态方法 */
  staticMethods?: SDKMethod[];
  /** 类静态属性 */
  staticProperties?: SDKProperty[];
  /** 是否导出 */
  export: boolean;
  /** 是否默认导出 */
  defaultExport?: boolean;
  /** 类扩展 */
  extends?: string;
  /** 类实现 */
  implements?: string[];
  /** 类修饰符 */
  modifiers?: ('abstract' | 'final' | 'sealed')[];
}

export interface SDKConstructor {
  /** 构造函数参数 */
  parameters: SDKParameter[];
  /** 构造函数体 */
  body: string;
  /** 构造函数注释 */
  comments?: string[];
}

export interface SDKMethod {
  /** 方法名称 */
  name: string;
  /** 方法描述 */
  description?: string;
  /** 方法参数 */
  parameters: SDKParameter[];
  /** 返回值类型 */
  returnType: string;
  /** 方法体 */
  body: string;
  /** 是否异步 */
  async: boolean;
  /** 是否静态 */
  static?: boolean;
  /** 访问修饰符 */
  access?: 'public' | 'protected' | 'private';
  /** 方法修饰符 */
  modifiers?: ('abstract' | 'final' | 'override')[];
  /** 方法注释 */
  comments?: string[];
  /** 方法异常 */
  throws?: string[];
}

export interface SDKParameter {
  /** 参数名称 */
  name: string;
  /** 参数类型 */
  type: string;
  /** 参数描述 */
  description?: string;
  /** 是否必需 */
  required: boolean;
  /** 默认值 */
  defaultValue?: unknown;
  /** 参数修饰符 */
  modifiers?: ('readonly' | 'optional' | 'rest')[];
}

export interface SDKProperty {
  /** 属性名称 */
  name: string;
  /** 属性类型 */
  type: string;
  /** 属性描述 */
  description?: string;
  /** 属性值 */
  value?: unknown;
  /** 是否只读 */
  readonly?: boolean;
  /** 是否静态 */
  static?: boolean;
  /** 访问修饰符 */
  access?: 'public' | 'protected' | 'private';
  /** 属性修饰符 */
  modifiers?: ('abstract' | 'final')[];
  /** 属性注释 */
  comments?: string[];
}

export interface SDFunction {
  /** 函数名称 */
  name: string;
  /** 函数描述 */
  description?: string;
  /** 函数参数 */
  parameters: SDKParameter[];
  /** 返回值类型 */
  returnType: string;
  /** 函数体 */
  body: string;
  /** 是否异步 */
  async: boolean;
  /** 是否导出 */
  export: boolean;
  /** 是否默认导出 */
  defaultExport?: boolean;
  /** 函数注释 */
  comments?: string[];
  /** 函数异常 */
  throws?: string[];
}

export interface SDKType {
  /** 类型名称 */
  name: string;
  /** 类型描述 */
  description?: string;
  /** 类型定义 */
  definition: string;
  /** 是否导出 */
  export: boolean;
  /** 是否默认导出 */
  defaultExport?: boolean;
  /** 类型注释 */
  comments?: string[];
}

export interface SDKUtility {
  /** 工具名称 */
  name: string;
  /** 工具描述 */
  description?: string;
  /** 工具函数 */
  function: SDFunction;
  /** 工具类型 */
  types?: SDKType[];
  /** 工具常量 */
  constants?: SDKConstant[];
  /** 是否导出 */
  export: boolean;
}

export interface SDKConstant {
  /** 常量名称 */
  name: string;
  /** 常量值 */
  value: unknown;
  /** 常量描述 */
  description?: string;
  /** 常量类型 */
  type: string;
  /** 是否导出 */
  export: boolean;
  /** 常量注释 */
  comments?: string[];
}

export interface SDKGenerationResult {
  /** 生成的文件列表 */
  files: GeneratedSdkFile[];
  /** 生成的代码统计 */
  stats: {
    /** 总文件数 */
    totalFiles: number;
    /** 总代码行数 */
    totalLines: number;
    /** 模块数量 */
    moduleCount: number;
    /** 接口数量 */
    interfaceCount: number;
    /** 类数量 */
    classCount: number;
    /** 函数数量 */
    functionCount: number;
    /** 类型数量 */
    typeCount: number;
    /** 工具数量 */
    utilityCount: number;
  };
  /** 生成耗时(毫秒) */
  duration: number;
  /** 生成错误 */
  errors?: string[];
  /** 生成警告 */
  warnings?: string[];
  /** 包管理文件 */
  packageFiles?: GeneratedSdkFile[];
  /** 配置文件 */
  configFiles?: GeneratedSdkFile[];
  /** 文档文件 */
  docFiles?: GeneratedSdkFile[];
  /** 测试文件 */
  testFiles?: GeneratedSdkFile[];
}

export interface GeneratedSdkFile {
  /** 文件路径 */
  path: string;
  /** 文件内容 */
  content: string;
  /** 文件大小(字节) */
  size: number;
  /** 文件行数 */
  lines: number;
  /** 文件类型 */
  type:
    | 'typescript'
    | 'javascript'
    | 'python'
    | 'go'
    | 'java'
    | 'json'
    | 'yaml'
    | 'markdown'
    | 'html'
    | 'css'
    | 'other';
}

export interface SdkUsageCodeGenerator {
  /**
   * Generate HTTP request code for a specific OpenAPI operation
   * @param operation - OpenAPI operation to generate code for
   * @param context - Code generation context
   * @returns Generated code result
   */
  generate(
    requestDefinition: ApiRequestDefinition,
    context: CodeGenerateContext
  ): CodeGenerateResult;
}
