import { Language } from '@/types';
import { GeneratedCodeDependency } from '@/types/code';

type DependencyKey = `${Language}-${string}`;

function npm(
  name: string,
  version: string,
  installName = name
): GeneratedCodeDependency {
  return {
    name,
    packageManager: 'npm',
    version,
    installation: `npm install ${installName}@${version}`,
  };
}

function pip(name: string, version: string): GeneratedCodeDependency {
  return {
    name,
    packageManager: 'pip',
    version,
    installation: `pip install ${name}==${version}`,
  };
}

function goModule(name: string, version: string): GeneratedCodeDependency {
  return {
    name,
    packageManager: 'go',
    version,
    installation: `go get ${name}@${version}`,
  };
}

function gradle(
  name: string,
  version: string,
  configuration = 'implementation'
): GeneratedCodeDependency {
  return {
    name,
    packageManager: 'gradle',
    version,
    installation: `${configuration}("${name}:${version}")`,
  };
}

function nuget(name: string, version: string): GeneratedCodeDependency {
  return {
    name,
    packageManager: 'nuget',
    version,
    installation: `dotnet add package ${name} --version ${version}`,
  };
}

function composer(name: string, version: string): GeneratedCodeDependency {
  return {
    name,
    packageManager: 'composer',
    version,
    installation: `composer require ${name}:${version}`,
  };
}

function bundler(name: string, version: string): GeneratedCodeDependency {
  return {
    name,
    packageManager: 'bundler',
    version,
    installation: `gem "${name}", "~> ${version}"`,
  };
}

function swiftpm(
  name: string,
  version: string,
  url: string
): GeneratedCodeDependency {
  return {
    name,
    packageManager: 'swiftpm',
    version,
    installation: `.package(url: "${url}", from: "${version}")`,
  };
}

function pub(name: string, version: string): GeneratedCodeDependency {
  return {
    name,
    packageManager: 'pub',
    version,
    installation: `${name}: ^${version}`,
  };
}

function cargo(
  name: string,
  version: string,
  flags = ''
): GeneratedCodeDependency {
  const normalizedFlags = flags ? ` ${flags}` : '';

  return {
    name,
    packageManager: 'cargo',
    version,
    installation: `cargo add ${name}@${version}${normalizedFlags}`,
  };
}

function vcpkg(name: string, version: string): GeneratedCodeDependency {
  return {
    name,
    packageManager: 'vcpkg',
    version,
    installation: `vcpkg install ${name}`,
  };
}

function builtin(name: string, installation: string): GeneratedCodeDependency {
  return {
    name,
    packageManager: 'builtin',
    installation,
    builtin: true,
  };
}

function systemDependency(
  name: string,
  installation: string
): GeneratedCodeDependency {
  return {
    name,
    packageManager: 'system',
    installation,
  };
}

const retrofitDependencies = [
  gradle('com.squareup.retrofit2:retrofit', '3.0.0'),
  gradle('com.squareup.retrofit2:converter-gson', '3.0.0'),
  gradle('com.squareup.retrofit2:converter-scalars', '3.0.0'),
  gradle('com.squareup.okhttp3:okhttp', '5.3.2'),
  gradle('com.google.code.gson:gson', '2.13.2'),
];

const dependencyRegistry: Record<DependencyKey, GeneratedCodeDependency[]> = {
  'javascript-axios': [npm('axios', '1.11.0')],
  'javascript-fetch': [
    builtin(
      'fetch',
      'No external package required. Use the runtime-provided Fetch API in Node.js 18+ or modern browsers.'
    ),
  ],
  'javascript-got': [npm('got', '14.4.7')],
  'javascript-superagent': [npm('superagent', '10.2.3')],

  'typescript-axios': [npm('axios', '1.11.0')],
  'typescript-fetch': [
    builtin(
      'fetch',
      'No external package required. Use the runtime-provided Fetch API in Node.js 18+ or modern browsers.'
    ),
  ],
  'typescript-got': [npm('got', '14.4.7')],
  'typescript-superagent': [npm('superagent', '10.2.3')],

  'python-requests': [pip('requests', '2.33.1')],
  'python-aiohttp': [pip('aiohttp', '3.13.5')],
  'python-httpx': [pip('httpx', '0.28.1')],

  'go-net/http': [
    builtin(
      'net/http',
      'No external module required. net/http is part of the Go standard library.'
    ),
  ],
  'go-fasthttp': [goModule('github.com/valyala/fasthttp', 'v1.70.0')],
  'go-resty': [goModule('github.com/go-resty/resty/v2', 'v2.17.2')],

  'java-okhttp': [gradle('com.squareup.okhttp3:okhttp', '5.3.2')],
  'java-apache-httpclient': [
    gradle('org.apache.httpcomponents.client5:httpclient5', '5.5.1'),
    gradle('com.fasterxml.jackson.core:jackson-databind', '2.21.1'),
  ],
  'java-retrofit': retrofitDependencies,
  'java-unirest': [gradle('com.konghq:unirest-java-core', '4.7.4')],

  'cpp-cpprest': [vcpkg('cpprestsdk', '2.10.19')],
  'cpp-cpp-httplib': [vcpkg('cpp-httplib', '0.28.0')],
  'cpp-boost-beast': [vcpkg('boost-beast', '1.90.0')],

  'csharp-httpclient': [
    builtin(
      'System.Net.Http.HttpClient',
      'No extra package required when targeting modern .NET runtimes that include HttpClient.'
    ),
  ],
  'csharp-restsharp': [
    nuget('RestSharp', '114.0.0'),
    nuget('Newtonsoft.Json', '13.0.4'),
  ],
  'csharp-refit': [
    nuget('Refit', '10.1.6'),
    nuget('Newtonsoft.Json', '13.0.4'),
  ],

  'php-guzzle': [composer('guzzlehttp/guzzle', '7.10.0')],
  'php-curl': [
    systemDependency(
      'ext-curl',
      'Enable the PHP cURL extension in the target runtime.'
    ),
  ],

  'ruby-faraday': [bundler('faraday', '2.14.1')],
  'ruby-httparty': [bundler('httparty', '0.24.2')],

  'swift-alamofire': [
    swiftpm(
      'Alamofire',
      '5.11.1',
      'https://github.com/Alamofire/Alamofire.git'
    ),
  ],
  'swift-urlsession': [
    builtin(
      'URLSession',
      'No external package required. URLSession ships with Foundation.'
    ),
  ],

  'kotlin-okhttp': [gradle('com.squareup.okhttp3:okhttp', '5.3.2')],
  'kotlin-retrofit': retrofitDependencies,

  'dart-http': [pub('http', '1.6.0')],
  'dart-dio': [pub('dio', '5.9.2')],

  'shell-curl': [
    systemDependency(
      'curl',
      'Install curl from the operating system package manager if it is not already available.'
    ),
  ],

  'rust-reqwest': [
    cargo('reqwest', '0.13.2', '--features json,multipart'),
    cargo('tokio', '1.50.0', '--features macros,rt-multi-thread'),
    cargo('serde_json', '1.0.149'),
  ],
};

export function getGeneratedCodeDependencies(
  language: Language,
  library: string
): GeneratedCodeDependency[] {
  const dependencies = dependencyRegistry[`${language}-${library}`];

  return dependencies
    ? dependencies.map((dependency) => ({ ...dependency }))
    : [];
}
