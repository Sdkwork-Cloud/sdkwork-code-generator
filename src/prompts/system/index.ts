/**
 * 系统级提示词管理
 */

export const SYSTEM_PROMPTS = {
  /**
   * OpenAPI 解析提示词
   */
  OPENAPI_PARSER: `你是一个专业的 OpenAPI 规范解析器。请解析提供的 OpenAPI 规范文件并生成相应的代码。`,

  /**
   * 代码生成提示词
   */
  CODE_GENERATOR: `根据 OpenAPI 规范生成高质量、类型安全的代码。确保代码符合最佳实践和编码规范。`,

  /**
   * SDK 生成提示词
   */
  SDK_GENERATOR: `生成完整的 SDK 项目结构，包括配置文件、文档和示例代码。`,

  /**
   * MCP 工具生成提示词
   */
  MCP_GENERATOR: `生成符合 Model Context Protocol 标准的工具代码。`
};