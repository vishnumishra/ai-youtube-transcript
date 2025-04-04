const RE_YOUTUBE =
  /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.83 Safari/537.36,gzip(gfe)';
const RE_XML_TRANSCRIPT =
  /<text start="([^"]*)" dur="([^"]*)">([^<]*)<\/text>/g;

export class YoutubeTranscriptError extends Error {
  constructor(message) {
    super(`[YoutubeTranscript] 🚨 ${message}`);
  }
}

export class YoutubeTranscriptTooManyRequestError extends YoutubeTranscriptError {
  constructor() {
    super(
      'YouTube is receiving too many requests from this IP and now requires solving a captcha to continue'
    );
  }
}

export class YoutubeTranscriptVideoUnavailableError extends YoutubeTranscriptError {
  constructor(videoId: string) {
    super(`The video is no longer available (${videoId})`);
  }
}

export class YoutubeTranscriptDisabledError extends YoutubeTranscriptError {
  constructor(videoId: string) {
    super(`Transcript is disabled on this video (${videoId})`);
  }
}

export class YoutubeTranscriptNotAvailableError extends YoutubeTranscriptError {
  constructor(videoId: string) {
    super(`No transcripts are available for this video (${videoId})`);
  }
}

export class YoutubeTranscriptNotAvailableLanguageError extends YoutubeTranscriptError {
  constructor(lang: string, availableLangs: string[], videoId: string) {
    super(
      `No transcripts are available in ${lang} this video (${videoId}). Available languages: ${availableLangs.join(
        ', '
      )}`
    );
  }
}

export interface TranscriptConfig {
  languages?: string[];
  lang?: string; // For backward compatibility
  preserveFormatting?: boolean;
}

export interface TranscriptResponse {
  text: string;
  duration: number;
  offset: number;
  lang?: string;
  isGenerated?: boolean;
}

export interface FetchedTranscriptSnippet {
  text: string;
  start: number;
  duration: number;
}

export class Transcript {
  constructor(
    public readonly videoId: string,
    public readonly language: string,
    public readonly languageCode: string,
    public readonly isGenerated: boolean,
    public readonly isTranslatable: boolean,
    public readonly translationLanguages: { languageCode: string, languageName: string }[],
    private readonly baseUrl: string,
    private readonly httpClient: any = null
  ) {}

  /**
   * Fetch the actual transcript data
   */
  public async fetch(preserveFormatting: boolean = false): Promise<FetchedTranscript> {
    const transcriptResponse = await fetch(this.baseUrl, {
      headers: {
        'Accept-Language': this.languageCode,
        'User-Agent': USER_AGENT,
      },
    });

    if (!transcriptResponse.ok) {
      throw new YoutubeTranscriptNotAvailableError(this.videoId);
    }

    const transcriptBody = await transcriptResponse.text();
    const results = [...transcriptBody.matchAll(RE_XML_TRANSCRIPT)];

    const snippets = results.map((result) => ({
      text: preserveFormatting ? result[3] : result[3].replace(/<[^>]*>/g, ''),
      start: parseFloat(result[1]),
      duration: parseFloat(result[2]),
    }));

    return new FetchedTranscript(
      snippets,
      this.videoId,
      this.language,
      this.languageCode,
      this.isGenerated
    );
  }

  /**
   * Translate the transcript to another language
   * @param languageCode The language code to translate to
   */
  public translate(languageCode: string): Transcript {
    if (!this.isTranslatable) {
      throw new YoutubeTranscriptError('This transcript cannot be translated');
    }

    if (!this.translationLanguages.some(lang => lang.languageCode === languageCode)) {
      throw new YoutubeTranscriptError(
        `This transcript cannot be translated to ${languageCode}. Available languages: ${this.translationLanguages.map(lang => lang.languageCode).join(', ')}`
      );
    }

    // Construct the translation URL by adding the tlang parameter
    const translationUrl = `${this.baseUrl}&tlang=${languageCode}`;

    // Find the language name for the given language code
    const languageName = this.translationLanguages.find(
      lang => lang.languageCode === languageCode
    )?.languageName || languageCode;

    return new Transcript(
      this.videoId,
      languageName,
      languageCode,
      this.isGenerated,
      false, // Translated transcripts cannot be translated further
      [], // No translation languages for a translated transcript
      translationUrl,
      this.httpClient
    );
  }
}

export class TranscriptList {
  constructor(private transcripts: Transcript[], private videoId: string) {}

  /**
   * Find a transcript in the specified languages
   * @param languageCodes List of language codes in order of preference
   */
  public findTranscript(languageCodes: string[]): Transcript {
    for (const languageCode of languageCodes) {
      const transcript = this.transcripts.find(t => t.languageCode === languageCode);
      if (transcript) {
        return transcript;
      }
    }

    throw new YoutubeTranscriptNotAvailableLanguageError(
      languageCodes[0],
      this.transcripts.map(t => t.languageCode),
      this.videoId
    );
  }

  /**
   * Find a manually created transcript in the specified languages
   * @param languageCodes List of language codes in order of preference
   */
  public findManuallyCreatedTranscript(languageCodes: string[]): Transcript {
    for (const languageCode of languageCodes) {
      const transcript = this.transcripts.find(
        t => t.languageCode === languageCode && !t.isGenerated
      );
      if (transcript) {
        return transcript;
      }
    }

    throw new YoutubeTranscriptNotAvailableLanguageError(
      languageCodes[0],
      this.transcripts.filter(t => !t.isGenerated).map(t => t.languageCode),
      this.videoId
    );
  }

  /**
   * Find an automatically generated transcript in the specified languages
   * @param languageCodes List of language codes in order of preference
   */
  public findGeneratedTranscript(languageCodes: string[]): Transcript {
    for (const languageCode of languageCodes) {
      const transcript = this.transcripts.find(
        t => t.languageCode === languageCode && t.isGenerated
      );
      if (transcript) {
        return transcript;
      }
    }

    throw new YoutubeTranscriptNotAvailableLanguageError(
      languageCodes[0],
      this.transcripts.filter(t => t.isGenerated).map(t => t.languageCode),
      this.videoId
    );
  }

  /**
   * Get all transcripts
   */
  public getTranscripts(): Transcript[] {
    return [...this.transcripts];
  }

  /**
   * Implement iterator protocol
   */
  [Symbol.iterator]() {
    let index = 0;
    const transcripts = this.transcripts;

    return {
      next: () => {
        if (index < transcripts.length) {
          return { value: transcripts[index++], done: false };
        } else {
          return { done: true, value: undefined };
        }
      }
    };
  }
}

export class FetchedTranscript {
  constructor(
    public readonly snippets: FetchedTranscriptSnippet[],
    public readonly videoId: string,
    public readonly language: string,
    public readonly languageCode: string,
    public readonly isGenerated: boolean
  ) {}

  /**
   * Convert to raw data format
   */
  public toRawData(): TranscriptResponse[] {
    return this.snippets.map(snippet => ({
      text: snippet.text,
      duration: snippet.duration,
      offset: snippet.start,
      lang: this.languageCode,
      isGenerated: this.isGenerated
    }));
  }

  /**
   * Get the full transcript text
   */
  public getText(): string {
    return this.snippets.map(snippet => snippet.text).join(' ');
  }

  /**
   * Implement iterator protocol
   */
  [Symbol.iterator]() {
    let index = 0;
    const snippets = this.snippets;

    return {
      next: () => {
        if (index < snippets.length) {
          return { value: snippets[index++], done: false };
        } else {
          return { done: true, value: undefined };
        }
      }
    };
  }

  /**
   * Get the length of the transcript
   */
  get length(): number {
    return this.snippets.length;
  }
}

/**
 * Class to retrieve transcript if exist
 */
export class YoutubeTranscript {
  /**
   * Fetch transcript from YTB Video
   * @param videoId Video url or video identifier
   * @param config Get transcript in a specific language ISO
   */
  public static async fetchTranscript(
    videoId: string,
    config?: TranscriptConfig
  ): Promise<TranscriptResponse[]> {
    const identifier = this.retrieveVideoId(videoId);
    const videoPageResponse = await fetch(
      `https://www.youtube.com/watch?v=${identifier}`,
      {
        headers: {
          ...(config?.lang && { 'Accept-Language': config.lang }),
          'User-Agent': USER_AGENT,
        },
      }
    );
    const videoPageBody = await videoPageResponse.text();

    const splittedHTML = videoPageBody.split('"captions":');

    if (splittedHTML.length <= 1) {
      if (videoPageBody.includes('class="g-recaptcha"')) {
        throw new YoutubeTranscriptTooManyRequestError();
      }
      if (!videoPageBody.includes('"playabilityStatus":')) {
        throw new YoutubeTranscriptVideoUnavailableError(videoId);
      }
      throw new YoutubeTranscriptDisabledError(videoId);
    }

    const captions = (() => {
      try {
        return JSON.parse(
          splittedHTML[1].split(',"videoDetails')[0].replace('\n', '')
        );
      } catch (e) {
        return undefined;
      }
    })()?.['playerCaptionsTracklistRenderer'];

    if (!captions) {
      throw new YoutubeTranscriptDisabledError(videoId);
    }

    if (!('captionTracks' in captions)) {
      throw new YoutubeTranscriptNotAvailableError(videoId);
    }

    if (
      config?.lang &&
      !captions.captionTracks.some(
        (track) => track.languageCode === config?.lang
      )
    ) {
      throw new YoutubeTranscriptNotAvailableLanguageError(
        config?.lang,
        captions.captionTracks.map((track) => track.languageCode),
        videoId
      );
    }

    const transcriptURL = (
      config?.lang
        ? captions.captionTracks.find(
            (track) => track.languageCode === config?.lang
          )
        : captions.captionTracks[0]
    ).baseUrl;

    const transcriptResponse = await fetch(transcriptURL, {
      headers: {
        ...(config?.lang && { 'Accept-Language': config.lang }),
        'User-Agent': USER_AGENT,
      },
    });
    if (!transcriptResponse.ok) {
      throw new YoutubeTranscriptNotAvailableError(videoId);
    }
    const transcriptBody = await transcriptResponse.text();
    const results = [...transcriptBody.matchAll(RE_XML_TRANSCRIPT)];
    return results.map((result) => ({
      text: result[3],
      duration: parseFloat(result[2]),
      offset: parseFloat(result[1]),
      lang: config?.lang ?? captions.captionTracks[0].languageCode,
    }));
  }

  /**
   * Retrieve video id from url or string
   * @param videoId video url or video id
   */
  private static retrieveVideoId(videoId: string) {
    if (videoId.length === 11) {
      return videoId;
    }
    const matchId = videoId.match(RE_YOUTUBE);
    if (matchId && matchId.length) {
      return matchId[1];
    }
    throw new YoutubeTranscriptError(
      'Impossible to retrieve Youtube video ID.'
    );
  }
}
