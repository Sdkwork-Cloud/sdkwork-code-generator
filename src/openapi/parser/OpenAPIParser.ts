import { OpenAPISpec } from '@/types/openapi';
import { JsonOpenAPISpecParser } from './json';
import { YamlOpenAPISpecParser } from './yaml';
import { BaseOpenAPISpecParser } from './parser';

export class OpenAPIParser extends BaseOpenAPISpecParser {
  private jsonParser: JsonOpenAPISpecParser;
  private yamlParser: YamlOpenAPISpecParser;

  constructor() {
    super();
    this.jsonParser = new JsonOpenAPISpecParser();
    this.yamlParser = new YamlOpenAPISpecParser();
  }

  parse(spec: string): OpenAPISpec {
    // 自动检测格式：先尝试JSON，再尝试YAML
    try {
      return this.jsonParser.parse(spec);
    } catch (jsonError) {
      try {
        return this.yamlParser.parse(spec);
      } catch (yamlError) {
        throw new Error(
          `Failed to parse OpenAPI spec. Neither JSON nor YAML format is valid.\nJSON error: ${
            (jsonError as Error).message
          }\nYAML error: ${(yamlError as Error).message}`
        );
      }
    }
  }

  async parseByUrl(url: string): Promise<OpenAPISpec> {
    const specText = await this.loadSpec(url);
    return this.parse(specText);
  }

  async parseFile(filePath: string): Promise<OpenAPISpec> {
    // 根据文件扩展名选择解析器
    if (filePath.endsWith('.json')) {
      const fs = await import('fs/promises');
      const content = await fs.readFile(filePath, 'utf-8');
      return this.jsonParser.parse(content);
    } else if (filePath.endsWith('.yaml') || filePath.endsWith('.yml')) {
      const fs = await import('fs/promises');
      const content = await fs.readFile(filePath, 'utf-8');
      return this.yamlParser.parse(content);
    } else {
      throw new Error(
        `Unsupported file format: ${filePath}. Supported formats: .json, .yaml, .yml`
      );
    }
  }
}
