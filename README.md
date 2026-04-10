# SDKWork Code Generator

SDKWork Code Generator is a TypeScript-based OpenAPI 3.x code generator focused on verified HTTP request code generation across many languages and client libraries.

## Features

- OpenAPI 3.x parsing for JSON and YAML specs
- Shared request-generation pipeline with:
  - path-level and operation-level parameter merging
  - `$ref` resolution for schemas, parameters, and request bodies
  - cookies and security placeholder injection
  - request and success-response media-type selection
  - verified raw-body handling for `text/plain`, `application/xml`, `application/x-www-form-urlencoded`, and `multipart/form-data`
  - verified binary file-body handling for `application/octet-stream`
  - verified plain-text response handling for `text/plain`
- Verified request generators for 14 language targets
- Extensible registry for adding new languages and libraries

## Supported Targets

| Language   | Libraries                                    |
| ---------- | -------------------------------------------- |
| JavaScript | axios, fetch, got, superagent                |
| TypeScript | axios, fetch, got, superagent                |
| Python     | requests, aiohttp, httpx                     |
| Go         | net/http, fasthttp, resty                    |
| Java       | okhttp, apache-httpclient, retrofit, unirest |
| C++        | cpprest, cpp-httplib, boost-beast            |
| C#         | httpclient, restsharp, refit                 |
| PHP        | guzzle, curl                                 |
| Ruby       | faraday, httparty                            |
| Swift      | alamofire, urlsession                        |
| Kotlin     | okhttp, retrofit                             |
| Dart       | http, dio                                    |
| Shell      | curl                                         |
| Rust       | reqwest                                      |

Higher-level SDK project generation and MCP-oriented generation are still in progress. The stable, verified surface today is request code generation.

## Installation

```bash
git clone https://github.com/Sdkwork-Cloud/sdkwork-code-generator.git
cd sdkwork-code-generator
npm install
npm run build
```

## Quick Start

```ts
import { OpenAPIParser, CodeGeneratorFactory } from 'sdkwork-code-generator';

const parser = new OpenAPIParser();
const spec = await parser.parseFile('./openapi.yaml');

const result = CodeGeneratorFactory.generate(
  {
    path: '/api/users/{userId}',
    method: 'GET',
    operation: spec.paths['/api/users/{userId}'].get!,
    pathItem: spec.paths['/api/users/{userId}'],
  },
  {
    baseUrl: 'https://api.example.com',
    language: 'typescript',
    library: 'axios',
    openAPISpec: spec,
    outputDir: './generated',
  }
);

console.log(result.code);
```

You can also inspect support at runtime:

```ts
CodeGeneratorFactory.getSupportedLanguages();
CodeGeneratorFactory.getLanguages();
CodeGeneratorFactory.getLibraries('python');
CodeGeneratorFactory.isSupported('rust', 'reqwest');
```

## Project Structure

```text
src/
  openapi/
    parser/        OpenAPI parsing
    generator/     Shared pipeline and language generators
  mcp/             Early-stage MCP-related generation
  sdk/             Early-stage SDK-facing surface
  types/           Shared type definitions
  utils/           Utilities
test/
  openapi/
    generator/
      languages/   Generator regression and smoke tests
dist/              Build output
```

## Development

```bash
npm test
npm run test:coverage
npm run build
npm run lint
npm run format
```

There is no stable CLI entry point published yet. Use the library API from Node.js or TypeScript.

## Testing Strategy

The repository uses Jest with `ts-jest`.

- Unit tests cover shared pipeline behavior such as cookies, security placeholders, and schema example generation.
- Smoke tests exercise every registered language/library pair.
- New generators should ship with focused tests plus support-matrix coverage.

## Adding a New Generator

1. Create a generator under `src/openapi/generator/languages/<language>/<library>/index.ts`.
2. Extend `Language` and `language_http_libs_config` in `src/types/code.ts` if the language is new.
3. Register the generator in `src/openapi/generator/languages/language-registry.ts`.
4. Export it from the relevant `index.ts` files.
5. Add dedicated tests and extend `test/openapi/generator/languages/test-data.ts`.

## Status

- Request generation: supported and regression-tested
- SDK project generation: planned / partial scaffolding
- MCP generation: planned / partial scaffolding

## License

MIT
