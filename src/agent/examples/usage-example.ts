/**
 * 智能体使用示例
 * 展示如何使用各种专业智能体进行代码编写任务
 */

import { codeAgentFactory, CodeAgentCreateOptions } from '../index';
import { codeGenerationAgentFactory } from '../code-generation-agent';
import { codeAnalysisAgentFactory } from '../code-analysis-agent';
import { codeRefactoringAgentFactory } from '../code-refactoring-agent';
import { agentManagerFactory } from '../agent-manager';

/**
 * 基础智能体使用示例
 */
async function basicAgentExample() {
  console.log('=== 基础智能体使用示例 ===');
  
  const agentConfig: CodeAgentCreateOptions = {
    config: {
      provider: { provider: 'openai', model: 'gpt-4' }
    },
    codeConfig: {
      provider: { provider: 'openai', model: 'gpt-4' },
      supportedLanguages: ['javascript', 'typescript', 'python', 'java'],
      codeStyle: {
        indentStyle: 'spaces',
        indentSize: 2,
        lineEndings: 'lf',
        quoteStyle: 'single',
        semicolons: true
      },
      codeQuality: {
        linting: true,
        formatting: true,
        typeChecking: true
      },
      codeGeneration: {
        generateComments: true,
        generateDocumentation: false,
        generateTests: false
      }
    }
  };

  const agent = codeAgentFactory.create(agentConfig);
  
  const result = await agent.coding.generateCode(
    '创建一个函数，计算两个数字的和',
    'javascript',
    { generateComments: true }
  );
  
  console.log('生成的代码:', result.code);
}

/**
 * 代码生成智能体使用示例
 */
async function codeGenerationAgentExample() {
  console.log('\n=== 代码生成智能体使用示例 ===');
  
  const config = {
    supportedLanguages: ['javascript', 'typescript'],
    generationStrategies: { templateBased: true, aiBased: true, ruleBased: true },
    qualityRequirements: { complexityLimit: 10, lineLimit: 100, duplicationLimit: 5 },
    codeStyle: {
      indentStyle: 'spaces' as const,
      indentSize: 2,
      namingConventions: {
        variables: 'camelCase',
        functions: 'camelCase',
        classes: 'PascalCase',
        constants: 'UPPER_CASE'
      }
    }
  };

  const agent = codeGenerationAgentFactory.create(config);
  
  const result = await agent.generation.generateFunction(
    '计算斐波那契数列的第n项',
    'javascript',
    { generateComments: true }
  );
  
  console.log('生成的函数代码:', result.code);
}

/**
 * 代码分析智能体使用示例
 */
async function codeAnalysisAgentExample() {
  console.log('\n=== 代码分析智能体使用示例 ===');
  
  const config = {
    supportedLanguages: ['javascript', 'typescript'],
    analysisCapabilities: { 
      qualityAnalysis: true, 
      performanceAnalysis: true,
      securityAnalysis: false,
      complexityAnalysis: true,
      dependencyAnalysis: false
    },
    analysisDepth: 'standard' as const,
    analysisStandards: ['codeQuality', 'bestPractices']
  };

  const agent = codeAnalysisAgentFactory.create(config);
  
  const codeToAnalyze = `
function calculateSum(a, b) {
  return a + b;
}
  `;
  
  const result = await agent.analysis.analyzeQuality(
    codeToAnalyze,
    'javascript',
    { depth: 'medium' }
  );
  
  console.log('代码质量评分:', result.qualityScore);
}

/**
 * 代码重构智能体使用示例
 */
async function codeRefactoringAgentExample() {
  console.log('\n=== 代码重构智能体使用示例 ===');
  
  const config = {
    supportedLanguages: ['javascript', 'typescript'],
    refactoringStrategies: { 
      extractMethod: true, 
      extractClass: false,
      rename: true, 
      inline: false,
      moveMethod: false,
      extractInterface: false
    },
    refactoringRules: { 
      codeSmellDetection: true, 
      refactoringSuggestions: true, 
      refactoringValidation: true 
    },
    safetyLevel: 'medium' as const
  };

  const agent = codeRefactoringAgentFactory.create(config);
  
  const codeToRefactor = `
function processData(data) {
  let result = 0;
  for (let i = 0; i < data.length; i++) {
    result += data[i];
  }
  return result;
}
  `;
  
  const result = await agent.refactoring.extractMethod(
    codeToRefactor,
    'javascript',
    'calculateSum',
    {}
  );
  
  console.log('重构后的代码:', result.refactoredCode);
}

/**
 * 智能体管理器使用示例
 */
async function agentManagerExample() {
  console.log('\n=== 智能体管理器使用示例 ===');
  
  const config = {
    autoDiscovery: true,
    healthCheckInterval: 30000,
    maxAgents: 10,
    loadBalancingStrategy: 'round-robin' as const,
    failoverEnabled: true
  };

  const manager = agentManagerFactory.create(config);
  
  // 注册各种智能体
  const generationAgent = codeGenerationAgentFactory.create({
    supportedLanguages: ['javascript', 'typescript'],
    generationStrategies: { templateBased: true, aiBased: true, ruleBased: true },
    qualityRequirements: { complexityLimit: 10, lineLimit: 100, duplicationLimit: 5 },
    codeStyle: {
      indentStyle: 'spaces' as const,
      indentSize: 2,
      namingConventions: {
        variables: 'camelCase',
        functions: 'camelCase',
        classes: 'PascalCase',
        constants: 'UPPER_CASE'
      }
    }
  });
  
  const agentId = await manager.agents.register('code-generation', generationAgent, {});
  console.log('注册的智能体ID:', agentId);
  
  // 提交任务
  const taskId = await manager.tasks.submitTask(
    'code-generation',
    {
      description: '生成用户管理API',
      language: 'typescript',
      requirements: '包含CRUD操作'
    },
    'high'
  );
  
  console.log('提交的任务ID:', taskId);
  
  // 检查任务状态
  const taskStatus = await manager.tasks.getTaskStatus(taskId);
  console.log('任务状态:', taskStatus.status);
}

/**
 * 主函数
 */
async function main() {
  try {
    await basicAgentExample();
    await codeGenerationAgentExample();
    await codeAnalysisAgentExample();
    await codeRefactoringAgentExample();
    await agentManagerExample();
    
    console.log('\n=== 所有示例执行完成 ===');
  } catch (error) {
    console.error('示例执行出错:', error);
  }
}

// 执行示例
if (require.main === module) {
  main().catch(console.error);
}

export {
  basicAgentExample,
  codeGenerationAgentExample,
  codeAnalysisAgentExample,
  codeRefactoringAgentExample,
  agentManagerExample,
  main
};