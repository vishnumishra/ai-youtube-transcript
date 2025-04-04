import {
  YoutubeTranscriptTooManyRequestError,
  YoutubeTranscriptVideoUnavailableError,
  YoutubeTranscriptDisabledError,
  YoutubeTranscriptNotAvailableError
} from './errors';

import { TranscriptConfig, TranscriptResponse, CaptionTrack, LanguageInfo } from './models/interfaces';
import { Transcript, TranscriptList, FetchedTranscript } from './models/transcript';
// Constants are used in the Transcript class
import { Helpers } from './utils/helpers';
import { HttpClient } from './utils/http-client';
import { ProxyConfig } from './proxies/proxy-config';

/**
 * Main class for retrieving YouTube transcripts
 */
export class YoutubeTranscript {
  private httpClient: HttpClient;

  /**
   * Legacy static method for backward compatibility
   *
   * @param videoId - Video URL or video identifier
   * @param config - Configuration options
   * @deprecated Use the instance method instead
   */
  public static async fetchTranscript(
    videoId: string,
    config?: TranscriptConfig
  ): Promise<TranscriptResponse[]> {
    const instance = new YoutubeTranscript();
    const transcript = await instance.fetch(videoId, config);
    return transcript.toRawData();
  }

  /**
   * Creates a new YoutubeTranscript instance
   *
   * @param cookiePath - Path to a cookies.txt file for authentication
   * @param proxyConfig - Proxy configuration for handling IP bans
   */
  constructor(
    cookiePath?: string,
    proxyConfig?: ProxyConfig
  ) {
    this.httpClient = new HttpClient(cookiePath, proxyConfig);
  }

  /**
   * Fetch transcript from a YouTube video
   *
   * @param videoId - Video URL or video identifier
   * @param config - Configuration options
   */
  public async fetch(
    videoId: string,
    config?: TranscriptConfig
  ): Promise<FetchedTranscript> {
    const identifier = Helpers.extractVideoId(videoId);
    const languages = this.getLanguagesFromConfig(config);

    // Get the list of available transcripts
    const transcriptList = await this.list(identifier);

    // Find the transcript in the requested languages
    const transcript = transcriptList.findTranscript(languages);

    // Fetch the transcript data
    return transcript.fetch(config?.preserveFormatting);
  }

  /**
   * List all available transcripts for a video
   *
   * @param videoId - Video URL or video identifier
   */
  public async list(videoId: string): Promise<TranscriptList> {
    const identifier = Helpers.extractVideoId(videoId);

    // Fetch the video page
    const videoPageResponse = await this.httpClient.fetch(
      `https://www.youtube.com/watch?v=${identifier}`
    );

    const videoPageBody = await videoPageResponse.text();

    // Check for errors
    if (Helpers.hasCaptchaChallenge(videoPageBody)) {
      throw new YoutubeTranscriptTooManyRequestError();
    }

    if (!Helpers.isVideoAvailable(videoPageBody)) {
      throw new YoutubeTranscriptVideoUnavailableError(identifier);
    }

    // Parse captions data
    const captions = Helpers.parseCaptionsFromHtml(videoPageBody);

    if (!captions) {
      throw new YoutubeTranscriptDisabledError(identifier);
    }

    if (!('captionTracks' in captions)) {
      throw new YoutubeTranscriptNotAvailableError(identifier);
    }

    // Create transcript objects for each caption track
    const transcripts = captions.captionTracks.map((track: CaptionTrack) => {
      // Parse translation languages
      const translationLanguages: LanguageInfo[] = track.translationLanguages
        ? track.translationLanguages.map(lang => ({
            languageCode: lang.languageCode,
            languageName: lang.languageName.simpleText
          }))
        : [];

      return new Transcript(
        identifier,
        track.name.simpleText,
        track.languageCode,
        track.kind === 'asr', // 'asr' means auto-generated
        !!track.isTranslatable,
        translationLanguages,
        track.baseUrl,
        this.httpClient
      );
    });

    return new TranscriptList(transcripts, identifier);
  }

  /**
   * Get languages from config, handling both new and legacy formats
   *
   * @param config - The transcript configuration
   */
  private getLanguagesFromConfig(config?: TranscriptConfig): string[] {
    if (!config) {
      return ['en']; // Default to English
    }

    if (config.languages && config.languages.length > 0) {
      return config.languages;
    }

    if (config.lang) {
      return [config.lang];
    }

    return ['en'];
  }
}
