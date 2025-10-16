/**
 * OpenAI Completions API 数据模型定义
 * 参考: https://platform.openai.com/docs/api-reference/completions
 */

/**
 * Completions 请求参数
 */
export interface CompletionsRequest {
  /**
   * 要使用的模型的ID
   */
  model: string;

  /**
   * 提示文本
   */
  prompt: string | string[];

  /**
   * 生成的最大token数
   */
  max_tokens?: number;

  /**
   * 温度参数，控制随机性 (0-2)
   */
  temperature?: number;

  /**
   * 核心采样参数，控制多样性 (0-1)
   */
  top_p?: number;

  /**
   * 要生成的完成数量
   */
  n?: number;

  /**
   * 是否流式输出
   */
  stream?: boolean;

  /**
   * 停止序列
   */
  stop?: string | string[];

  /**
   * 存在惩罚参数 (-2.0 到 2.0)
   */
  presence_penalty?: number;

  /**
   * 频率惩罚参数 (-2.0 到 2.0)
   */
  frequency_penalty?: number;

  /**
   * 对数概率返回数量
   */
  logprobs?: number;

  /**
   * 是否回显提示
   */
  echo?: boolean;

  /**
   * 最佳完成数量
   */
  best_of?: number;

  /**
   * 用户标识符
   */
  user?: string;

  /**
   * 随机种子
   */
  seed?: number;

  /**
   * 响应格式
   */
  response_format?: {
    type: 'text' | 'json_object';
  };

  /**
   * 工具调用配置
   */
  tool_choice?: 'none' | 'auto' | {
    type: 'function';
    function: {
      name: string;
    };
  };

  /**
   * 工具定义
   */
  tools?: Array<{
    type: 'function';
    function: {
      name: string;
      description?: string;
      parameters: object;
    };
  }>;
}

/**
 * Completions 响应中的选择项
 */
export interface CompletionsChoice {
  /**
   * 生成的文本
   */
  text: string;

  /**
   * 选择项的索引
   */
  index: number;

  /**
   * 对数概率
   */
  logprobs?: {
    tokens: string[];
    token_logprobs: number[];
    top_logprobs: Array<Record<string, number>>;
    text_offset: number[];
  };

  /**
   * 完成原因
   */
  finish_reason: 'stop' | 'length' | 'content_filter' | 'tool_calls';

  /**
   * 工具调用信息
   */
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: {
      name: string;
      arguments: string;
    };
  }>;
}

/**
 * Completions 使用情况统计
 */
export interface CompletionsUsage {
  /**
   * 提示token数量
   */
  prompt_tokens: number;

  /**
   * 完成token数量
   */
  completion_tokens: number;

  /**
   * 总token数量
   */
  total_tokens: number;
}

/**
 * Completions 完整响应
 */
export interface CompletionsResponse {
  /**
   * 响应ID
   */
  id: string;

  /**
   * 对象类型
   */
  object: 'text_completion';

  /**
   * 创建时间戳
   */
  created: number;

  /**
   * 使用的模型
   */
  model: string;

  /**
   * 选择项列表
   */
  choices: CompletionsChoice[];

  /**
   * 使用情况统计
   */
  usage: CompletionsUsage;

  /**
   * 系统指纹
   */
  system_fingerprint?: string;
}

/**
 * 流式Completions响应块
 */
export interface CompletionsStreamChunk {
  /**
   * 响应ID
   */
  id: string;

  /**
   * 对象类型
   */
  object: 'text_completion';

  /**
   * 创建时间戳
   */
  created: number;

  /**
   * 使用的模型
   */
  model: string;

  /**
   * 选择项列表
   */
  choices: Array<{
    text: string;
    index: number;
    logprobs?: any;
    finish_reason: string | null;
  }>;

  /**
   * 系统指纹
   */
  system_fingerprint?: string;
}

/**
 * Completions 错误响应
 */
export interface CompletionsErrorResponse {
  error: {
    /**
     * 错误消息
     */
    message: string;

    /**
     * 错误类型
     */
    type: string;

    /**
     * 错误参数
     */
    param: string | null;

    /**
     * 错误代码
     */
    code: string | null;
  };
}

/**
 * Completions API 配置选项
 */
export interface CompletionsOptions {
  /**
   * API密钥
   */
  apiKey: string;

  /**
   * 基础URL
   */
  baseURL?: string;

  /**
   * 请求超时时间（毫秒）
   */
  timeout?: number;

  /**
   * 最大重试次数
   */
  maxRetries?: number;

  /**
   * 组织ID
   */
  organization?: string;

  /**
   * 项目ID
   */
  project?: string;
}

/**
 * Completions 生成结果
 */
export interface CompletionsResult {
  /**
   * 生成的文本
   */
  text: string;

  /**
   * 完成原因
   */
  finishReason: string;

  /**
   * 使用情况统计
   */
  usage: CompletionsUsage;

  /**
   * 模型名称
   */
  model: string;

  /**
   * 响应ID
   */
  id: string;

  /**
   * 创建时间戳
   */
  created: number;
}

/**
 * Completions 批量请求
 */
export interface CompletionsBatchRequest {
  /**
   * 批量请求列表
   */
  requests: Array<{
    /**
     * 请求ID
     */
    id: string;

    /**
     * Completions请求参数
     */
    request: CompletionsRequest;
  }>;

  /**
   * 批量处理选项
   */
  options?: {
    /**
     * 最大并发数
     */
    maxConcurrency?: number;

    /**
     * 批量大小
     */
    batchSize?: number;
  };
}

/**
 * Completions 批量响应
 */
export interface CompletionsBatchResponse {
  /**
   * 批量响应列表
   */
  responses: Array<{
    /**
     * 请求ID
     */
    id: string;

    /**
     * Completions响应
     */
    response: CompletionsResponse | CompletionsErrorResponse;

    /**
     * 响应状态
     */
    status: 'success' | 'error';
  }>;

  /**
   * 批量处理统计
   */
  statistics: {
    /**
     * 总请求数
     */
    total: number;

    /**
     * 成功数
     */
    success: number;

    /**
     * 失败数
     */
    failed: number;

    /**
     * 处理时间（毫秒）
     */
    processingTime: number;
  };
}

/**
 * Completions 工具调用结果
 */
export interface CompletionsToolCallResult {
  /**
   * 工具调用ID
   */
  id: string;

  /**
   * 函数名称
   */
  functionName: string;

  /**
   * 函数参数
   */
  arguments: object;

  /**
   * 函数调用结果
   */
  result?: any;

  /**
   * 调用状态
   */
  status: 'success' | 'error';

  /**
   * 错误信息（如果有）
   */
  error?: string;
}

/**
 * Completions 增强响应（包含工具调用）
 */
export interface CompletionsEnhancedResponse extends CompletionsResponse {
  /**
   * 工具调用结果
   */
  tool_calls?: CompletionsToolCallResult[];
}

/**
 * Completions 生成配置
 */
export interface CompletionsGenerationConfig {
  /**
   * 模型配置
   */
  model: {
    /**
     * 模型名称
     */
    name: string;

    /**
     * 模型版本
     */
    version?: string;

    /**
     * 模型提供商
     */
    provider: 'openai' | 'anthropic' | 'cohere' | 'local';
  };

  /**
   * 生成参数
   */
  parameters: {
    /**
     * 温度
     */
    temperature: number;

    /**
     * 最大token数
     */
    maxTokens: number;

    /**
     * 核心采样
     */
    topP: number;

    /**
     * 停止序列
     */
    stopSequences: string[];

    /**
     * 存在惩罚
     */
    presencePenalty: number;

    /**
     * 频率惩罚
     */
    frequencyPenalty: number;
  };

  /**
   * 安全配置
   */
  safety: {
    /**
     * 内容过滤级别
     */
    contentFilter: 'low' | 'medium' | 'high';

    /**
     * 是否允许敏感内容
     */
    allowSensitiveContent: boolean;
  };
}

/**
 * Completions 评估指标
 */
export interface CompletionsMetrics {
  /**
   * 延迟指标
   */
  latency: {
    /**
     * 总延迟（毫秒）
     */
    total: number;

    /**
     * 处理延迟（毫秒）
     */
    processing: number;

    /**
     * 网络延迟（毫秒）
     */
    network: number;
  };

  /**
   * 质量指标
   */
  quality: {
    /**
     * 相关性评分 (0-1)
     */
    relevance: number;

    /**
     * 连贯性评分 (0-1)
     */
    coherence: number;

    /**
     * 流畅性评分 (0-1)
     */
    fluency: number;
  };

  /**
   * 成本指标
   */
  cost: {
    /**
     * 总成本
     */
    total: number;

    /**
     * 输入token成本
     */
    inputTokens: number;

    /**
     * 输出token成本
     */
    outputTokens: number;
  };
}

