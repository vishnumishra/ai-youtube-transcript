import {
  YoutubeTranscriptError,
  YoutubeTranscriptTooManyRequestError,
  YoutubeTranscriptVideoUnavailableError,
  YoutubeTranscriptDisabledError,
  YoutubeTranscriptNotAvailableError
} from './errors';

import { TranscriptConfig, TranscriptResponse, CaptionTrack, LanguageInfo } from './models/interfaces';
import { Transcript, TranscriptList, FetchedTranscript } from './models/transcript';
import { Constants } from './utils/constants';
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
   * List all available transcripts for a video using the player endpoint (like Python library)
   *
   * @param videoId - Video URL or video identifier
   */
  public async list(videoId: string): Promise<TranscriptList> {
    const identifier = Helpers.extractVideoId(videoId);

    try {
      // Step 1: Get the video page to extract API key
      const videoPageResponse = await this.httpClient.fetch(
        `https://www.youtube.com/watch?v=${identifier}`
      );
      const videoPageHtml = await videoPageResponse.text();
      
      // Check for errors
      if (Helpers.hasCaptchaChallenge(videoPageHtml)) {
        throw new YoutubeTranscriptTooManyRequestError();
      }

      if (!Helpers.isVideoAvailable(videoPageHtml)) {
        throw new YoutubeTranscriptVideoUnavailableError(identifier);
      }

      // Step 2: Extract API key
      const apiKey = Helpers.extractApiKey(videoPageHtml);
      if (!apiKey) {
        throw new YoutubeTranscriptError('Could not extract YouTube API key');
      }

      // Step 3: Fetch player data using the player endpoint
      const playerRequestBody = Helpers.createPlayerRequestBody(identifier);
      const playerResponse = await this.httpClient.fetch(
        `${Constants.YOUTUBEI_PLAYER_API}?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(playerRequestBody)
        }
      );

      if (!playerResponse.ok) {
        throw new YoutubeTranscriptNotAvailableError(identifier);
      }

      const playerData = await playerResponse.json();

      // Step 4: Extract captions from player response
      const captions = this.extractCaptionsFromPlayerData(playerData, identifier);

      // Step 5: Parse global translation languages (if available)
      let globalTranslationLanguages: LanguageInfo[] = [];
      if (captions.translationLanguages) {
        globalTranslationLanguages = captions.translationLanguages.map((lang: any) => {
          const langName = lang.languageName as any;
          const languageName = langName?.runs?.[0]?.text || langName?.simpleText || lang.languageCode;
          return {
            languageCode: lang.languageCode,
            languageName: languageName
          };
        });
      }

      // Step 6: Create transcript objects for each caption track
      const transcripts = captions.captionTracks.map((track: CaptionTrack) => {
        // Use track-specific translation languages if available, otherwise use global ones
        const translationLanguages: LanguageInfo[] = track.translationLanguages
          ? track.translationLanguages.map(lang => {
              const langName = lang.languageName as any;
              const languageName = langName?.runs?.[0]?.text || langName?.simpleText || lang.languageCode;
              return {
                languageCode: lang.languageCode,
                languageName: languageName
              };
            })
          : globalTranslationLanguages;

        // Extract language name from the correct format (handle both formats)
        const trackName = track.name as any;
        const languageName = trackName?.runs?.[0]?.text || trackName?.simpleText || track.languageCode;

        return new Transcript(
          identifier,
          languageName,
        track.languageCode,
        track.kind === 'asr', // 'asr' means auto-generated
        !!track.isTranslatable,
        translationLanguages,
        track.baseUrl,
        this.httpClient
      );
    });

      return new TranscriptList(transcripts, identifier);
    } catch (error) {
      // If player API fails, throw appropriate error
      if (error instanceof YoutubeTranscriptError) {
        throw error;
      }
      throw new YoutubeTranscriptNotAvailableError(identifier);
    }
  }

  /**
   * Extract captions data from player API response (like Python library)
   */
  private extractCaptionsFromPlayerData(playerData: any, videoId: string): any {
    // Check playability status
    const playabilityStatus = playerData.playabilityStatus;
    if (playabilityStatus?.status !== 'OK') {
      const reason = playabilityStatus?.reason;
      if (reason === 'Sign in to confirm you\'re not a bot') {
        throw new YoutubeTranscriptTooManyRequestError();
      }
      if (reason === 'This video may be inappropriate for some users.') {
        throw new YoutubeTranscriptVideoUnavailableError(videoId);
      }
      if (reason === 'This video is unavailable') {
        throw new YoutubeTranscriptVideoUnavailableError(videoId);
      }
      throw new YoutubeTranscriptVideoUnavailableError(videoId);
    }

    // Extract captions from player response
    const captions = playerData.captions?.playerCaptionsTracklistRenderer;
    if (!captions || !captions.captionTracks) {
      throw new YoutubeTranscriptDisabledError(videoId);
    }

    return captions;
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
