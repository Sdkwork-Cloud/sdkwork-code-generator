import { BoostBeastCppRequestCodeGenerator } from '../../../../src/openapi/generator/languages/cpp/boost-beast';
import { CodeGenerateContext } from '../../../../src/types';
import { BASE_TEST_CONFIG, TEST_OPERATION } from './test-data';

describe('boost-beast HTTPS generation', () => {
  test('uses an SSL stream and TLS handshake when the OpenAPI server URL is HTTPS', () => {
    const generator = new BoostBeastCppRequestCodeGenerator();
    const context: CodeGenerateContext = {
      ...BASE_TEST_CONFIG.context,
    };

    const code = generator.generateCode(
      BASE_TEST_CONFIG.path,
      'GET',
      'https://api.example.com',
      TEST_OPERATION,
      [],
      [],
      [],
      undefined,
      context
    );

    expect(code).toContain('#include <boost/beast/ssl.hpp>');
    expect(code).toContain('#include <boost/asio/ssl.hpp>');
    expect(code).toContain('namespace ssl = net::ssl;');
    expect(code).toContain('ssl::context ctx(ssl::context::tlsv12_client);');
    expect(code).toContain(
      'beast::ssl_stream<beast::tcp_stream> stream(ioc, ctx);'
    );
    expect(code).toContain(
      'beast::get_lowest_layer(stream).connect(results);'
    );
    expect(code).toContain('stream.handshake(ssl::stream_base::client);');
    expect(code).toContain('http::write(stream, req);');
    expect(code).toContain('http::read(stream, buffer, res);');
    expect(code).toContain('stream.shutdown(ec);');
    expect(code).not.toContain('beast::tcp_stream stream(ioc);');
    expect(code).not.toContain('stream.connect(results);');
    expect(code).not.toContain(
      'stream.socket().shutdown(tcp::socket::shutdown_both, ec);'
    );
  });

  test('configures SNI and certificate verification for HTTPS servers', () => {
    const generator = new BoostBeastCppRequestCodeGenerator();
    const context: CodeGenerateContext = {
      ...BASE_TEST_CONFIG.context,
    };

    const code = generator.generateCode(
      BASE_TEST_CONFIG.path,
      'GET',
      'https://api.example.com',
      TEST_OPERATION,
      [],
      [],
      [],
      undefined,
      context
    );

    expect(code).toContain('#include <openssl/err.h>');
    expect(code).toContain('#include <openssl/ssl.h>');
    expect(code).toContain('ctx.set_default_verify_paths();');
    expect(code).toContain('stream.set_verify_mode(ssl::verify_peer);');
    expect(code).toContain(
      'if (!SSL_set_tlsext_host_name(stream.native_handle(), "api.example.com")) {'
    );
    expect(code).toContain('static_cast<int>(::ERR_get_error())');
    expect(code).toContain('net::error::get_ssl_category()');
  });
});
