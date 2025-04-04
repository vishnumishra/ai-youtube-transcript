/**
 * Unit tests for the formatters
 * 
 * This file tests the formatter classes with mock data.
 */

import { 
  JSONFormatter, 
  TextFormatter, 
  SRTFormatter,
  FetchedTranscript
} from '../../src/new-index';

describe('Formatter Unit Tests', () => {
  // Mock transcript data
  let mockTranscript: any;
  
  beforeEach(() => {
    mockTranscript = {
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
        return this.snippets.map((snippet: any) => ({
          text: snippet.text,
          offset: snippet.start,
          duration: snippet.duration,
          lang: this.languageCode,
          isGenerated: this.isGenerated
        }));
      },
      getText: function() {
        return this.snippets.map((snippet: any) => snippet.text).join(' ');
      },
      length: 3
    };
    
    // Mock implementation of Symbol.iterator
    mockTranscript[Symbol.iterator] = function* () {
      for (const snippet of this.snippets) {
        yield snippet;
      }
    };
  });
  
  // Test 1: JSONFormatter
  describe('JSONFormatter', () => {
    it('should format a single transcript correctly', () => {
      const formatter = new JSONFormatter();
      
      // Test single transcript formatting
      const jsonOutput = formatter.formatTranscript(mockTranscript);
      expect(jsonOutput).toBeDefined();
      
      // Parse the output to verify it's valid JSON
      const parsed = JSON.parse(jsonOutput);
      expect(Array.isArray(parsed)).toBeTruthy();
      expect(parsed.length).toBe(mockTranscript.snippets.length);
      
      // Check the content
      expect(parsed[0].text).toBe('First snippet');
      expect(parsed[0].offset).toBe(0.0);
      expect(parsed[0].duration).toBe(2.5);
    });
    
    it('should format with indentation when specified', () => {
      const formatter = new JSONFormatter();
      const prettyOutput = formatter.formatTranscript(mockTranscript, { indent: 2 });
      expect(prettyOutput.includes('\n  ')).toBeTruthy();
    });
    
    it('should format multiple transcripts correctly', () => {
      const formatter = new JSONFormatter();
      const multiOutput = formatter.formatTranscripts([mockTranscript, mockTranscript]);
      const multiParsed = JSON.parse(multiOutput);
      expect(Array.isArray(multiParsed)).toBeTruthy();
      expect(multiParsed.length).toBe(2);
    });
  });
  
  // Test 2: TextFormatter
  describe('TextFormatter', () => {
    it('should format a single transcript correctly', () => {
      const formatter = new TextFormatter();
      
      // Test single transcript formatting
      const textOutput = formatter.formatTranscript(mockTranscript);
      expect(textOutput).toBeDefined();
      expect(typeof textOutput).toBe('string');
      
      // Check content
      expect(textOutput.includes('First snippet')).toBeTruthy();
      expect(textOutput.includes('Second snippet')).toBeTruthy();
      expect(textOutput.includes('Third snippet')).toBeTruthy();
    });
    
    it('should format multiple transcripts correctly', () => {
      const formatter = new TextFormatter();
      const multiOutput = formatter.formatTranscripts([mockTranscript, mockTranscript]);
      expect(multiOutput.includes('test123')).toBeTruthy();
      expect(multiOutput.includes('English')).toBeTruthy();
    });
  });
  
  // Test 3: SRTFormatter
  describe('SRTFormatter', () => {
    it('should format a single transcript correctly', () => {
      const formatter = new SRTFormatter();
      
      // Test single transcript formatting
      const srtOutput = formatter.formatTranscript(mockTranscript);
      expect(srtOutput).toBeDefined();
      
      // Check format
      expect(srtOutput.includes('1')).toBeTruthy();
      expect(srtOutput.includes('-->')).toBeTruthy();
      expect(srtOutput.includes('00:00:00')).toBeTruthy();
      expect(srtOutput.includes('First snippet')).toBeTruthy();
    });
    
    it('should format multiple transcripts correctly', () => {
      const formatter = new SRTFormatter();
      const multiOutput = formatter.formatTranscripts([mockTranscript, mockTranscript]);
      expect(multiOutput.includes('WEBVTT')).toBeTruthy();
      expect(multiOutput.includes('test123')).toBeTruthy();
    });
  });
});
