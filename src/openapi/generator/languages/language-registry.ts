import { Language, LanguageHttpLibs } from '@/types';
import { RequestCodeGenerator, language_http_libs_config } from '@/types/code';

// JavaScript语言生成器
import { AxiosJavaScriptRequestCodeGenerator } from './javascript/axios';
import { FetchJavaScriptRequestCodeGenerator } from './javascript/fetch';
import { GotJavaScriptRequestCodeGenerator } from './javascript/got';
import { SuperagentJavaScriptRequestCodeGenerator } from './javascript/superagent';

// TypeScript语言生成器
import { AxiosTypeScriptRequestCodeGenerator } from './typescript/axios';
import { FetchTypeScriptRequestCodeGenerator } from './typescript/fetch';
import { GotTypeScriptRequestCodeGenerator } from './typescript/got';
import { SuperagentTypeScriptRequestCodeGenerator } from './typescript/superagent';

// Python语言生成器
import { RequestsPythonRequestCodeGenerator } from './python/requests';
import { AiohttpPythonRequestCodeGenerator } from './python/aiohttp';
import { HttpxPythonRequestCodeGenerator } from './python/httpx';

// Go语言生成器
import { NetHttpGoRequestCodeGenerator } from './go/net_http';
import { FasthttpGoRequestCodeGenerator } from './go/fasthttp';
import { RestyGoRequestCodeGenerator } from './go/resty';

// Java语言生成器
import { OkHttpJavaRequestCodeGenerator } from './java/okhttp';
import { ApacheHttpClientJavaRequestCodeGenerator } from './java/apache_httpclient';
import { RetrofitJavaRequestCodeGenerator } from './java/retrofit';
import { UnirestJavaRequestCodeGenerator } from './java/unirest';

// C++语言生成器
import { CpprestCppRequestCodeGenerator } from './cpp/cpprest';
import { CppHttplibCppRequestCodeGenerator } from './cpp/cpp-httplib';
import { BoostBeastCppRequestCodeGenerator } from './cpp/boost-beast';

// C#语言生成器
import { HttpClientCSharpRequestCodeGenerator } from './csharp/httpclient';
import { RestsharpCsharpRequestCodeGenerator } from './csharp/restsharp';
import { RefitCsharpRequestCodeGenerator } from './csharp/refit';

// PHP语言生成器
import { GuzzlePhpRequestCodeGenerator } from './php/guzzle';
import { CurlPhpRequestCodeGenerator } from './php/curl';

// Ruby语言生成器
import { FaradayRubyRequestCodeGenerator } from './ruby/faraday';
import { HttpartyRubyRequestCodeGenerator } from './ruby/httparty';

// Swift语言生成器
import { AlamofireSwiftRequestCodeGenerator } from './swift/alamofire';
import { UrlsessionSwiftRequestCodeGenerator } from './swift/urlsession';

// Kotlin语言生成器
import { OkHttpKotlinRequestCodeGenerator } from './kotlin/okhttp';
import { RetrofitKotlinRequestCodeGenerator } from './kotlin/retrofit';

// Dart语言生成器
import { HttpDartRequestCodeGenerator } from './dart/http';
import { DioDartRequestCodeGenerator } from './dart/dio';

/**
 * 语言生成器注册表
 * 映射语言和HTTP库到对应的代码生成器类
 */
export const languageGeneratorRegistry: Record<string, new () => RequestCodeGenerator> = {
  // JavaScript
  'javascript-axios': AxiosJavaScriptRequestCodeGenerator,
  'javascript-fetch': FetchJavaScriptRequestCodeGenerator,
  'javascript-got': GotJavaScriptRequestCodeGenerator,
  'javascript-superagent': SuperagentJavaScriptRequestCodeGenerator,
  
  // TypeScript
  'typescript-axios': AxiosTypeScriptRequestCodeGenerator,
  'typescript-fetch': FetchTypeScriptRequestCodeGenerator,
  'typescript-got': GotTypeScriptRequestCodeGenerator,
  'typescript-superagent': SuperagentTypeScriptRequestCodeGenerator,
  
  // Python
  'python-requests': RequestsPythonRequestCodeGenerator,
  'python-aiohttp': AiohttpPythonRequestCodeGenerator,
  'python-httpx': HttpxPythonRequestCodeGenerator,
  
  // Go
  'go-net/http': NetHttpGoRequestCodeGenerator,
  'go-fasthttp': FasthttpGoRequestCodeGenerator,
  'go-resty': RestyGoRequestCodeGenerator,
  
  // Java
  'java-okhttp': OkHttpJavaRequestCodeGenerator,
  'java-apache-httpclient': ApacheHttpClientJavaRequestCodeGenerator,
  'java-retrofit': RetrofitJavaRequestCodeGenerator,
  'java-unirest': UnirestJavaRequestCodeGenerator,
  
  // C++
  'cpp-cpprest': CpprestCppRequestCodeGenerator,
  'cpp-cpp-httplib': CppHttplibCppRequestCodeGenerator,
  'cpp-boost-beast': BoostBeastCppRequestCodeGenerator,
  
  // C#
  'csharp-httpclient': HttpClientCSharpRequestCodeGenerator,
  'csharp-restsharp': RestsharpCsharpRequestCodeGenerator,
  'csharp-refit': RefitCsharpRequestCodeGenerator,
  
  // PHP
  'php-guzzle': GuzzlePhpRequestCodeGenerator,
  'php-curl': CurlPhpRequestCodeGenerator,
  
  // Ruby
  'ruby-faraday': FaradayRubyRequestCodeGenerator,
  'ruby-httparty': HttpartyRubyRequestCodeGenerator,
  
  // Swift
  'swift-alamofire': AlamofireSwiftRequestCodeGenerator,
  'swift-urlsession': UrlsessionSwiftRequestCodeGenerator,
  
  // Kotlin
  'kotlin-okhttp': OkHttpKotlinRequestCodeGenerator,
  'kotlin-retrofit': RetrofitKotlinRequestCodeGenerator,
  
  // Dart
  'dart-http': HttpDartRequestCodeGenerator,
  'dart-dio': DioDartRequestCodeGenerator,
};

/**
 * 根据语言和库名称获取代码生成器实例
 * @param language - 编程语言
 * @param library - HTTP库名称
 * @returns 代码生成器实例，如果找不到则返回null
 */
export function getRequestCodeGenerator(language: Language, library: string): RequestCodeGenerator | null {
  const key = `${language}-${library}`;
  const GeneratorClass = languageGeneratorRegistry[key];
  
  if (GeneratorClass) {
    return new GeneratorClass();
  }
  
  return null;
}

/**
 * 获取支持的语言和库配置
 * @returns 语言和HTTP库配置数组
 */
export function getSupportedLanguages(): LanguageHttpLibs[] {
  return language_http_libs_config;
}