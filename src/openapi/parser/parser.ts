import { OpenAPISpec } from "@/types/openapi";

export interface OpenAPISpecParser {
  parse(spec: string): OpenAPISpec;
  parseByUrl(url: string): Promise<OpenAPISpec>;
}

export class BaseOpenAPISpecParser implements OpenAPISpecParser {
  async parseByUrl(url: string): Promise<OpenAPISpec> {
      let spec = await this.loadSpec(url);
      return this.parse(spec);
  }
  parse(spec: string): OpenAPISpec {
    return JSON.parse(spec);
  } 
  loadSpec(url: string): Promise<string> {
    return fetch(url).then((res) => res.text());
  }
}