import { BaseOpenAPISpecParser } from '../parser';
import { OpenAPISpec } from '@/types/openapi';

export class JsonOpenAPISpecParser extends BaseOpenAPISpecParser {
  parse(spec: string): OpenAPISpec {
    try {
      return JSON.parse(spec) as OpenAPISpec;
    } catch (error) {
      throw new Error(`JSON parsing failed: ${(error as Error).message}`);
    }
  }
}