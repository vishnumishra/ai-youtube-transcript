/**
 * Unit tests for the formatters
 * 
 * This file tests the formatter classes with mock data.
 */

import { 
  JSONFormatter, 
  TextFormatter, 
  SRTFormatter 
} from '../../dist/youtube-transcript.esm.js';

// Mock transcript data
const mockTranscript = {
  snippets: [
    { text: 'First snippet', start: 0.0, duration: 2.5 },
    { text: 'Second snippet', start: 2.5, duration: 3.0 },
    { text: 'Third snippet', start: 5.5, duration: 2.0 }
  ],
  videoId: 'test123',
  language: 'English',
  languageCode: 'en',
  isGenerated: false,
  toRawData: function() {
    return this.snippets.map(snippet => ({
      text: snippet.text,
      offset: snippet.start,
      duration: snippet.duration,
      lang: this.languageCode,
      isGenerated: this.isGenerated
    }));
  },
  getText: function() {
    return this.snippets.map(snippet => snippet.text).join(' ');
  },
  length: 3
};

// Mock implementation of Symbol.iterator
mockTranscript[Symbol.iterator] = function* () {
  for (const snippet of this.snippets) {
    yield snippet;
  }
};

// Test suite
async function runTests() {
  console.log('🧪 Running Formatter Unit Tests');
  
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
  
  // Test 1: JSONFormatter
  await runTest('JSONFormatter', () => {
    const formatter = new JSONFormatter();
    
    // Test single transcript formatting
    const jsonOutput = formatter.formatTranscript(mockTranscript);
    assert(jsonOutput, 'JSON output should not be null');
    
    // Parse the output to verify it's valid JSON
    const parsed = JSON.parse(jsonOutput);
    assert(Array.isArray(parsed), 'Parsed JSON should be an array');
    assert(parsed.length === mockTranscript.snippets.length, 'JSON should contain all snippets');
    
    // Check the content
    assert(parsed[0].text === 'First snippet', 'First item should have correct text');
    assert(parsed[0].offset === 0.0, 'First item should have correct offset');
    assert(parsed[0].duration === 2.5, 'First item should have correct duration');
    
    // Test with indent option
    const prettyOutput = formatter.formatTranscript(mockTranscript, { indent: 2 });
    assert(prettyOutput.includes('\n  '), 'Pretty output should have indentation');
    
    // Test multiple transcripts formatting
    const multiOutput = formatter.formatTranscripts([mockTranscript, mockTranscript]);
    const multiParsed = JSON.parse(multiOutput);
    assert(Array.isArray(multiParsed), 'Multi output should be an array');
    assert(multiParsed.length === 2, 'Multi output should contain both transcripts');
    
    console.log('   JSONFormatter produced valid output');
  });
  
  // Test 2: TextFormatter
  await runTest('TextFormatter', () => {
    const formatter = new TextFormatter();
    
    // Test single transcript formatting
    const textOutput = formatter.formatTranscript(mockTranscript);
    assert(textOutput, 'Text output should not be null');
    assert(typeof textOutput === 'string', 'Text output should be a string');
    
    // Check content
    assert(textOutput.includes('First snippet'), 'Output should contain first snippet');
    assert(textOutput.includes('Second snippet'), 'Output should contain second snippet');
    assert(textOutput.includes('Third snippet'), 'Output should contain third snippet');
    
    // Test multiple transcripts formatting
    const multiOutput = formatter.formatTranscripts([mockTranscript, mockTranscript]);
    assert(multiOutput.includes('test123'), 'Multi output should contain video ID');
    assert(multiOutput.includes('English'), 'Multi output should contain language');
    
    console.log('   TextFormatter produced valid output');
  });
  
  // Test 3: SRTFormatter
  await runTest('SRTFormatter', () => {
    const formatter = new SRTFormatter();
    
    // Test single transcript formatting
    const srtOutput = formatter.formatTranscript(mockTranscript);
    assert(srtOutput, 'SRT output should not be null');
    
    // Check format
    assert(srtOutput.includes('1'), 'Output should contain sequence number');
    assert(srtOutput.includes('-->'), 'Output should contain timestamp marker');
    assert(srtOutput.includes('00:00:00'), 'Output should contain formatted time');
    assert(srtOutput.includes('First snippet'), 'Output should contain first snippet');
    
    // Test multiple transcripts formatting
    const multiOutput = formatter.formatTranscripts([mockTranscript, mockTranscript]);
    assert(multiOutput.includes('WEBVTT'), 'Multi output should contain WEBVTT header');
    assert(multiOutput.includes('test123'), 'Multi output should contain video ID');
    
    console.log('   SRTFormatter produced valid output');
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
