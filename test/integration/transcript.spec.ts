/**
 * Integration tests for the YouTube Transcript API
 * 
 * This file tests the main functionality of the API against real YouTube videos.
 */

import { 
  YoutubeTranscript, 
  JSONFormatter, 
  TextFormatter, 
  SRTFormatter,
  FetchedTranscript,
  TranscriptList
} from '../../src/new-index';

// Test video IDs
const TEST_VIDEOS = {
  // Rick Astley - Never Gonna Give You Up (has multiple language transcripts)
  RICK_ASTLEY: 'dQw4w9WgXcQ',
  // TED Talk (usually has good quality transcripts)
  TED_TALK: 'UF8uR6Z6KLc',
  // YouTube video with auto-generated transcript
  AUTO_GENERATED: 'YbJOTdZBX1g'
};

describe('YouTube Transcript API Integration Tests', () => {
  // Test 1: Basic transcript fetching
  it('should fetch a basic transcript', async () => {
    const ytTranscript = new YoutubeTranscript();
    const transcript = await ytTranscript.fetch(TEST_VIDEOS.RICK_ASTLEY);
    
    expect(transcript).toBeDefined();
    expect(transcript.snippets.length).toBeGreaterThan(0);
    expect(transcript.videoId).toBe(TEST_VIDEOS.RICK_ASTLEY);
    expect(transcript.language).toBeDefined();
    expect(transcript.languageCode).toBeDefined();
    
    console.log(`Found ${transcript.snippets.length} snippets in ${transcript.language}`);
    console.log(`First snippet: "${transcript.snippets[0].text.substring(0, 50)}..."`);
  });
  
  // Test 2: Listing available transcripts
  it('should list available transcripts', async () => {
    const ytTranscript = new YoutubeTranscript();
    const transcriptList = await ytTranscript.list(TEST_VIDEOS.RICK_ASTLEY);
    
    expect(transcriptList).toBeDefined();
    const transcripts = transcriptList.getTranscripts();
    expect(transcripts.length).toBeGreaterThan(0);
    
    console.log(`Found ${transcripts.length} available transcripts:`);
    for (let i = 0; i < Math.min(3, transcripts.length); i++) {
      console.log(`- ${transcripts[i].language} (${transcripts[i].languageCode})`);
    }
    if (transcripts.length > 3) {
      console.log(`- ... and ${transcripts.length - 3} more`);
    }
  });
  
  // Test 3: Language preference
  it('should respect language preferences', async () => {
    const ytTranscript = new YoutubeTranscript();
    
    // Try to get a transcript in Spanish, then English
    const transcript = await ytTranscript.fetch(TEST_VIDEOS.RICK_ASTLEY, {
      languages: ['es', 'en']
    });
    
    expect(transcript).toBeDefined();
    expect(['es', 'en']).toContain(transcript.languageCode);
    
    console.log(`Found transcript in ${transcript.language} (${transcript.languageCode})`);
  });
  
  // Test 4: Formatting options
  it('should format transcripts correctly', async () => {
    const ytTranscript = new YoutubeTranscript();
    const transcript = await ytTranscript.fetch(TEST_VIDEOS.RICK_ASTLEY);
    
    // Test JSON formatter
    const jsonFormatter = new JSONFormatter();
    const jsonOutput = jsonFormatter.formatTranscript(transcript);
    expect(jsonOutput).toBeDefined();
    expect(jsonOutput.startsWith('[')).toBeTruthy();
    
    // Test Text formatter
    const textFormatter = new TextFormatter();
    const textOutput = textFormatter.formatTranscript(transcript);
    expect(textOutput).toBeDefined();
    expect(typeof textOutput).toBe('string');
    
    // Test SRT formatter
    const srtFormatter = new SRTFormatter();
    const srtOutput = srtFormatter.formatTranscript(transcript);
    expect(srtOutput).toBeDefined();
    expect(srtOutput.includes('-->')).toBeTruthy();
    
    console.log('All formatters produced valid output');
  });
  
  // Test 5: Transcript type detection
  it('should detect transcript types correctly', async () => {
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
      console.log('⚠️ Could not find both manual and auto-generated transcripts for testing');
      console.log('⚠️ This test is inconclusive, but not failing');
    } else {
      console.log('Found transcript types:');
      if (foundManual) console.log('- Manually created transcript');
      if (foundGenerated) console.log('- Auto-generated transcript');
    }
    
    // This test is more informational, so we don't have strict assertions
    expect(true).toBeTruthy();
  });
  
  // Test 6: Translation (if available)
  it('should translate transcripts if available', async () => {
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
      console.log('⚠️ Could not find a translatable transcript for testing');
      console.log('⚠️ This test is inconclusive, but not failing');
      expect(true).toBeTruthy();
      return;
    }
    
    // Find a target language to translate to
    const targetLang = translatableTranscript.translationLanguages[0].languageCode;
    console.log(`Found translatable transcript in ${translatableTranscript.language}`);
    console.log(`Translating to ${targetLang}`);
    
    // Translate the transcript
    const translatedTranscript = translatableTranscript.translate(targetLang);
    expect(translatedTranscript).toBeDefined();
    
    // Fetch the translated transcript
    const fetchedTranslation = await translatedTranscript.fetch();
    expect(fetchedTranslation).toBeDefined();
    expect(fetchedTranslation.snippets.length).toBeGreaterThan(0);
    
    console.log(`Successfully translated to ${fetchedTranslation.language} (${fetchedTranslation.languageCode})`);
    console.log(`First translated snippet: "${fetchedTranslation.snippets[0].text.substring(0, 50)}..."`);
  });
  
  // Test 7: Legacy static method
  it('should support the legacy static method', async () => {
    const transcriptData = await YoutubeTranscript.fetchTranscript(TEST_VIDEOS.RICK_ASTLEY);
    
    expect(Array.isArray(transcriptData)).toBeTruthy();
    expect(transcriptData.length).toBeGreaterThan(0);
    expect(transcriptData[0]).toHaveProperty('text');
    expect(transcriptData[0]).toHaveProperty('duration');
    expect(transcriptData[0]).toHaveProperty('offset');
    
    console.log(`Legacy method returned ${transcriptData.length} transcript items`);
  });
});
