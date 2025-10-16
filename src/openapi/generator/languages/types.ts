import { Language, LanguageHttpLibs } from '@/types';
import { language_http_libs_config } from '@/types/code';

/**
 * 语言和HTTP库配置映射（从code.ts导入）
 */
export const languageHttpLibsConfig: LanguageHttpLibs[] = language_http_libs_config;

/**
 * 获取指定语言的HTTP库配置
 * @param language - 编程语言
 * @returns 该语言的HTTP库配置，如果找不到则返回null
 */
export function getLanguageHttpLibs(language: Language): LanguageHttpLibs | null {
  return languageHttpLibsConfig.find(config => config.language === language) || null;
}

/**
 * 检查是否支持指定的语言和库组合
 * @param language - 编程语言
 * @param library - HTTP库名称
 * @returns 是否支持该组合
 */
export function isLanguageLibSupported(language: Language, library: string): boolean {
  const config = getLanguageHttpLibs(language);
  return config ? config.libs.includes(library) : false;
}

/**
 * 获取指定语言的默认HTTP库
 * @param language - 编程语言
 * @returns 默认HTTP库名称，如果找不到则返回null
 */
export function getDefaultLibrary(language: Language): string | null {
  const config = getLanguageHttpLibs(language);
  return config ? config.defaultLib : null;
}