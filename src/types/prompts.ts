/**
 * 提示词管理相关类型定义
 */

export interface Prompt {
  /** 提示词ID */
  id: string;
  /** 提示词名称 */
  name: string;
  /** 提示词描述 */
  description?: string;
  /** 提示词类型 */
  type: 'system' | 'user' | 'assistant' | 'function' | 'tool';
  /** 提示词内容 */
  content: string;
  /** 提示词变量 */
  variables: PromptVariable[];
  /** 提示词标签 */
  tags?: string[];
  /** 提示词分类 */
  category?: string;
  /** 提示词版本 */
  version: string;
  /** 提示词作者 */
  author?: string;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
  /** 是否启用 */
  enabled: boolean;
  /** 提示权重 */
  weight?: number;
  /** 提示词配置 */
  config?: PromptConfig;
}

export interface PromptVariable {
  /** 变量名称 */
  name: string;
  /** 变量类型 */
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'any';
  /** 变量描述 */
  description?: string;
  /** 是否必需 */
  required: boolean;
  /** 默认值 */
  defaultValue?: unknown;
  /** 变量约束 */
  constraints?: VariableConstraint[];
  /** 变量示例 */
  examples?: unknown[];
}

export interface VariableConstraint {
  /** 约束类型 */
  type:
    | 'min'
    | 'max'
    | 'minLength'
    | 'maxLength'
    | 'pattern'
    | 'enum'
    | 'custom';
  /** 约束值 */
  value: unknown;
  /** 约束消息 */
  message?: string;
}

export interface PromptConfig {
  /** 温度参数 */
  temperature?: number;
  /** 最大令牌数 */
  maxTokens?: number;
  /** 顶部P参数 */
  topP?: number;
  /** 频率惩罚 */
  frequencyPenalty?: number;
  /** 存在惩罚 */
  presencePenalty?: number;
  /** 停止序列 */
  stopSequences?: string[];
  /** 是否流式输出 */
  stream?: boolean;
  /** 响应格式 */
  responseFormat?: 'text' | 'json' | 'xml' | 'markdown' | 'html';
  /** 模型名称 */
  model?: string;
  /** 模型提供商 */
  provider?:
    | 'openai'
    | 'anthropic'
    | 'cohere'
    | 'huggingface'
    | 'azure'
    | 'aws'
    | 'google'
    | 'custom';
  /** 模型版本 */
  modelVersion?: string;
  /** 模型配置 */
  modelConfig?: Record<string, unknown>;
}

export interface PromptTemplate {
  /** 模板名称 */
  name: string;
  /** 模板描述 */
  description?: string;
  /** 模板内容 */
  template: string;
  /** 模板变量 */
  variables: PromptVariable[];
  /** 模板示例 */
  examples: PromptExample[];
  /** 模板标签 */
  tags?: string[];
  /** 模板分类 */
  category?: string;
  /** 模板版本 */
  version: string;
  /** 模板作者 */
  author?: string;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
  /** 是否启用 */
  enabled: boolean;
}

export interface PromptExample {
  /** 示例名称 */
  name: string;
  /** 示例描述 */
  description?: string;
  /** 输入变量 */
  input: Record<string, unknown>;
  /** 输出内容 */
  output: string;
  /** 示例权重 */
  weight?: number;
}

export interface PromptManagerConfig {
  /** 存储类型 */
  storageType: 'memory' | 'file' | 'database' | 'api';
  /** 存储配置 */
  storageConfig: Record<string, unknown>;
  /** 缓存配置 */
  cacheConfig?: {
    /** 缓存类型 */
    type: 'memory' | 'redis' | 'memcached';
    /** 缓存时间(秒) */
    ttl: number;
    /** 缓存键前缀 */
    keyPrefix?: string;
  };
  /** 预加载提示词 */
  preloadPrompts?: string[];
  /** 自动重载间隔(秒) */
  autoReloadInterval?: number;
  /** 默认提示词配置 */
  defaultPromptConfig?: PromptConfig;
  /** 日志配置 */
  logging?: {
    /** 是否启用日志 */
    enabled: boolean;
    /** 日志级别 */
    level: 'debug' | 'info' | 'warn' | 'error';
    /** 日志格式 */
    format?: string;
  };
}

export interface PromptSearchOptions {
  /** 搜索关键词 */
  keyword?: string;
  /** 标签过滤 */
  tags?: string[];
  /** 分类过滤 */
  categories?: string[];
  /** 类型过滤 */
  types?: string[];
  /** 是否启用 */
  enabled?: boolean;
  /** 作者过滤 */
  authors?: string[];
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

export interface PromptGenerationResult {
  /** 生成的提示词 */
  prompt: string;
  /** 使用的变量 */
  variables: Record<string, unknown>;
  /** 生成耗时(毫秒) */
  duration: number;
  /** 生成错误 */
  errors?: string[];
  /** 生成警告 */
  warnings?: string[];
  /** 生成统计 */
  stats?: {
    /** 提示词长度 */
    promptLength: number;
    /** 变量数量 */
    variableCount: number;
    /** 模板使用次数 */
    templateUsage: number;
  };
}

export interface PromptEvaluationResult {
  /** 评估分数 */
  score: number;
  /** 评估维度 */
  dimensions: Record<string, number>;
  /** 评估反馈 */
  feedback: string[];
  /** 评估建议 */
  suggestions: string[];
  /** 评估耗时(毫秒) */
  duration: number;
  /** 评估错误 */
  errors?: string[];
}

export interface PromptOptimizationResult {
  /** 优化后的提示词 */
  optimizedPrompt: string;
  /** 优化变化 */
  changes: PromptChange[];
  /** 优化分数 */
  optimizationScore: number;
  /** 优化耗时(毫秒) */
  duration: number;
  /** 优化错误 */
  errors?: string[];
}

export interface PromptChange {
  /** 变化类型 */
  type: 'add' | 'remove' | 'modify' | 'reorder' | 'format';
  /** 变化描述 */
  description: string;
  /** 变化位置 */
  position?: {
    /** 开始行 */
    startLine: number;
    /** 结束行 */
    endLine: number;
    /** 开始列 */
    startColumn: number;
    /** 结束列 */
    endColumn: number;
  };
  /** 变化内容 */
  content?: string;
  /** 变化原因 */
  reason?: string;
}

export interface PromptManager {
  /** 添加提示词 */
  addPrompt(prompt: Prompt): Promise<void>;
  /** 获取提示词 */
  getPrompt(id: string): Promise<Prompt | null>;
  /** 更新提示词 */
  updatePrompt(id: string, updates: Partial<Prompt>): Promise<void>;
  /** 删除提示词 */
  deletePrompt(id: string): Promise<void>;
  /** 搜索提示词 */
  searchPrompts(options: PromptSearchOptions): Promise<Prompt[]>;
  /** 生成提示词 */
  generatePrompt(
    templateId: string,
    variables: Record<string, unknown>
  ): Promise<PromptGenerationResult>;
  /** 评估提示词 */
  evaluatePrompt(prompt: string): Promise<PromptEvaluationResult>;
  /** 优化提示词 */
  optimizePrompt(prompt: string): Promise<PromptOptimizationResult>;
  /** 导入提示词 */
  importPrompts(data: string): Promise<void>;
  /** 导出提示词 */
  exportPrompts(filter: PromptSearchOptions): Promise<string>;
  /** 获取统计信息 */
  getStats(): Promise<PromptStats>;
}

export interface PromptStats {
  /** 提示词总数 */
  total: number;
  /** 按类型统计 */
  byType: Record<string, number>;
  /** 按分类统计 */
  byCategory: Record<string, number>;
  /** 按标签统计 */
  byTag: Record<string, number>;
  /** 按作者统计 */
  byAuthor: Record<string, number>;
  /** 按状态统计 */
  byStatus: Record<string, number>;
  /** 平均生成时间(ms) */
  averageGenerationTime: number;
  /** 平均评估分数 */
  averageEvaluationScore: number;
  /** 平均优化分数 */
  averageOptimizationScore: number;
}
