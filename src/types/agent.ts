/**
 * Agent API 类型定义
 * 参考 OpenAI SDK 标准，支持 agent.chat.completions.create(request) 接口
 */

import {
  ChatCompletionRequest,
  ChatCompletionResponse,
  ChatCompletionStreamResponse,
  ChatCompletionCreateOptions,
  ChatCompletionProviderConfig
} from './chat-completions';

/**
 * Agent 配置选项
 */
export interface AgentConfig {
  /** 提供者配置 */
  provider: ChatCompletionProviderConfig;
  /** 默认请求选项 */
  defaultOptions?: ChatCompletionCreateOptions;
  /** 代理设置 */
  proxy?: {
    /** 代理URL */
    url: string;
    /** 代理认证 */
    auth?: {
      username: string;
      password: string;
    };
  };
  /** 重试配置 */
  retry?: {
    /** 最大重试次数 */
    maxRetries: number;
    /** 重试延迟（毫秒） */
    retryDelay: number;
    /** 重试条件 */
    retryCondition?: (error: any) => boolean;
  };
  /** 超时配置 */
  timeout?: number;
  /** 日志配置 */
  logging?: {
    /** 日志级别 */
    level: 'debug' | 'info' | 'warn' | 'error';
    /** 日志格式 */
    format?: 'json' | 'text';
  };
}

/**
 * Agent 对话状态
 */
export interface AgentConversation {
  /** 对话ID */
  conversationId: string;
  /** 对话配置 */
  config: AgentConfig;
  /** 消息历史 */
  messages: Array<{
    /** 消息内容 */
    content: string;
    /** 消息角色 */
    role: 'user' | 'assistant' | 'system';
    /** 时间戳 */
    timestamp: number;
  }>;
  /** 对话元数据 */
  metadata?: Record<string, unknown>;
  /** 创建时间 */
  createdAt: number;
  /** 更新时间 */
  updatedAt: number;
}

/**
 * Agent 聊天完成接口
 */
export interface AgentChatCompletions {
  /**
   * 创建聊天完成
   * @param request 聊天完成请求
   * @param options 创建选项
   * @returns 聊天完成响应
   */
  create(
    request: ChatCompletionRequest,
    options?: ChatCompletionCreateOptions
  ): Promise<ChatCompletionResponse>;

  /**
   * 创建流式聊天完成
   * @param request 聊天完成请求
   * @param options 创建选项
   * @returns 流式响应
   */
  createStream(
    request: ChatCompletionRequest,
    options?: ChatCompletionCreateOptions
  ): AsyncIterable<ChatCompletionStreamResponse>;

  /**
   * 批量创建聊天完成
   * @param requests 聊天完成请求列表
   * @param options 创建选项
   * @returns 批量响应
   */
  createBatch(
    requests: ChatCompletionRequest[],
    options?: ChatCompletionCreateOptions
  ): Promise<ChatCompletionResponse[]>;
}

/**
 * Agent 核心接口
 */
export interface Agent {
  /** 聊天完成接口 */
  chat: {
    /** 聊天完成 */
    completions: AgentChatCompletions;
  };

  /** 配置信息 */
  config: AgentConfig;

  /** 对话管理 */
  conversations: {
    /**
     * 创建新对话
     * @param config 对话配置
     * @returns 对话ID
     */
    create(config?: Partial<AgentConfig>): Promise<string>;

    /**
     * 获取对话
     * @param conversationId 对话ID
     * @returns 对话信息
     */
    get(conversationId: string): Promise<AgentConversation>;

    /**
     * 更新对话
     * @param conversationId 对话ID
     * @param updates 更新内容
     * @returns 更新后的对话
     */
    update(conversationId: string, updates: Partial<AgentConversation>): Promise<AgentConversation>;

    /**
     * 删除对话
     * @param conversationId 对话ID
     */
    delete(conversationId: string): Promise<void>;

    /**
     * 列出所有对话
     * @returns 对话列表
     */
    list(): Promise<AgentConversation[]>;
  };

  /** 工具管理 */
  tools: {
    /**
     * 注册工具
     * @param name 工具名称
     * @param tool 工具定义
     */
    register(name: string, tool: AgentTool): void;

    /**
     * 注销工具
     * @param name 工具名称
     */
    unregister(name: string): void;

    /**
     * 获取工具
     * @param name 工具名称
     * @returns 工具定义
     */
    get(name: string): AgentTool | undefined;

    /**
     * 列出所有工具
     * @returns 工具列表
     */
    list(): AgentTool[];
  };

  /** 模型管理 */
  models: {
    /**
     * 列出可用模型
     * @returns 模型列表
     */
    list(): Promise<AgentModel[]>;

    /**
     * 获取模型信息
     * @param modelId 模型ID
     * @returns 模型信息
     */
    retrieve(modelId: string): Promise<AgentModel>;
  };

  /** 统计信息 */
  stats: {
    /**
     * 获取使用统计
     * @returns 统计信息
     */
    getUsage(): Promise<AgentUsageStats>;
  };
}

/**
 * Agent 工具定义
 */
export interface AgentTool {
  /** 工具名称 */
  name: string;
  /** 工具描述 */
  description: string;
  /** 工具参数模式 */
  parameters: Record<string, unknown>;
  /** 工具执行函数 */
  execute: (args: any) => Promise<any>;
  /** 工具验证函数 */
  validate?: (args: any) => boolean;
}

/**
 * Agent 模型信息
 */
export interface AgentModel {
  /** 模型ID */
  id: string;
  /** 模型名称 */
  name: string;
  /** 模型描述 */
  description?: string;
  /** 模型提供者 */
  provider: string;
  /** 模型版本 */
  version?: string;
  /** 模型能力 */
  capabilities: string[];
  /** 模型限制 */
  limitations: string[];
  /** 模型配置 */
  config: Record<string, unknown>;
}

/**
 * Agent 使用统计
 */
export interface AgentUsageStats {
  /** 总请求数 */
  totalRequests: number;
  /** 成功请求数 */
  successfulRequests: number;
  /** 失败请求数 */
  failedRequests: number;
  /** 总令牌数 */
  totalTokens: number;
  /** 提示令牌数 */
  promptTokens: number;
  /** 完成令牌数 */
  completionTokens: number;
  /** 平均响应时间（毫秒） */
  averageResponseTime: number;
  /** 错误统计 */
  errors: Record<string, number>;
  /** 时间段统计 */
  timePeriod: {
    /** 开始时间 */
    start: number;
    /** 结束时间 */
    end: number;
  };
}

/**
 * Agent 创建选项
 */
export interface AgentCreateOptions {
  /** 基础配置 */
  config: AgentConfig;
  /** 初始化工具 */
  tools?: AgentTool[];
  /** 自定义实现 */
  implementations?: {
    /** 聊天完成实现 */
    chatCompletions?: Partial<AgentChatCompletions>;
    /** 对话管理实现 */
    conversations?: Partial<Agent['conversations']>;
    /** 工具管理实现 */
    tools?: Partial<Agent['tools']>;
    /** 模型管理实现 */
    models?: Partial<Agent['models']>;
  };
}

/**
 * Agent 工厂函数
 */
export interface AgentFactory {
  /**
   * 创建Agent实例
   * @param options 创建选项
   * @returns Agent实例
   */
  create(options: AgentCreateOptions): Agent;
}

/**
 * Agent 错误类型
 */
export interface AgentError extends Error {
  /** 错误代码 */
  code: string;
  /** 错误类型 */
  type: 'config' | 'network' | 'api' | 'validation' | 'timeout';
  /** 错误详情 */
  details?: Record<string, unknown>;
  /** 原始错误 */
  originalError?: Error;
}

/**
 * Agent 事件类型
 */
export interface AgentEvents {
  /** 请求开始 */
  'request:start': { request: ChatCompletionRequest };
  /** 请求成功 */
  'request:success': { request: ChatCompletionRequest; response: ChatCompletionResponse; duration: number };
  /** 请求失败 */
  'request:error': { request: ChatCompletionRequest; error: AgentError; duration: number };
  /** 对话创建 */
  'conversation:create': { conversation: AgentConversation };
  /** 对话更新 */
  'conversation:update': { conversation: AgentConversation };
  /** 对话删除 */
  'conversation:delete': { conversationId: string };
  /** 工具注册 */
  'tool:register': { tool: AgentTool };
  /** 工具注销 */
  'tool:unregister': { toolName: string };
}

/**
 * Agent 事件发射器接口
 */
export interface AgentEventEmitter {
  /**
   * 监听事件
   * @param event 事件名称
   * @param listener 事件监听器
   */
  on<T extends keyof AgentEvents>(event: T, listener: (data: AgentEvents[T]) => void): void;

  /**
   * 取消监听事件
   * @param event 事件名称
   * @param listener 事件监听器
   */
  off<T extends keyof AgentEvents>(event: T, listener: (data: AgentEvents[T]) => void): void;

  /**
   * 触发事件
   * @param event 事件名称
   * @param data 事件数据
   */
  emit<T extends keyof AgentEvents>(event: T, data: AgentEvents[T]): void;
}

/**
 * 完整的Agent接口（包含事件发射）
 */
export interface CompleteAgent extends Agent, AgentEventEmitter {
  /** 销毁Agent */
  destroy(): Promise<void>;
}

/**
 * Agent 响应包装器
 */
export interface AgentResponse<T = any> {
  /** 响应数据 */
  data: T;
  /** 响应元数据 */
  metadata: {
    /** 请求ID */
    requestId: string;
    /** 响应时间戳 */
    timestamp: number;
    /** 处理时长（毫秒） */
    duration: number;
    /** 是否成功 */
    success: boolean;
    /** 错误信息（如果有） */
    error?: AgentError;
  };
}

/**
 * Agent 批量响应
 */
export interface AgentBatchResponse<T = any> {
  /** 响应列表 */
  responses: Array<AgentResponse<T>>;
  /** 批量处理统计 */
  statistics: {
    /** 总请求数 */
    total: number;
    /** 成功数 */
    success: number;
    /** 失败数 */
    failed: number;
    /** 处理时长（毫秒） */
    processingTime: number;
  };
}

/**
 * Code Agent 扩展接口（向后兼容）
 * 提供简化的聊天接口，同时保持完整的Agent功能
 */
export interface CodeAgent extends Omit<Agent, 'chat'> {
  /** 简化的聊天方法（向后兼容） */
  chat(message: string): Promise<string>;
  
  /** 完整的聊天完成接口 */
  chatCompletions: AgentChatCompletions;
  
  /** 配置信息 */
  config: AgentConfig;
  
  /** 对话管理 */
  conversations: Agent['conversations'];
  
  /** 工具管理 */
  tools: Agent['tools'];
  
  /** 模型管理 */
  models: Agent['models'];
  
  /** 统计信息 */
  stats: Agent['stats'];
}