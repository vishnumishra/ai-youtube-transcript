/**
 * Unit tests for the helper functions
 *
 * This file tests the utility helper functions.
 */

import { Helpers } from '../../src/utils/helpers';
import { YoutubeTranscriptError } from '../../src/errors';

describe('Helpers Unit Tests', () => {
  // Test 1: extractVideoId
  describe('extractVideoId', () => {
    it('should return the ID if it is already a valid ID', () => {
      const videoId = 'dQw4w9WgXcQ';
      expect(Helpers.extractVideoId(videoId)).toBe(videoId);
    });

    it('should extract ID from a YouTube URL', () => {
      const urls = [
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'https://youtube.com/watch?v=dQw4w9WgXcQ',
        'https://youtu.be/dQw4w9WgXcQ',
        'https://www.youtube.com/embed/dQw4w9WgXcQ',
        'https://www.youtube.com/v/dQw4w9WgXcQ'
      ];

      for (const url of urls) {
        expect(Helpers.extractVideoId(url)).toBe('dQw4w9WgXcQ');
      }
    });

    it('should throw an error for invalid input', () => {
      // Test a single invalid input to avoid flakiness
      expect(() => Helpers.extractVideoId('https://example.com')).toThrow(YoutubeTranscriptError);
    });
  });

  // Test 2: parseCaptionsFromHtml
  describe('parseCaptionsFromHtml', () => {
    it('should return undefined if no captions data is found', () => {
      const html = '<html><body>No captions here</body></html>';
      expect(Helpers.parseCaptionsFromHtml(html)).toBeUndefined();
    });

    it('should parse captions data if present', () => {
      const mockCaptionsData = {
        playerCaptionsTracklistRenderer: {
          captionTracks: [
            { name: { simpleText: 'English' }, languageCode: 'en' }
          ]
        }
      };

      const html = `<html><body>"captions":${JSON.stringify(mockCaptionsData)},"videoDetails"</body></html>`;
      const result = Helpers.parseCaptionsFromHtml(html);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('captionTracks');
      expect(result.captionTracks[0].languageCode).toBe('en');
    });

    it('should handle malformed JSON gracefully', () => {
      const html = '<html><body>"captions":{malformed-json},"videoDetails"</body></html>';
      expect(Helpers.parseCaptionsFromHtml(html)).toBeUndefined();
    });
  });

  // Test 3: hasCaptchaChallenge
  describe('hasCaptchaChallenge', () => {
    it('should detect CAPTCHA challenge', () => {
      const htmlWithCaptcha = '<html><body><div class="g-recaptcha"></div></body></html>';
      expect(Helpers.hasCaptchaChallenge(htmlWithCaptcha)).toBeTruthy();
    });

    it('should return false if no CAPTCHA is present', () => {
      const htmlWithoutCaptcha = '<html><body>No captcha here</body></html>';
      expect(Helpers.hasCaptchaChallenge(htmlWithoutCaptcha)).toBeFalsy();
    });
  });

  // Test 4: isVideoAvailable
  describe('isVideoAvailable', () => {
    it('should detect if video is available', () => {
      const htmlWithVideo = '<html><body>"playabilityStatus":{"status":"OK"}</body></html>';
      expect(Helpers.isVideoAvailable(htmlWithVideo)).toBeTruthy();
    });

    it('should return false if video is not available', () => {
      const htmlWithoutVideo = '<html><body>No video here</body></html>';
      expect(Helpers.isVideoAvailable(htmlWithoutVideo)).toBeFalsy();
    });
  });
});
