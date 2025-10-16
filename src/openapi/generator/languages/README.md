# OpenAPI HTTP请求代码生成器

本目录包含支持多种编程语言和HTTP客户端库的代码生成器实现。

## 支持的语言和库

### 已实现的语言和库

| 语言 | 支持的HTTP库 | 默认库 | 状态 |
|------|-------------|--------|------|
| JavaScript | axios, fetch, got, superagent | axios | ✅ axios已实现 |
| TypeScript | axios, fetch, got, superagent | axios | ✅ axios已实现 |
| Python | requests, aiohttp, httpx | requests | ✅ requests已实现 |
| Go | net/http, fasthttp, resty | net/http | ✅ net/http已实现 |
| Java | okhttp, apache-httpclient, retrofit, unirest | okhttp | ✅ okhttp已实现 |
| C++ | cpprest, cpp-httplib, boost-beast | cpprest | ✅ cpprest已实现 |
| C# | httpclient, restsharp, refit | httpclient | ✅ httpclient已实现 |
| PHP | guzzle, curl | guzzle | ✅ guzzle已实现 |
| Ruby | faraday, httparty | faraday | ✅ faraday已实现 |
| Swift | alamofire, urlsession | alamofire | ✅ alamofire已实现 |
| Kotlin | okhttp, retrofit | okhttp | ✅ okhttp已实现 |
| Dart | http, dio | http | ✅ http已实现 |

## 使用方式

### 1. 获取代码生成器

```typescript
import { getRequestCodeGenerator } from './languages/language-registry';

// 获取JavaScript + axios的代码生成器
const generator = getRequestCodeGenerator('javascript', 'axios');

if (generator) {
  // 使用生成器生成代码
  const result = generator.generate(requestDefinition, context);
}
```

### 2. 查看支持的语言和库

```typescript
import { getSupportedLanguages } from './languages/language-registry';

const supportedLanguages = getSupportedLanguages();
console.log(supportedLanguages);
```

## 实现规范

### 代码生成器类命名规范

代码生成器类名应遵循以下格式：
`{LibraryName}{Language}RequestCodeGenerator`

例如：
- `AxiosJavaScriptRequestCodeGenerator`
- `RequestsPythonRequestCodeGenerator`
- `OkHttpJavaRequestCodeGenerator`

### 文件结构规范

每个语言目录应包含：
- `index.ts` - 导出该语言的所有HTTP库生成器
- `{library-name}/index.ts` - 具体的HTTP库生成器实现

### 实现要求

每个代码生成器必须：
1. 继承 `BaseRequestCodeGenerator` 抽象类
2. 实现 `getLanguage()` 方法返回目标语言
3. 实现 `getLibrary()` 方法返回HTTP库名称
4. 实现 `generateCode()` 方法生成具体的HTTP请求代码

## 扩展新的语言或库

### 1. 创建新的语言目录

```bash
mkdir src/openapi/generator/languages/{language-name}
```

### 2. 创建HTTP库生成器

在对应语言目录下创建库实现：
```typescript
export class {LibraryName}{Language}RequestCodeGenerator extends BaseRequestCodeGenerator {
  // 实现抽象方法
}
```

### 3. 注册到语言注册表

在 `language-registry.ts` 中添加新的生成器映射：
```typescript
export const languageGeneratorRegistry = {
  // ... 现有映射
  '{language-name}-{library-name}': {LibraryName}{Language}RequestCodeGenerator,
};
```

### 4. 更新索引文件

在对应语言的 `index.ts` 中导出新的生成器。

## 测试

每个代码生成器应包含相应的单元测试，验证生成的代码符合目标语言的语法规范和HTTP库的使用方式。