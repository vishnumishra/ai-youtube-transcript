/**
 * Unit tests for the HTTP client and proxy functionality
 * 
 * This file tests the HTTP client and proxy configuration classes.
 */

import { 
  GenericProxyConfig, 
  WebshareProxyConfig 
} from '../../dist/youtube-transcript.esm.js';

// Test suite
async function runTests() {
  console.log('🧪 Running HTTP Client and Proxy Unit Tests');
  
  let passedTests = 0;
  let failedTests = 0;
  
  // Helper function to run a test
  async function runTest(name, testFn) {
    try {
      console.log(`\n🔍 Running test: ${name}`);
      await testFn();
      console.log(`✅ Test passed: ${name}`);
      passedTests++;
    } catch (error) {
      console.error(`❌ Test failed: ${name}`);
      console.error(`   Error: ${error.message}`);
      if (error.stack) {
        console.error(`   Stack: ${error.stack.split('\n')[1]}`);
      }
      failedTests++;
    }
  }
  
  // Helper function to assert
  function assert(condition, message) {
    if (!condition) {
      throw new Error(message || 'Assertion failed');
    }
  }
  
  // Test 1: GenericProxyConfig
  await runTest('GenericProxyConfig', () => {
    const httpUrl = 'http://user:pass@proxy.example.com:8080';
    const httpsUrl = 'https://user:pass@proxy.example.com:8443';
    
    // Test with both URLs
    const proxyConfig1 = new GenericProxyConfig(httpUrl, httpsUrl);
    assert(proxyConfig1.getHttpProxyUrl() === httpUrl, 'HTTP URL should match');
    assert(proxyConfig1.getHttpsProxyUrl() === httpsUrl, 'HTTPS URL should match');
    
    // Test with only HTTP URL
    const proxyConfig2 = new GenericProxyConfig(httpUrl);
    assert(proxyConfig2.getHttpProxyUrl() === httpUrl, 'HTTP URL should match');
    assert(proxyConfig2.getHttpsProxyUrl() === undefined, 'HTTPS URL should be undefined');
    
    // Test with only HTTPS URL
    const proxyConfig3 = new GenericProxyConfig(undefined, httpsUrl);
    assert(proxyConfig3.getHttpProxyUrl() === undefined, 'HTTP URL should be undefined');
    assert(proxyConfig3.getHttpsProxyUrl() === httpsUrl, 'HTTPS URL should match');
    
    console.log('   GenericProxyConfig works correctly');
  });
  
  // Test 2: WebshareProxyConfig
  await runTest('WebshareProxyConfig', () => {
    const username = 'testuser';
    const password = 'testpass';
    
    const proxyConfig = new WebshareProxyConfig(username, password);
    
    // Check HTTP URL
    const httpUrl = proxyConfig.getHttpProxyUrl();
    assert(httpUrl, 'HTTP URL should not be null');
    assert(httpUrl.includes(username), 'HTTP URL should contain username');
    assert(httpUrl.includes(password), 'HTTP URL should contain password');
    assert(httpUrl.startsWith('http://'), 'HTTP URL should start with http://');
    
    // Check HTTPS URL
    const httpsUrl = proxyConfig.getHttpsProxyUrl();
    assert(httpsUrl, 'HTTPS URL should not be null');
    assert(httpsUrl.includes(username), 'HTTPS URL should contain username');
    assert(httpsUrl.includes(password), 'HTTPS URL should contain password');
    assert(httpsUrl.startsWith('http://'), 'HTTPS URL should start with http://');
    
    console.log('   WebshareProxyConfig works correctly');
  });
  
  // Print test summary
  console.log('\n📊 Test Summary:');
  console.log(`   Passed: ${passedTests}`);
  console.log(`   Failed: ${failedTests}`);
  console.log(`   Total: ${passedTests + failedTests}`);
  
  if (failedTests > 0) {
    console.log('\n❌ Some tests failed!');
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed!');
  }
}

// Run the tests
runTests().catch(error => {
  console.error('Error running tests:', error);
  process.exit(1);
});
