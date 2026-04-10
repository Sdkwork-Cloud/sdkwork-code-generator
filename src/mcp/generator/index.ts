/**
 * MCP 生成器模块主入口
 * 提供多语言 MCP 工具生成功能
 */

export * from './languages/javascript';
export * from './languages/typescript';
export * from './languages/python';
export * from './languages/go';
export * from './languages/java';

export interface MCPGeneratorOptions {
  language: string;
  framework?: string;
  packageManager?: string;
  outputDir?: string;
}
