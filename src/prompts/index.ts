/**
 * 提示词管理模块主入口
 */

export * from './system';

/**
 * 提示词管理器
 */
export class PromptManager {
  /**
   * 获取系统提示词
   */
  getSystemPrompts(): any {
    return {};
  }

  /**
   * 获取用户提示词
   */
  getUserPrompts(): any {
    return {};
  }
}