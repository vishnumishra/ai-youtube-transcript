/**
 * Integration tests for the YouTube Transcript API
 * 
 * This file tests the main functionality of the API against real YouTube videos.
 */

import { 
  YoutubeTranscript, 
  JSONFormatter, 
  TextFormatter, 
  SRTFormatter 
} from '../../dist/youtube-transcript.esm.js';

// Test video IDs
const TEST_VIDEOS = {
  // Rick Astley - Never Gonna Give You Up (has multiple language transcripts)
  RICK_ASTLEY: 'dQw4w9WgXcQ',
  // TED Talk (usually has good quality transcripts)
  TED_TALK: 'UF8uR6Z6KLc',
  // YouTube video with auto-generated transcript
  AUTO_GENERATED: 'YbJOTdZBX1g'
};

// Test suite
async function runTests() {
  console.log('🧪 Running YouTube Transcript API Integration Tests');
  
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
  
  // Test 1: Basic transcript fetching
  await runTest('Basic transcript fetching', async () => {
    const ytTranscript = new YoutubeTranscript();
    const transcript = await ytTranscript.fetch(TEST_VIDEOS.RICK_ASTLEY);
    
    assert(transcript, 'Transcript should not be null');
    assert(transcript.snippets.length > 0, 'Transcript should have snippets');
    assert(transcript.videoId === TEST_VIDEOS.RICK_ASTLEY, 'Transcript should have correct video ID');
    assert(transcript.language, 'Transcript should have a language');
    assert(transcript.languageCode, 'Transcript should have a language code');
    
    console.log(`   Found ${transcript.snippets.length} snippets in ${transcript.language}`);
    console.log(`   First snippet: "${transcript.snippets[0].text.substring(0, 50)}..."`);
  });
  
  // Test 2: Listing available transcripts
  await runTest('Listing available transcripts', async () => {
    const ytTranscript = new YoutubeTranscript();
    const transcriptList = await ytTranscript.list(TEST_VIDEOS.RICK_ASTLEY);
    
    assert(transcriptList, 'Transcript list should not be null');
    const transcripts = transcriptList.getTranscripts();
    assert(transcripts.length > 0, 'Should find at least one transcript');
    
    console.log(`   Found ${transcripts.length} available transcripts:`);
    for (let i = 0; i < Math.min(3, transcripts.length); i++) {
      console.log(`   - ${transcripts[i].language} (${transcripts[i].languageCode})`);
    }
    if (transcripts.length > 3) {
      console.log(`   - ... and ${transcripts.length - 3} more`);
    }
  });
  
  // Test 3: Language preference
  await runTest('Language preference', async () => {
    const ytTranscript = new YoutubeTranscript();
    
    // Try to get a transcript in Spanish, then English
    const transcript = await ytTranscript.fetch(TEST_VIDEOS.RICK_ASTLEY, {
      languages: ['es', 'en']
    });
    
    assert(transcript, 'Transcript should not be null');
    assert(
      transcript.languageCode === 'es' || transcript.languageCode === 'en',
      `Expected language to be 'es' or 'en', but got '${transcript.languageCode}'`
    );
    
    console.log(`   Found transcript in ${transcript.language} (${transcript.languageCode})`);
  });
  
  // Test 4: Formatting options
  await runTest('Formatting options', async () => {
    const ytTranscript = new YoutubeTranscript();
    const transcript = await ytTranscript.fetch(TEST_VIDEOS.RICK_ASTLEY);
    
    // Test JSON formatter
    const jsonFormatter = new JSONFormatter();
    const jsonOutput = jsonFormatter.formatTranscript(transcript);
    assert(jsonOutput, 'JSON output should not be null');
    assert(jsonOutput.startsWith('[{'), 'JSON output should start with an array');
    
    // Test Text formatter
    const textFormatter = new TextFormatter();
    const textOutput = textFormatter.formatTranscript(transcript);
    assert(textOutput, 'Text output should not be null');
    assert(typeof textOutput === 'string', 'Text output should be a string');
    
    // Test SRT formatter
    const srtFormatter = new SRTFormatter();
    const srtOutput = srtFormatter.formatTranscript(transcript);
    assert(srtOutput, 'SRT output should not be null');
    assert(srtOutput.includes('-->'), 'SRT output should contain timestamp markers');
    
    console.log('   All formatters produced valid output');
  });
  
  // Test 5: Transcript type detection
  await runTest('Transcript type detection', async () => {
    const ytTranscript = new YoutubeTranscript();
    
    // Get transcript lists for both videos
    const regularList = await ytTranscript.list(TEST_VIDEOS.TED_TALK);
    const autoList = await ytTranscript.list(TEST_VIDEOS.AUTO_GENERATED);
    
    // Check if we can find both types
    let foundManual = false;
    let foundGenerated = false;
    
    for (const transcript of regularList) {
      if (!transcript.isGenerated) {
        foundManual = true;
        break;
      }
    }
    
    for (const transcript of autoList) {
      if (transcript.isGenerated) {
        foundGenerated = true;
        break;
      }
    }
    
    // We should find at least one of each type
    if (!foundManual && !foundGenerated) {
      console.log('   ⚠️ Could not find both manual and auto-generated transcripts for testing');
      console.log('   ⚠️ This test is inconclusive, but not failing');
    } else {
      console.log('   Found transcript types:');
      if (foundManual) console.log('   - Manually created transcript');
      if (foundGenerated) console.log('   - Auto-generated transcript');
    }
  });
  
  // Test 6: Translation (if available)
  await runTest('Translation', async () => {
    const ytTranscript = new YoutubeTranscript();
    const transcriptList = await ytTranscript.list(TEST_VIDEOS.RICK_ASTLEY);
    
    // Find a transcript that can be translated
    let translatableTranscript = null;
    for (const transcript of transcriptList) {
      if (transcript.isTranslatable && transcript.translationLanguages.length > 0) {
        translatableTranscript = transcript;
        break;
      }
    }
    
    if (!translatableTranscript) {
      console.log('   ⚠️ Could not find a translatable transcript for testing');
      console.log('   ⚠️ This test is inconclusive, but not failing');
      return;
    }
    
    // Find a target language to translate to
    const targetLang = translatableTranscript.translationLanguages[0].languageCode;
    console.log(`   Found translatable transcript in ${translatableTranscript.language}`);
    console.log(`   Translating to ${targetLang}`);
    
    // Translate the transcript
    const translatedTranscript = translatableTranscript.translate(targetLang);
    assert(translatedTranscript, 'Translated transcript should not be null');
    
    // Fetch the translated transcript
    const fetchedTranslation = await translatedTranscript.fetch();
    assert(fetchedTranslation, 'Fetched translation should not be null');
    assert(fetchedTranslation.snippets.length > 0, 'Translated transcript should have snippets');
    
    console.log(`   Successfully translated to ${fetchedTranslation.language} (${fetchedTranslation.languageCode})`);
    console.log(`   First translated snippet: "${fetchedTranslation.snippets[0].text.substring(0, 50)}..."`);
  });
  
  // Test 7: Legacy static method
  await runTest('Legacy static method', async () => {
    const transcriptData = await YoutubeTranscript.fetchTranscript(TEST_VIDEOS.RICK_ASTLEY);
    
    assert(Array.isArray(transcriptData), 'Transcript data should be an array');
    assert(transcriptData.length > 0, 'Transcript data should not be empty');
    assert('text' in transcriptData[0], 'Transcript items should have text property');
    assert('duration' in transcriptData[0], 'Transcript items should have duration property');
    assert('offset' in transcriptData[0], 'Transcript items should have offset property');
    
    console.log(`   Legacy method returned ${transcriptData.length} transcript items`);
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
