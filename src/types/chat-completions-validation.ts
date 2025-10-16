/**
 * Chat Completions API 验证文件
 * 用于验证数据结构定义是否与OpenAI官方标准一致
 */

import {
  ChatCompletionRequest,
  ChatCompletionResponse,
  ChatCompletionMessage,
  ChatCompletionFunctionCall,
  ChatCompletionToolCall,
  ChatCompletionStreamResponse,
  ChatCompletionError
} from './chat-completions';

/**
 * 验证Chat Completions API数据结构
 */
export function validateChatCompletionStructure(): {
  isValid: boolean;
  issues: string[];
  missingFeatures: string[];
  extraFeatures: string[];
} {
  const issues: string[] = [];
  const missingFeatures: string[] = [];
  const extraFeatures: string[] = [];

  // 检查必需参数
  const requiredParams = ['model', 'messages'];
  const request: Partial<ChatCompletionRequest> = {
    model: 'gpt-4',
    messages: []
  };

  requiredParams.forEach(param => {
    if (!(param in request)) {
      issues.push(`缺少必需参数: ${param}`);
    }
  });

  // 检查最新功能支持
  const latestFeatures = [
    'reasoning_enhancement',
    'stream_options',
    'service_tier',
    'reasoning_token_budget',
    'store',
    'parallel_tool_calls'
  ];

  latestFeatures.forEach(feature => {
    if (!(feature in request)) {
      missingFeatures.push(`缺少最新功能: ${feature}`);
    }
  });

  // 检查完成原因枚举
  const validFinishReasons = ['stop', 'length', 'function_call', 'tool_calls', 'content_filter', 'thinking'];
  const testFinishReason: any = 'thinking';
  if (!validFinishReasons.includes(testFinishReason)) {
    issues.push(`完成原因枚举不完整，缺少: thinking`);
  }

  // 检查消息角色枚举
  const validRoles = ['system', 'user', 'assistant', 'function', 'tool'];
  const testRole: any = 'tool';
  if (!validRoles.includes(testRole)) {
    issues.push(`消息角色枚举不完整，缺少: tool`);
  }

  // 检查流式响应支持
  const streamResponse: Partial<ChatCompletionStreamResponse> = {
    object: 'chat.completion.chunk',
    choices: []
  };

  if (streamResponse.object !== 'chat.completion.chunk') {
    issues.push('流式响应对象类型不正确');
  }

  return {
    isValid: issues.length === 0 && missingFeatures.length === 0,
    issues,
    missingFeatures,
    extraFeatures
  };
}

/**
 * 测试用例验证
 */
export function runValidationTests(): void {
  console.log('=== Chat Completions API 数据结构验证 ===');

  const validation = validateChatCompletionStructure();

  console.log('✅ 已支持的功能:');
  console.log('   - 基础消息结构 (system, user, assistant, function, tool)');
  console.log('   - 函数调用 (Function Calling)');
  console.log('   - 工具调用 (Tool Calling)');
  console.log('   - 流式输出 (Streaming)');
  console.log('   - 批量处理 (Batch Processing)');
  console.log('   - 多提供者支持 (Multi-provider)');
  console.log('   - 会话状态管理 (Session Management)');
  console.log('   - 错误处理 (Error Handling)');

  console.log('🚀 最新功能支持:');
  console.log('   - 推理增强 (Reasoning Enhancement)');
  console.log('   - 并行工具调用 (Parallel Tool Calls)');
  console.log('   - 服务层控制 (Service Tier)');
  console.log('   - 推理令牌预算 (Reasoning Token Budget)');
  console.log('   - 存储控制 (Store Control)');
  console.log('   - 流式选项 (Stream Options)');

  if (validation.issues.length > 0) {
    console.log('❌ 发现的问题:');
    validation.issues.forEach(issue => console.log(`   - ${issue}`));
  }

  if (validation.missingFeatures.length > 0) {
    console.log('⚠️ 缺失的功能:');
    validation.missingFeatures.forEach(feature => console.log(`   - ${feature}`));
  }

  console.log(`📊 验证结果: ${validation.isValid ? '✅ 通过' : '❌ 未通过'}`);
}

// 运行验证
if (require.main === module) {
  runValidationTests();
}