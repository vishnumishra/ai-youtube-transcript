/**
 * Base error class for YouTube transcript errors
 */
export class YoutubeTranscriptError extends Error {
  constructor(message: string) {
    super(`[YoutubeTranscript] 🚨 ${message}`);
    this.name = 'YoutubeTranscriptError';
  }
}

/**
 * Error thrown when YouTube is receiving too many requests
 */
export class YoutubeTranscriptTooManyRequestError extends YoutubeTranscriptError {
  constructor() {
    super(
      'YouTube is receiving too many requests from this IP and now requires solving a captcha to continue'
    );
    this.name = 'YoutubeTranscriptTooManyRequestError';
  }
}

/**
 * Error thrown when the video is no longer available
 */
export class YoutubeTranscriptVideoUnavailableError extends YoutubeTranscriptError {
  constructor(videoId: string) {
    super(`The video is no longer available (${videoId})`);
    this.name = 'YoutubeTranscriptVideoUnavailableError';
  }
}

/**
 * Error thrown when transcript is disabled on the video
 */
export class YoutubeTranscriptDisabledError extends YoutubeTranscriptError {
  constructor(videoId: string) {
    super(`Transcript is disabled on this video (${videoId})`);
    this.name = 'YoutubeTranscriptDisabledError';
  }
}

/**
 * Error thrown when no transcripts are available for the video
 */
export class YoutubeTranscriptNotAvailableError extends YoutubeTranscriptError {
  constructor(videoId: string) {
    super(`No transcripts are available for this video (${videoId})`);
    this.name = 'YoutubeTranscriptNotAvailableError';
  }
}

/**
 * Error thrown when no transcripts are available in the requested language
 */
export class YoutubeTranscriptNotAvailableLanguageError extends YoutubeTranscriptError {
  constructor(lang: string, availableLangs: string[], videoId: string) {
    super(
      `No transcripts are available in ${lang} for this video (${videoId}). Available languages: ${availableLangs.join(
        ', '
      )}`
    );
    this.name = 'YoutubeTranscriptNotAvailableLanguageError';
  }
}

/**
 * Error thrown when the transcript cannot be translated
 */
export class YoutubeTranscriptTranslationError extends YoutubeTranscriptError {
  constructor(message: string) {
    super(message);
    this.name = 'YoutubeTranscriptTranslationError';
  }
}

/**
 * Error thrown when the request is blocked by YouTube
 */
export class YoutubeTranscriptRequestBlockedError extends YoutubeTranscriptError {
  constructor() {
    super('The request was blocked by YouTube');
    this.name = 'YoutubeTranscriptRequestBlockedError';
  }
}

/**
 * Error thrown when the IP is blocked by YouTube
 */
export class YoutubeTranscriptIpBlockedError extends YoutubeTranscriptError {
  constructor() {
    super('Your IP has been blocked by YouTube');
    this.name = 'YoutubeTranscriptIpBlockedError';
  }
}
