/**
 * Chat Completions API 类型定义
 * 参考 OpenAI Chat Completions API 最新规范
 * https://platform.openai.com/docs/api-reference/chat
 */

/**
 * Chat Completions 请求消息
 */
export interface ChatCompletionMessage {
  /** 消息角色 */
  role: 'system' | 'user' | 'assistant' | 'function' | 'tool';
  /** 消息内容 */
  content: string | null;
  /** 函数名称（仅当role为function时使用） */
  name?: string;
  /** 函数调用（仅当role为assistant时使用） */
  function_call?: ChatCompletionFunctionCall;
  /** 工具调用（仅当role为assistant时使用） */
  tool_calls?: ChatCompletionToolCall[];
  /** 工具调用ID（仅当role为tool时使用） */
  tool_call_id?: string;
}

/**
 * Chat Completions 函数调用
 */
export interface ChatCompletionFunctionCall {
  /** 函数名称 */
  name: string;
  /** 函数参数（JSON字符串） */
  arguments: string;
}

/**
 * Chat Completions 工具调用
 */
export interface ChatCompletionToolCall {
  /** 工具调用ID */
  id: string;
  /** 工具类型 */
  type: 'function';
  /** 函数调用信息 */
  function: ChatCompletionFunctionCall;
}

/**
 * Chat Completions 请求参数
 */
export interface ChatCompletionRequest {
  /** 模型名称 */
  model: string;
  /** 消息列表 */
  messages: ChatCompletionMessage[];
  /** 函数定义列表 */
  functions?: ChatCompletionFunction[];
  /** 函数调用控制 */
  function_call?: 'none' | 'auto' | { name: string };
  /** 工具定义列表 */
  tools?: ChatCompletionTool[];
  /** 工具调用控制 */
  tool_choice?:
    | 'none'
    | 'auto'
    | { type: 'function'; function: { name: string } };
  /** 最大令牌数 */
  max_tokens?: number;
  /** 温度参数 */
  temperature?: number;
  /** 顶部P参数 */
  top_p?: number;
  /** 频率惩罚 */
  frequency_penalty?: number;
  /** 存在惩罚 */
  presence_penalty?: number;
  /** 停止标记 */
  stop?: string | string[];
  /** 流式输出 */
  stream?: boolean;
  /** 流式选项 */
  stream_options?: {
    /** 是否包含使用情况 */
    include_usage?: boolean;
  };
  /** 随机种子 */
  seed?: number;
  /** 响应格式 */
  response_format?: { type: 'text' | 'json_object' };
  /** 用户标识 */
  user?: string;
  /** 日志概率 */
  logprobs?: boolean;
  /** 顶部日志概率 */
  top_logprobs?: number;
  /** 并行工具调用 */
  parallel_tool_calls?: boolean;
  /** 存储控制 */
  store?: boolean;
  /** 推理增强 */
  reasoning_enhancement?: {
    /** 推理类型 */
    type: 'planning' | 'reflection' | 'step_by_step';
    /** 增强级别 */
    level: 'low' | 'medium' | 'high';
  };
}

/**
 * Chat Completions 函数定义
 */
export interface ChatCompletionFunction {
  /** 函数名称 */
  name: string;
  /** 函数描述 */
  description?: string;
  /** 函数参数模式 */
  parameters: Record<string, unknown>;
}

/**
 * Chat Completions 工具定义
 */
export interface ChatCompletionTool {
  /** 工具类型 */
  type: 'function';
  /** 函数定义 */
  function: ChatCompletionFunction;
}

/**
 * Chat Completions 响应
 */
export interface ChatCompletionResponse {
  /** 响应ID */
  id: string;
  /** 对象类型 */
  object: 'chat.completion';
  /** 创建时间戳 */
  created: number;
  /** 模型名称 */
  model: string;
  /** 使用情况统计 */
  usage?: ChatCompletionUsage;
  /** 选择列表 */
  choices: ChatCompletionChoice[];
  /** 实验性功能 */
  experimental?: {
    /** 推理轨迹 */
    reasoning_trace?: any;
    /** 思维过程 */
    thought_process?: any;
  };
  /** 系统指纹 */
  system_fingerprint?: string;
  /** 推理轨迹 */
  reasoning_trace?: any;
  /** 服务层 */
  service_tier?: 'auto' | 'default';
  /** 推理令牌预算 */
  reasoning_token_budget?: number;
}

/**
 * Chat Completions 使用情况统计
 */
export interface ChatCompletionUsage {
  /** 提示令牌数 */
  prompt_tokens: number;
  /** 完成令牌数 */
  completion_tokens: number;
  /** 总令牌数 */
  total_tokens: number;
  /** 提示令牌详情 */
  prompt_tokens_details?: TokenDetails;
  /** 完成令牌详情 */
  completion_tokens_details?: TokenDetails;
}

/**
 * 令牌详情
 */
export interface TokenDetails {
  /** 缓存令牌数 */
  cached_tokens: number;
}

/**
 * Chat Completions 选择项
 */
export interface ChatCompletionChoice {
  /** 索引 */
  index: number;
  /** 消息 */
  message: ChatCompletionMessage;
  /** 完成原因 */
  finish_reason:
    | 'stop'
    | 'length'
    | 'function_call'
    | 'tool_calls'
    | 'content_filter'
    | 'thinking'
    | null;
  /** 日志概率 */
  logprobs?: ChatCompletionLogprobs;
}

/**
 * Chat Completions 日志概率
 */
export interface ChatCompletionLogprobs {
  /** 内容 */
  content: ChatCompletionLogprobContent[] | null;
  /** 拒绝原因 */
  refusal: ChatCompletionLogprobContent[] | null;
}

/**
 * Chat Completions 日志概率内容
 */
export interface ChatCompletionLogprobContent {
  /** 令牌 */
  token: string;
  /** 对数概率 */
  logprob: number;
  /** 字节 */
  bytes: number[] | null;
  /** 顶部日志概率 */
  top_logprobs: ChatCompletionTopLogprob[];
}

/**
 * Chat Completions 顶部日志概率
 */
export interface ChatCompletionTopLogprob {
  /** 令牌 */
  token: string;
  /** 对数概率 */
  logprob: number;
  /** 字节 */
  bytes: number[] | null;
}

/**
 * Chat Completions 流式响应
 */
export interface ChatCompletionStreamResponse {
  /** 响应ID */
  id: string;
  /** 对象类型 */
  object: 'chat.completion.chunk';
  /** 创建时间戳 */
  created: number;
  /** 模型名称 */
  model: string;
  /** 系统指纹 */
  system_fingerprint?: string;
  /** 选择列表 */
  choices: ChatCompletionStreamChoice[];
}

/**
 * Chat Completions 流式选择项
 */
export interface ChatCompletionStreamChoice {
  /** 索引 */
  index: number;
  /** 增量消息 */
  delta: ChatCompletionDeltaMessage;
  /** 完成原因 */
  finish_reason:
    | 'stop'
    | 'length'
    | 'function_call'
    | 'tool_calls'
    | 'content_filter'
    | null;
  /** 日志概率 */
  logprobs?: ChatCompletionLogprobs;
}

/**
 * Chat Completions 增量消息
 */
export interface ChatCompletionDeltaMessage {
  /** 消息角色 */
  role?: 'system' | 'user' | 'assistant' | 'function' | 'tool';
  /** 消息内容 */
  content?: string | null;
  /** 函数调用 */
  function_call?: ChatCompletionFunctionCall;
  /** 工具调用 */
  tool_calls?: ChatCompletionToolCall[];
}

/**
 * Chat Completions 错误响应
 */
export interface ChatCompletionError {
  /** 错误信息 */
  error: {
    /** 错误消息 */
    message: string;
    /** 错误类型 */
    type: string;
    /** 参数 */
    param: string | null;
    /** 代码 */
    code: string | null;
  };
}

/**
 * Chat Completions 创建选项
 */
export interface ChatCompletionCreateOptions {
  /** API密钥 */
  apiKey?: string;
  /** 基础URL */
  baseURL?: string;
  /** 组织ID */
  organization?: string;
  /** 项目ID */
  project?: string;
  /** 请求头 */
  headers?: Record<string, string>;
  /** 超时时间 */
  timeout?: number;
  /** 最大重试次数 */
  maxRetries?: number;
  /** 重试延迟 */
  retryDelay?: number;
}

/**
 * Chat Completions 提供者配置
 */
export interface ChatCompletionProviderConfig {
  /** 提供者名称 */
  provider:
    | 'openai'
    | 'anthropic'
    | 'cohere'
    | 'huggingface'
    | 'azure'
    | 'aws'
    | 'google'
    | 'custom';
  /** 模型名称 */
  model: string;
  /** API密钥 */
  apiKey?: string;
  /** 基础URL */
  baseURL?: string;
  /** 其他配置 */
  config?: Record<string, unknown>;
}

/**
 * Chat Completions 会话状态
 */
export interface ChatCompletionSession {
  /** 会话ID */
  sessionId: string;
  /** 消息历史 */
  messages: ChatCompletionMessage[];
  /** 创建时间 */
  createdAt: number;
  /** 更新时间 */
  updatedAt: number;
  /** 元数据 */
  metadata?: Record<string, unknown>;
}

/**
 * Chat Completions 批量请求
 */
export interface ChatCompletionBatchRequest {
  /** 自定义ID */
  custom_id: string;
  /** 请求方法 */
  method: 'POST';
  /** 请求URL */
  url: '/v1/chat/completions';
  /** 请求体 */
  body: ChatCompletionRequest;
}

/**
 * Chat Completions 批量响应
 */
export interface ChatCompletionBatchResponse {
  /** 请求ID */
  request_id: string;
  /** 自定义ID */
  custom_id: string;
  /** 响应 */
  response: {
    /** 状态码 */
    status_code: number;
    /** 请求ID */
    request_id?: string;
    /** 响应体 */
    body: ChatCompletionResponse | ChatCompletionError;
  };
}
