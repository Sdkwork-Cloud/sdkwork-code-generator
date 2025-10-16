/**
 * MCP (Model Context Protocol) 相关类型定义
 */

export interface MCPConfig {
  /** 协议版本 */
  version: string;
  /** 服务器配置 */
  server: {
    /** 主机地址 */
    host: string;
    /** 端口号 */
    port: number;
    /** 协议类型 */
    protocol: 'http' | 'https' | 'ws' | 'wss';
  };
  /** 认证配置 */
  auth?: {
    /** 认证类型 */
    type: 'bearer' | 'basic' | 'api_key' | 'oauth2';
    /** 令牌 */
    token?: string;
    /** API 密钥 */
    apiKey?: string;
    /** 用户名 */
    username?: string;
    /** 密码 */
    password?: string;
  };
  /** 超时配置 */
  timeout?: {
    /** 连接超时时间(毫秒) */
    connect: number;
    /** 请求超时时间(毫秒) */
    request: number;
    /** 响应超时时间(毫秒) */
    response: number;
  };
  /** 重试配置 */
  retry?: {
    /** 重试次数 */
    attempts: number;
    /** 重试间隔(毫秒) */
    delay: number;
    /** 退避策略 */
    backoff: 'linear' | 'exponential';
  };
}

export interface MCPTool {
  /** 工具名称 */
  name: string;
  /** 工具描述 */
  description: string;
  /** 工具版本 */
  version: string;
  /** 工具作者 */
  author?: string;
  /** 工具许可证 */
  license?: string;
  /** 工具依赖 */
  dependencies?: Record<string, string>;
  /** 工具配置 */
  config?: MCPConfig;
  /** 工具方法 */
  methods: MCPMethod[];
}

export interface MCPMethod {
  /** 方法名称 */
  name: string;
  /** 方法描述 */
  description: string;
  /** 方法参数 */
  parameters: MCPSchema[];
  /** 返回值类型 */
  returns: MCPSchema;
  /** 是否异步 */
  async?: boolean;
  /** 是否弃用 */
  deprecated?: boolean;
}

export interface MCPSchema {
  /** 类型 */
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null' | 'any';
  /** 描述 */
  description?: string;
  /** 是否必需 */
  required?: boolean;
  /** 默认值 */
  default?: unknown;
  /** 枚举值 */
  enum?: unknown[];
  /** 最小长度/最小值 */
  minimum?: number;
  /** 最大长度/最大值 */
  maximum?: number;
  /** 模式匹配 */
  pattern?: string;
  /** 属性定义(对象类型) */
  properties?: Record<string, MCPSchema>;
  /** 项定义(数组类型) */
  items?: MCPSchema;
  /** 附加属性 */
  additionalProperties?: boolean | MCPSchema;
}

export interface MCPGenerationOptions {
  /** 目标语言 */
  language: 'javascript' | 'typescript' | 'python' | 'go' | 'java';
  /** 框架类型 */
  framework?: 'express' | 'koa' | 'nestjs' | 'fastify' | 'flask' | 'django' | 'gin' | 'springboot';
  /** 包管理器 */
  packageManager?: 'npm' | 'yarn' | 'pnpm' | 'pip' | 'go mod' | 'maven' | 'gradle';
  /** 是否生成测试代码 */
  generateTests?: boolean;
  /** 是否生成文档 */
  generateDocs?: boolean;
  /** 是否生成示例 */
  generateExamples?: boolean;
  /** 输出目录 */
  outputDir?: string;
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
  };
}