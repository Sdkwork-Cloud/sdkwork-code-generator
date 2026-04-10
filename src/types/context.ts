/**
 * 代码生成上下文相关类型定义
 */

export interface GenerationContext {
  /** 上下文ID */
  id: string;
  /** 上下文名称 */
  name: string;
  /** 上下文描述 */
  description?: string;
  /** 上下文类型 */
  type: 'openapi' | 'mcp' | 'sdk' | 'api-request' | 'custom';
  /** 上下文配置 */
  config: Record<string, unknown>;
  /** 上下文状态 */
  state: GenerationState;
  /** 上下文数据 */
  data: Record<string, unknown>;
  /** 上下文元数据 */
  metadata: ContextMetadata;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
  /** 过期时间 */
  expiresAt?: Date;
}

export interface GenerationState {
  /** 当前状态 */
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  /** 进度百分比 */
  progress: number;
  /** 当前步骤 */
  currentStep: string;
  /** 总步骤数 */
  totalSteps: number;
  /** 状态消息 */
  message?: string;
  /** 错误信息 */
  error?: string;
  /** 警告信息 */
  warnings?: string[];
  /** 开始时间 */
  startedAt?: Date;
  /** 完成时间 */
  completedAt?: Date;
  /** 耗时(毫秒) */
  duration?: number;
}

export interface ContextMetadata {
  /** 源文件路径 */
  sourcePath?: string;
  /** 源文件类型 */
  sourceType?:
    | 'openapi'
    | 'swagger'
    | 'postman'
    | 'curl'
    | 'insomnia'
    | 'custom';
  /** 源文件版本 */
  sourceVersion?: string;
  /** 目标语言 */
  targetLanguage?: string;
  /** 目标框架 */
  targetFramework?: string;
  /** 生成器版本 */
  generatorVersion: string;
  /** 生成器配置 */
  generatorConfig: Record<string, unknown>;
  /** 环境信息 */
  environment: {
    /** 节点版本 */
    nodeVersion: string;
    /** 操作系统 */
    os: string;
    /** 架构 */
    arch: string;
    /** 时区 */
    timezone: string;
    /** 语言环境 */
    locale: string;
  };
  /** 性能指标 */
  performance?: {
    /** 内存使用(MB) */
    memoryUsage: number;
    /** CPU使用率(%) */
    cpuUsage: number;
    /** 磁盘使用(MB) */
    diskUsage: number;
    /** 网络延迟(ms) */
    networkLatency?: number;
  };
  /** 安全信息 */
  security?: {
    /** 是否加密 */
    encrypted: boolean;
    /** 加密算法 */
    encryptionAlgorithm?: string;
    /** 哈希算法 */
    hashAlgorithm?: string;
    /** 签名算法 */
    signatureAlgorithm?: string;
  };
  /** 审计信息 */
  audit?: {
    /** 创建用户 */
    createdBy: string;
    /** 更新用户 */
    updatedBy?: string;
    /** IP地址 */
    ipAddress?: string;
    /** 用户代理 */
    userAgent?: string;
    /** 会话ID */
    sessionId?: string;
  };
}

export interface ContextStore {
  /** 存储上下文 */
  store(context: GenerationContext): Promise<void>;
  /** 获取上下文 */
  retrieve(id: string): Promise<GenerationContext | null>;
  /** 更新上下文 */
  update(id: string, updates: Partial<GenerationContext>): Promise<void>;
  /** 删除上下文 */
  delete(id: string): Promise<void>;
  /** 查询上下文 */
  query(filter: ContextFilter): Promise<GenerationContext[]>;
  /** 清空上下文 */
  clear(): Promise<void>;
  /** 获取统计信息 */
  stats(): Promise<ContextStats>;
}

export interface ContextFilter {
  /** 上下文类型 */
  type?: string;
  /** 上下文状态 */
  status?: string;
  /** 创建时间范围 */
  createdAt?: {
    /** 开始时间 */
    start?: Date;
    /** 结束时间 */
    end?: Date;
  };
  /** 更新时间范围 */
  updatedAt?: {
    /** 开始时间 */
    start?: Date;
    /** 结束时间 */
    end?: Date;
  };
  /** 上下文名称 */
  name?: string;
  /** 上下文描述 */
  description?: string;
  /** 分页参数 */
  pagination?: {
    /** 页码 */
    page: number;
    /** 每页数量 */
    limit: number;
  };
  /** 排序参数 */
  sort?: {
    /** 排序字段 */
    field: string;
    /** 排序方向 */
    direction: 'asc' | 'desc';
  };
}

export interface ContextStats {
  /** 上下文总数 */
  total: number;
  /** 按类型统计 */
  byType: Record<string, number>;
  /** 按状态统计 */
  byStatus: Record<string, number>;
  /** 按语言统计 */
  byLanguage: Record<string, number>;
  /** 按框架统计 */
  byFramework: Record<string, number>;
  /** 按日期统计 */
  byDate: Record<string, number>;
  /** 平均生成时间(ms) */
  averageDuration: number;
  /** 最大生成时间(ms) */
  maxDuration: number;
  /** 最小生成时间(ms) */
  minDuration: number;
  /** 成功率(%) */
  successRate: number;
  /** 失败率(%) */
  failureRate: number;
}

export interface ContextManager {
  /** 创建上下文 */
  createContext(options: CreateContextOptions): Promise<GenerationContext>;
  /** 获取上下文 */
  getContext(id: string): Promise<GenerationContext | null>;
  /** 更新上下文 */
  updateContext(id: string, updates: Partial<GenerationContext>): Promise<void>;
  /** 删除上下文 */
  deleteContext(id: string): Promise<void>;
  /** 查询上下文 */
  queryContexts(filter: ContextFilter): Promise<GenerationContext[]>;
  /** 清空上下文 */
  clearContexts(): Promise<void>;
  /** 导出上下文 */
  exportContexts(filter: ContextFilter): Promise<string>;
  /** 导入上下文 */
  importContexts(data: string): Promise<void>;
  /** 备份上下文 */
  backupContexts(): Promise<void>;
  /** 恢复上下文 */
  restoreContexts(): Promise<void>;
  /** 获取统计信息 */
  getStats(): Promise<ContextStats>;
}

export interface CreateContextOptions {
  /** 上下文名称 */
  name: string;
  /** 上下文描述 */
  description?: string;
  /** 上下文类型 */
  type: string;
  /** 上下文配置 */
  config: Record<string, unknown>;
  /** 上下文数据 */
  data?: Record<string, unknown>;
  /** 上下文元数据 */
  metadata?: Partial<ContextMetadata>;
  /** 过期时间 */
  expiresAt?: Date;
}

export interface ContextValidationResult {
  /** 是否有效 */
  valid: boolean;
  /** 验证错误 */
  errors: string[];
  /** 验证警告 */
  warnings: string[];
  /** 验证建议 */
  suggestions: string[];
}

export interface ContextTransformer {
  /** 转换上下文 */
  transform(
    context: GenerationContext,
    transformer: ContextTransformerFunction
  ): Promise<GenerationContext>;
  /** 批量转换上下文 */
  transformBatch(
    contexts: GenerationContext[],
    transformer: ContextTransformerFunction
  ): Promise<GenerationContext[]>;
  /** 映射上下文 */
  map(
    context: GenerationContext,
    mapper: ContextMapperFunction
  ): Promise<unknown>;
  /** 批量映射上下文 */
  mapBatch(
    contexts: GenerationContext[],
    mapper: ContextMapperFunction
  ): Promise<unknown[]>;
  /** 过滤上下文 */
  filter(
    contexts: GenerationContext[],
    filter: ContextFilterFunction
  ): Promise<GenerationContext[]>;
  /** 排序上下文 */
  sort(
    contexts: GenerationContext[],
    sorter: ContextSorterFunction
  ): Promise<GenerationContext[]>;
  /** 分组上下文 */
  group(
    contexts: GenerationContext[],
    grouper: ContextGrouperFunction
  ): Promise<Record<string, GenerationContext[]>>;
  /** 聚合上下文 */
  aggregate(
    contexts: GenerationContext[],
    aggregator: ContextAggregatorFunction
  ): Promise<unknown>;
}

export type ContextTransformerFunction = (
  context: GenerationContext
) => Promise<GenerationContext>;
export type ContextMapperFunction = (
  context: GenerationContext
) => Promise<unknown>;
export type ContextFilterFunction = (
  context: GenerationContext
) => Promise<boolean>;
export type ContextSorterFunction = (
  a: GenerationContext,
  b: GenerationContext
) => Promise<number>;
export type ContextGrouperFunction = (
  context: GenerationContext
) => Promise<string>;
export type ContextAggregatorFunction = (
  contexts: GenerationContext[]
) => Promise<unknown>;
