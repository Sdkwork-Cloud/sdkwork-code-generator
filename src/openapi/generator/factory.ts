import { Language, LanguageHttpLibs } from '@/types';
import { RequestCodeGenerator, ApiRequestDefinition, CodeGenerateContext, CodeGenerateResult } from '@/types/code';
import { getRequestCodeGenerator, getSupportedLanguages } from './languages/language-registry';

/**
 * 统一的代码生成器工厂类
 * 提供简洁的API接口来生成各种编程语言的HTTP请求代码
 */
export class CodeGeneratorFactory {
  /**
   * 获取支持的语言和库配置列表
   * @returns 语言和HTTP库配置数组
   */
  static getSupportedLanguages(): LanguageHttpLibs[] {
    return getSupportedLanguages();
  }

  /**
   * 检查是否支持特定的语言和库组合
   * @param language - 编程语言
   * @param library - HTTP库名称
   * @returns 是否支持
   */
  static isSupported(language: Language, library: string): boolean {
    return getRequestCodeGenerator(language, library) !== null;
  }

  /**
   * 获取特定语言和库的代码生成器实例
   * @param language - 编程语言
   * @param library - HTTP库名称
   * @returns 代码生成器实例，如果不支持则返回null
   */
  static getGenerator(language: Language, library: string): RequestCodeGenerator | null {
    return getRequestCodeGenerator(language, library);
  }

  /**
   * 生成HTTP请求代码（简化API）
   * @param requestDefinition - API请求定义
   * @param context - 代码生成上下文
   * @returns 生成的代码结果
   */
  static generate(
    requestDefinition: ApiRequestDefinition,
    context: CodeGenerateContext
  ): CodeGenerateResult {
    const { language, library } = context;
    const generator = getRequestCodeGenerator(language, library);
    
    if (!generator) {
      throw new Error(`Unsupported language/library combination: ${language}/${library}`);
    }

    return generator.generate(requestDefinition, context);
  }

  /**
   * 批量生成多个API操作的代码
   * @param requestDefinitions - API请求定义数组
   * @param context - 代码生成上下文
   * @returns 生成的代码结果数组
   */
  static generateBatch(
    requestDefinitions: ApiRequestDefinition[],
    context: CodeGenerateContext
  ): CodeGenerateResult[] {
    const { language, library } = context;
    const generator = getRequestCodeGenerator(language, library);
    
    if (!generator) {
      throw new Error(`Unsupported language/library combination: ${language}/${library}`);
    }

    return requestDefinitions.map(definition => 
      generator.generate(definition, context)
    );
  }

  /**
   * 获取所有支持的语言列表（去重）
   * @returns 支持的语言名称数组
   */
  static getLanguages(): string[] {
    const supported = getSupportedLanguages();
    return [...new Set(supported.map(item => item.language))];
  }

  /**
   * 获取特定语言支持的HTTP库列表
   * @param language - 编程语言
   * @returns 支持的HTTP库名称数组
   */
  static getLibraries(language: Language): string[] {
    const supported = getSupportedLanguages();
    const languageConfig = supported.find(item => item.language === language);
    return languageConfig?.libs || [];
  }

  /**
   * 获取特定语言的默认HTTP库
   * @param language - 编程语言
   * @returns 默认HTTP库名称
   */
  static getDefaultLibrary(language: Language): string {
    const supported = getSupportedLanguages();
    const languageConfig = supported.find(item => item.language === language);
    return languageConfig?.defaultLib || '';
  }
}

// 导出所有语言的HTTP请求代码生成器
export * from './languages/javascript';
export * from './languages/typescript';
export * from './languages/python';
export * from './languages/go';
export * from './languages/java';
export * from './languages/cpp';
export * from './languages/csharp';
export * from './languages/php';
export * from './languages/ruby';
export * from './languages/swift';
export * from './languages/kotlin';
export * from './languages/dart';

// 导出类型定义
export * from './languages/types';

// 导出注册表相关函数
export { getRequestCodeGenerator, getSupportedLanguages } from './languages/language-registry';

// 默认导出工厂类
export default CodeGeneratorFactory;