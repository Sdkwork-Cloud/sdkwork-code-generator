# 代码编写智能体系统

一个支持多种编程语言的智能代码编写系统，提供代码生成、分析、重构等专业功能。

## 系统架构

### 核心组件

1. **基础智能体 (Base Agent)**
   - 提供通用的代码编写能力
   - 支持多种编程语言
   - 包含基本的代码生成、分析功能

2. **专业智能体 (Specialized Agents)**
   - **代码生成智能体**: 专门负责代码生成任务
   - **代码分析智能体**: 专门负责代码质量分析
   - **代码重构智能体**: 专门负责代码重构优化
   - **代码优化智能体**: 专门负责性能优化
   - **代码翻译智能体**: 专门负责语言间代码转换

3. **智能体管理器 (Agent Manager)**
   - 统一管理所有智能体
   - 提供智能体注册、发现、调度功能
   - 实现负载均衡和故障转移

## 功能特性

### 代码生成
- 支持函数、类、模块级别的代码生成
- 基于模板和AI的混合生成策略
- 自动生成注释和文档
- 支持测试代码生成

### 代码分析
- 代码质量评估
- 性能分析
- 安全漏洞检测
- 复杂度分析
- 依赖关系分析

### 代码重构
- 提取方法/类重构
- 重命名重构
- 内联重构
- 移动方法重构
- 提取接口重构
- 自动重构建议

### 多语言支持
- JavaScript/TypeScript
- Python
- Java
- Go
- C++
- C#
- 更多语言持续增加中...

## 快速开始

### 安装依赖
```bash
npm install
```

### 基础使用
```typescript
import { codeAgentFactory } from './src/agent';

// 创建智能体
const agent = codeAgentFactory.create({
  config: {
    provider: { provider: 'openai', model: 'gpt-4' },
    supportedLanguages: ['javascript', 'typescript']
  }
});

// 生成代码
const result = await agent.coding.generateCode(
  '创建一个函数，计算两个数字的和',
  'javascript',
  { generateComments: true }
);

console.log(result.code);
```

### 使用专业智能体
```typescript
import { codeGenerationAgentFactory } from './src/agent/code-generation-agent';

// 创建代码生成智能体
const generationAgent = codeGenerationAgentFactory.create({
  supportedLanguages: ['javascript', 'typescript'],
  generationStrategies: { aiBased: true, templateBased: true }
});

// 生成复杂函数
const functionResult = await generationAgent.generation.generateFunction(
  '实现快速排序算法',
  'typescript',
  { generateTests: true }
);
```

### 使用智能体管理器
```typescript
import { agentManagerFactory } from './src/agent/agent-manager';

// 创建管理器
const manager = agentManagerFactory.create({
  autoDiscovery: true,
  loadBalancingStrategy: 'round-robin'
});

// 注册智能体
const agentId = await manager.agents.register(
  'code-generation', 
  generationAgent, 
  {}
);

// 提交任务
const taskId = await manager.tasks.submitTask(
  'code-generation',
  { description: '生成用户认证模块', language: 'typescript' },
  'high'
);
```

## API 参考

### 基础智能体接口
```typescript
interface CodeAgent {
  // 代码编写功能
  coding: {
    generateCode(description: string, language: string, options?: CodeGenerationOptions): Promise<CodeGenerationResult>;
    analyzeCode(code: string, language: string, options?: CodeAnalysisOptions): Promise<CodeAnalysisResult>;
    refactorCode(code: string, language: string, options?: CodeRefactoringOptions): Promise<CodeRefactoringResult>;
  };
  
  // 语言支持
  languages: {
    getSupportedLanguages(): string[];
    isLanguageSupported(language: string): boolean;
  };
  
  // 项目管理
  projects: {
    createProject(name: string, config: ProjectConfig): Promise<string>;
    openProject(projectId: string): Promise<Project>;
  };
}
```

### 代码生成智能体接口
```typescript
interface CodeGenerationAgent extends CodeAgent {
  generation: {
    generateFunction(description: string, language: string, options?: FunctionGenerationOptions): Promise<GenerationResult>;
    generateClass(description: string, language: string, options?: ClassGenerationOptions): Promise<GenerationResult>;
    generateModule(description: string, language: string, options?: ModuleGenerationOptions): Promise<GenerationResult>;
    generateTests(code: string, language: string, options?: TestGenerationOptions): Promise<GenerationResult>;
  };
}
```

### 代码分析智能体接口
```typescript
interface CodeAnalysisAgent extends CodeAgent {
  analysis: {
    analyzeQuality(code: string, language: string, options?: QualityAnalysisOptions): Promise<QualityAnalysisResult>;
    analyzePerformance(code: string, language: string, options?: PerformanceAnalysisOptions): Promise<PerformanceAnalysisResult>;
    analyzeSecurity(code: string, language: string, options?: SecurityAnalysisOptions): Promise<SecurityAnalysisResult>;
    analyzeComprehensive(code: string, language: string, options?: ComprehensiveAnalysisOptions): Promise<ComprehensiveAnalysisResult>;
  };
}
```

## 配置说明

### 智能体配置
```typescript
interface CodeAgentCreateOptions {
  config: {
    // AI提供商配置
    provider: {
      provider: 'openai' | 'anthropic' | 'local';
      model: string;
      apiKey?: string;
    };
    
    // 支持的语言
    supportedLanguages: string[];
    
    // 代码风格配置
    codeStyle: {
      indentStyle: 'spaces' | 'tabs';
      indentSize: number;
      lineEndings: 'lf' | 'crlf';
      quoteStyle: 'single' | 'double';
      semicolons: boolean;
    };
    
    // 代码质量配置
    codeQuality: {
      linting: boolean;
      formatting: boolean;
      typeChecking: boolean;
    };
  };
}
```

## 示例代码

查看 `src/agent/examples/usage-example.ts` 文件获取完整的使用示例。

## 开发指南

### 添加新的专业智能体

1. 创建智能体文件 `src/agent/[agent-name]-agent.ts`
2. 实现相应的智能体接口
3. 在智能体管理器中注册新的智能体类型
4. 更新使用示例和文档

### 扩展语言支持

1. 在相应的智能体配置中添加新的语言
2. 实现语言特定的代码生成/分析逻辑
3. 更新语言支持检测逻辑

## 贡献指南

欢迎提交 Issue 和 Pull Request 来改进这个项目。

## 许可证

MIT License