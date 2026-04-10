import { BaseOpenAPISpecParser } from '../parser';
import { OpenAPISpec } from '@/types/openapi';
import { parse } from 'yaml';

export class YamlOpenAPISpecParser extends BaseOpenAPISpecParser {
  parse(spec: string): OpenAPISpec {
    try {
      return parse(spec) as OpenAPISpec;
    } catch (error) {
      throw new Error(`YAML parsing failed: ${(error as Error).message}`);
    }
  }
}
