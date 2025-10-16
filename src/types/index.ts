/**
 * 类型定义模块主入口
 * 导出所有核心类型定义
 */

export * from './mcp';
export * from './openapi';
export * from './code'; 
export * from './sdk';
export * from './context';
export * from './prompts';

export interface BaseType {
  /** 唯一标识符 */
  id: string;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
}

export interface PaginationParams {
  /** 页码 */
  page?: number;
  /** 每页数量 */
  limit?: number;
}

export interface PaginationResult<T> {
  /** 数据列表 */
  data: T[];
  /** 总数量 */
  total: number;
  /** 当前页码 */
  page: number;
  /** 每页数量 */
  limit: number;
  /** 总页数 */
  totalPages: number;
}


export interface ErrorResponse {
  /** 错误代码 */
  code: string;
  /** 错误消息 */
  message: string;
  /** 错误详情 */
  details?: unknown;
}