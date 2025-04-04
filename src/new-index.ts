// Export the main class
export { YoutubeTranscript } from './youtube-transcript';

// For backward compatibility
export * from './index';

// Export errors
export {
  YoutubeTranscriptError,
  YoutubeTranscriptTooManyRequestError,
  YoutubeTranscriptVideoUnavailableError,
  YoutubeTranscriptDisabledError,
  YoutubeTranscriptNotAvailableError,
  YoutubeTranscriptNotAvailableLanguageError,
  YoutubeTranscriptTranslationError,
  YoutubeTranscriptRequestBlockedError,
  YoutubeTranscriptIpBlockedError
} from './errors';

// Export models
export {
  TranscriptConfig,
  TranscriptResponse,
  TranscriptSnippet,
  LanguageInfo,
  CaptionTrack
} from './models/interfaces';

export {
  Transcript,
  TranscriptList,
  FetchedTranscript
} from './models/transcript';

// Export formatters
export {
  Formatter
} from './formatters/formatter';

export {
  JSONFormatter
} from './formatters/json-formatter';

export {
  TextFormatter
} from './formatters/text-formatter';

export {
  SRTFormatter
} from './formatters/srt-formatter';

// Export proxies
export {
  ProxyConfig,
  GenericProxyConfig
} from './proxies/proxy-config';

export {
  WebshareProxyConfig
} from './proxies/webshare-proxy';
