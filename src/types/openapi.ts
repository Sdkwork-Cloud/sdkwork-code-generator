/**
 * OpenAPI 3.x 标准类型定义
 */

export interface OpenAPISpec {
  /** OpenAPI 版本 */
  openapi: string;
  /** API 信息 */
  info: OpenAPIInfo;
  /** 服务器配置 */
  servers?: OpenAPIServer[];
  /** 路径定义 */
  paths: Record<string, OpenAPIPathItem>;
  /** Webhooks 定义 */
  webhooks?: Record<string, OpenAPIPathItem>;
  /** 组件定义 */
  components?: OpenAPIComponents;
  /** 安全配置 */
  security?: OpenAPISecurityRequirement[];
  /** 标签定义 */
  tags?: OpenAPITag[];
  /** 外部文档 */
  externalDocs?: OpenAPIExternalDocumentation;
}

export interface OpenAPIInfo {
  /** API 标题 */
  title: string;
  /** API 描述 */
  description?: string;
  /** API 版本 */
  version: string;
  /** 服务条款 */
  termsOfService?: string;
  /** 联系人信息 */
  contact?: OpenAPIContact;
  /** 许可证信息 */
  license?: OpenAPILicense;
}

export interface OpenAPIContact {
  /** 联系人姓名 */
  name?: string;
  /** 联系人邮箱 */
  email?: string;
  /** 联系人网址 */
  url?: string;
}

export interface OpenAPILicense {
  /** 许可证名称 */
  name: string;
  /** 许可证网址 */
  url?: string;
}

export interface OpenAPIServer {
  /** 服务器URL */
  url: string;
  /** 服务器描述 */
  description?: string;
  /** 服务器变量 */
  variables?: Record<string, OpenAPIServerVariable>;
}

export interface OpenAPIServerVariable {
  /** 变量默认值 */
  default: string;
  /** 变量描述 */
  description?: string;
  /** 变量枚举值 */
  enum?: string[];
}

export interface OpenAPIPathItem {
  /** 摘要 */
  summary?: string;
  /** 描述 */
  description?: string;
  /** GET 操作 */
  get?: OpenAPIOperation;
  /** POST 操作 */
  post?: OpenAPIOperation;
  /** PUT 操作 */
  put?: OpenAPIOperation;
  /** DELETE 操作 */
  delete?: OpenAPIOperation;
  /** PATCH 操作 */
  patch?: OpenAPIOperation;
  /** HEAD 操作 */
  head?: OpenAPIOperation;
  /** OPTIONS 操作 */
  options?: OpenAPIOperation;
  /** TRACE 操作 */
  trace?: OpenAPIOperation;
  /** 参数定义 */
  parameters?: OpenAPIParameter[];
  /** 服务器配置 */
  servers?: OpenAPIServer[];
}

export interface OpenAPIOperation {
  /** 操作标签 */
  tags?: string[];
  /** 操作摘要 */
  summary?: string;
  /** 操作描述 */
  description?: string;
  /** 外部文档 */
  externalDocs?: OpenAPIExternalDocumentation;
  /** 操作ID */
  operationId?: string;
  /** 参数列表 */
  parameters?: OpenAPIParameter[];
  /** 请求体 */
  requestBody?: OpenAPIRequestBody;
  /** 响应定义 */
  responses: Record<string, OpenAPIResponse>;
  /** 回调定义 */
  callbacks?: Record<string, OpenAPICallback>;
  /** 是否弃用 */
  deprecated?: boolean;
  /** 安全配置 */
  security?: OpenAPISecurityRequirement[];
  /** 服务器配置 */
  servers?: OpenAPIServer[];
}

export interface OpenAPIParameter {
  /** 参数名称 */
  name: string;
  /** 参数位置 */
  in: 'query' | 'header' | 'path' | 'cookie';
  /** 参数描述 */
  description?: string;
  /** 是否必需 */
  required?: boolean;
  /** 是否弃用 */
  deprecated?: boolean;
  /** 是否允许空值 */
  allowEmptyValue?: boolean;
  /** 参数模式 */
  schema?: OpenAPISchema;
  /** 参数示例 */
  example?: unknown;
  /** 参数示例 */
  examples?: Record<string, OpenAPIExample>;
  /** 参数内容 */
  content?: Record<string, OpenAPIMediaType>;
  /** 参数样式 */
  style?:
    | 'matrix'
    | 'label'
    | 'form'
    | 'cookie'
    | 'simple'
    | 'spaceDelimited'
    | 'pipeDelimited'
    | 'deepObject';
  /** 是否展开 */
  explode?: boolean;
  /** 是否允许保留 */
  allowReserved?: boolean;
}

export interface OpenAPIRequestBody {
  /** 请求体描述 */
  description?: string;
  /** 请求体内容 */
  content: Record<string, OpenAPIMediaType>;
  /** 是否必需 */
  required?: boolean;
}

export interface OpenAPIResponse {
  /** 响应描述 */
  description: string;
  /** 响应头 */
  headers?: Record<string, OpenAPIHeader>;
  /** 响应内容 */
  content?: Record<string, OpenAPIMediaType>;
  /** 响应链接 */
  links?: Record<string, OpenAPILink>;
}

export interface OpenAPICallback extends Record<string, OpenAPIPathItem> {}

export interface OpenAPIComponents {
  /** 模式定义 */
  schemas?: Record<string, OpenAPISchema>;
  /** 响应定义 */
  responses?: Record<string, OpenAPIResponse>;
  /** 参数定义 */
  parameters?: Record<string, OpenAPIParameter>;
  /** 示例定义 */
  examples?: Record<string, OpenAPIExample>;
  /** 请求体定义 */
  requestBodies?: Record<string, OpenAPIRequestBody>;
  /** 头定义 */
  headers?: Record<string, OpenAPIHeader>;
  /** 安全方案定义 */
  securitySchemes?: Record<string, OpenAPISecurityScheme>;
  /** 链接定义 */
  links?: Record<string, OpenAPILink>;
  /** 回调定义 */
  callbacks?: Record<string, OpenAPICallback>;
}

export interface OpenAPISecurityRequirement extends Record<string, string[]> {}

export interface OpenAPITag {
  /** 标签名称 */
  name: string;
  /** 标签描述 */
  description?: string;
  /** 外部文档 */
  externalDocs?: OpenAPIExternalDocumentation;
}

export interface OpenAPIExternalDocumentation {
  /** 文档描述 */
  description?: string;
  /** 文档网址 */
  url: string;
}

export interface OpenAPISchema {
  /** JSON Schema 兼容类型定义 */
  type?:
    | 'string'
    | 'number'
    | 'integer'
    | 'boolean'
    | 'array'
    | 'object'
    | 'null';
  /** 模式 */
  format?: string;
  /** 描述 */
  description?: string;
  /** 标题 */
  title?: string;
  /** 是否必需 */
  required?: string[];
  /** 属性定义 */
  properties?: Record<string, OpenAPISchema>;
  /** 附加属性 */
  additionalProperties?: boolean | OpenAPISchema;
  /** 项定义 */
  items?: OpenAPISchema;
  /** 最小长度 */
  minLength?: number;
  /** 最大长度 */
  maxLength?: number;
  /** 最小值 */
  minimum?: number;
  /** 最大值 */
  maximum?: number;
  /** 排除最小值 */
  exclusiveMinimum?: number | boolean;
  /** 排除最大值 */
  exclusiveMaximum?: number | boolean;
  /** 枚举值 */
  enum?: unknown[];
  /** 常量值 */
  const?: unknown;
  /** 默认值 */
  default?: unknown;
  /** 示例 */
  example?: unknown;
  /** 是否只读 */
  readOnly?: boolean;
  /** 是否可写 */
  writeOnly?: boolean;
  /** 是否可为空 */
  nullable?: boolean;
  /** 引用 */
  $ref?: string;
  /** 所有模式 */
  allOf?: OpenAPISchema[];
  /** 任一模式 */
  anyOf?: OpenAPISchema[];
  /** 唯一模式 */
  oneOf?: OpenAPISchema[];
  /** 非模式 */
  not?: OpenAPISchema;
  /** 模式匹配 */
  pattern?: string;
  /** 多重限制 */
  multipleOf?: number;
  /** 最小项数 */
  minItems?: number;
  /** 最大项数 */
  maxItems?: number;
  /** 唯一项 */
  uniqueItems?: boolean;
  /** 最小属性数 */
  minProperties?: number;
  /** 最大属性数 */
  maxProperties?: number;
  /** 依赖关系 */
  dependencies?: Record<string, string[] | OpenAPISchema>;
  /** 模式依赖 */
  patternProperties?: Record<string, OpenAPISchema>;
  /** 属性名称模式 */
  propertyNames?: OpenAPISchema;
  /** 包含 */
  contains?: OpenAPISchema;
  /** 如果条件 */
  if?: OpenAPISchema;
  /** 那么条件 */
  then?: OpenAPISchema;
  /** 否则条件 */
  else?: OpenAPISchema;
}

export interface OpenAPIExample {
  /** 示例摘要 */
  summary?: string;
  /** 示例描述 */
  description?: string;
  /** 示例值 */
  value?: unknown;
  /** 外部值 */
  externalValue?: string;
}

export interface OpenAPIMediaType {
  /** 媒体类型模式 */
  schema?: OpenAPISchema;
  /** 媒体类型示例 */
  example?: unknown;
  /** 媒体类型示例 */
  examples?: Record<string, OpenAPIExample>;
  /** 媒体类型编码 */
  encoding?: Record<string, OpenAPIEncoding>;
}

export interface OpenAPIHeader extends Omit<OpenAPIParameter, 'in' | 'name'> {}

export interface OpenAPILink {
  /** 链接描述 */
  description?: string;
  /** 操作ID */
  operationId?: string;
  /** 参数映射 */
  parameters?: Record<string, unknown>;
  /** 请求体 */
  requestBody?: unknown;
  /** 服务器配置 */
  servers?: OpenAPIServer[];
}

export interface OpenAPISecurityScheme {
  /** 安全方案类型 */
  type: 'apiKey' | 'http' | 'oauth2' | 'openIdConnect';
  /** 安全方案描述 */
  description?: string;
  /** 参数名称(apiKey类型) */
  name?: string;
  /** 参数位置(apiKey类型) */
  in?: 'query' | 'header' | 'cookie';
  /** 方案(http类型) */
  scheme?: string;
  /** 承载格式(http类型) */
  bearerFormat?: string;
  /** 流(oauth2类型) */
  flows?: OpenAPIOAuthFlows;
  /** OpenID连接URL(openIdConnect类型) */
  openIdConnectUrl?: string;
}

export interface OpenAPIOAuthFlows {
  /** 隐式流 */
  implicit?: OpenAPIOAuthFlow;
  /** 密码流 */
  password?: OpenAPIOAuthFlow;
  /** 客户端凭证流 */
  clientCredentials?: OpenAPIOAuthFlow;
  /** 授权码流 */
  authorizationCode?: OpenAPIOAuthFlow;
}

export interface OpenAPIOAuthFlow {
  /** 授权URL */
  authorizationUrl: string;
  /** 令牌URL */
  tokenUrl: string;
  /** 刷新URL */
  refreshUrl?: string;
  /** 作用域 */
  scopes: Record<string, string>;
}

export interface OpenAPIEncoding {
  /** 内容类型 */
  contentType?: string;
  /** 头信息 */
  headers?: Record<string, OpenAPIHeader>;
  /** 样式 */
  style?: 'form' | 'spaceDelimited' | 'pipeDelimited' | 'deepObject';
  /** 是否展开 */
  explode?: boolean;
  /** 是否允许保留 */
  allowReserved?: boolean;
}
