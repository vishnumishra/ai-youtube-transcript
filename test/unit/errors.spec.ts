/**
 * Unit tests for the error classes
 * 
 * This file tests the custom error classes.
 */

import {
  YoutubeTranscriptError,
  YoutubeTranscriptTooManyRequestError,
  YoutubeTranscriptVideoUnavailableError,
  YoutubeTranscriptDisabledError,
  YoutubeTranscriptNotAvailableError,
  YoutubeTranscriptNotAvailableLanguageError,
  YoutubeTranscriptTranslationError,
  YoutubeTranscriptRequestBlockedError,
  YoutubeTranscriptIpBlockedError
} from '../../src/errors';

describe('Error Classes Unit Tests', () => {
  // Test 1: Base error class
  describe('YoutubeTranscriptError', () => {
    it('should create an error with the correct message', () => {
      const message = 'Test error message';
      const error = new YoutubeTranscriptError(message);
      
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('YoutubeTranscriptError');
      expect(error.message).toContain(message);
      expect(error.message).toContain('[YoutubeTranscript]');
    });
  });
  
  // Test 2: Too many requests error
  describe('YoutubeTranscriptTooManyRequestError', () => {
    it('should create an error with the correct message', () => {
      const error = new YoutubeTranscriptTooManyRequestError();
      
      expect(error).toBeInstanceOf(YoutubeTranscriptError);
      expect(error.name).toBe('YoutubeTranscriptTooManyRequestError');
      expect(error.message).toContain('too many requests');
      expect(error.message).toContain('captcha');
    });
  });
  
  // Test 3: Video unavailable error
  describe('YoutubeTranscriptVideoUnavailableError', () => {
    it('should create an error with the correct message and include the video ID', () => {
      const videoId = 'test123';
      const error = new YoutubeTranscriptVideoUnavailableError(videoId);
      
      expect(error).toBeInstanceOf(YoutubeTranscriptError);
      expect(error.name).toBe('YoutubeTranscriptVideoUnavailableError');
      expect(error.message).toContain('no longer available');
      expect(error.message).toContain(videoId);
    });
  });
  
  // Test 4: Transcript disabled error
  describe('YoutubeTranscriptDisabledError', () => {
    it('should create an error with the correct message and include the video ID', () => {
      const videoId = 'test123';
      const error = new YoutubeTranscriptDisabledError(videoId);
      
      expect(error).toBeInstanceOf(YoutubeTranscriptError);
      expect(error.name).toBe('YoutubeTranscriptDisabledError');
      expect(error.message).toContain('disabled');
      expect(error.message).toContain(videoId);
    });
  });
  
  // Test 5: Transcript not available error
  describe('YoutubeTranscriptNotAvailableError', () => {
    it('should create an error with the correct message and include the video ID', () => {
      const videoId = 'test123';
      const error = new YoutubeTranscriptNotAvailableError(videoId);
      
      expect(error).toBeInstanceOf(YoutubeTranscriptError);
      expect(error.name).toBe('YoutubeTranscriptNotAvailableError');
      expect(error.message).toContain('No transcripts are available');
      expect(error.message).toContain(videoId);
    });
  });
  
  // Test 6: Language not available error
  describe('YoutubeTranscriptNotAvailableLanguageError', () => {
    it('should create an error with the correct message and include the language, available languages, and video ID', () => {
      const lang = 'fr';
      const availableLangs = ['en', 'es', 'de'];
      const videoId = 'test123';
      const error = new YoutubeTranscriptNotAvailableLanguageError(lang, availableLangs, videoId);
      
      expect(error).toBeInstanceOf(YoutubeTranscriptError);
      expect(error.name).toBe('YoutubeTranscriptNotAvailableLanguageError');
      expect(error.message).toContain(lang);
      expect(error.message).toContain(videoId);
      for (const availableLang of availableLangs) {
        expect(error.message).toContain(availableLang);
      }
    });
  });
  
  // Test 7: Translation error
  describe('YoutubeTranscriptTranslationError', () => {
    it('should create an error with the correct message', () => {
      const message = 'Translation failed';
      const error = new YoutubeTranscriptTranslationError(message);
      
      expect(error).toBeInstanceOf(YoutubeTranscriptError);
      expect(error.name).toBe('YoutubeTranscriptTranslationError');
      expect(error.message).toContain(message);
    });
  });
  
  // Test 8: Request blocked error
  describe('YoutubeTranscriptRequestBlockedError', () => {
    it('should create an error with the correct message', () => {
      const error = new YoutubeTranscriptRequestBlockedError();
      
      expect(error).toBeInstanceOf(YoutubeTranscriptError);
      expect(error.name).toBe('YoutubeTranscriptRequestBlockedError');
      expect(error.message).toContain('blocked');
    });
  });
  
  // Test 9: IP blocked error
  describe('YoutubeTranscriptIpBlockedError', () => {
    it('should create an error with the correct message', () => {
      const error = new YoutubeTranscriptIpBlockedError();
      
      expect(error).toBeInstanceOf(YoutubeTranscriptError);
      expect(error.name).toBe('YoutubeTranscriptIpBlockedError');
      expect(error.message).toContain('IP');
      expect(error.message).toContain('blocked');
    });
  });
});
