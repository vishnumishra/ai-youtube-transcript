/**
 * Configuration options for fetching transcripts
 */
export interface TranscriptConfig {
  /**
   * List of language codes in order of preference
   */
  languages?: string[];
  
  /**
   * Single language code (for backward compatibility)
   */
  lang?: string;
  
  /**
   * Whether to preserve HTML formatting in the transcript
   */
  preserveFormatting?: boolean;
}

/**
 * Response format for transcript data
 */
export interface TranscriptResponse {
  /**
   * The text content of the transcript segment
   */
  text: string;
  
  /**
   * Duration of the segment in seconds
   */
  duration: number;
  
  /**
   * Start time of the segment in seconds
   */
  offset: number;
  
  /**
   * Language code of the transcript
   */
  lang?: string;
  
  /**
   * Whether the transcript was automatically generated
   */
  isGenerated?: boolean;
}

/**
 * A single snippet from a fetched transcript
 */
export interface TranscriptSnippet {
  /**
   * The text content of the snippet
   */
  text: string;
  
  /**
   * Start time of the snippet in seconds
   */
  start: number;
  
  /**
   * Duration of the snippet in seconds
   */
  duration: number;
}

/**
 * Information about a language
 */
export interface LanguageInfo {
  /**
   * The language code (e.g., 'en', 'fr')
   */
  languageCode: string;
  
  /**
   * The language name (e.g., 'English', 'French')
   */
  languageName: string;
}

/**
 * Configuration for HTTP client
 */
export interface HttpClientConfig {
  /**
   * Path to cookies file for authentication
   */
  cookiePath?: string;
  
  /**
   * Proxy configuration
   */
  proxyConfig?: any;
}

/**
 * YouTube caption track information
 */
export interface CaptionTrack {
  /**
   * Base URL for the transcript
   */
  baseUrl: string;
  
  /**
   * Language code of the track
   */
  languageCode: string;
  
  /**
   * Display name of the language
   */
  name: {
    simpleText: string;
  };
  
  /**
   * Whether the track is auto-generated
   */
  kind?: string;
  
  /**
   * Whether the track is translatable
   */
  isTranslatable?: boolean;
  
  /**
   * Available translation languages
   */
  translationLanguages?: {
    languageCode: string;
    languageName: {
      simpleText: string;
    };
  }[];
}
