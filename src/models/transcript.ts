import { TranscriptSnippet, LanguageInfo, TranscriptResponse } from './interfaces';
import { 
  YoutubeTranscriptError, 
  YoutubeTranscriptNotAvailableError,
  YoutubeTranscriptTranslationError
} from '../errors';
import { Constants } from '../utils/constants';

/**
 * Represents a fetched transcript with its snippets and metadata
 */
export class FetchedTranscript {
  /**
   * Creates a new FetchedTranscript instance
   * 
   * @param snippets - The transcript snippets
   * @param videoId - The YouTube video ID
   * @param language - The language name
   * @param languageCode - The language code
   * @param isGenerated - Whether the transcript was auto-generated
   */
  constructor(
    public readonly snippets: TranscriptSnippet[],
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
 * Represents a transcript with metadata
 */
export class Transcript {
  /**
   * Creates a new Transcript instance
   * 
   * @param videoId - The YouTube video ID
   * @param language - The language name
   * @param languageCode - The language code
   * @param isGenerated - Whether the transcript is auto-generated
   * @param isTranslatable - Whether the transcript can be translated
   * @param translationLanguages - Available translation languages
   * @param baseUrl - The base URL for fetching the transcript
   * @param httpClient - The HTTP client to use for requests
   */
  constructor(
    public readonly videoId: string,
    public readonly language: string,
    public readonly languageCode: string,
    public readonly isGenerated: boolean,
    public readonly isTranslatable: boolean,
    public readonly translationLanguages: LanguageInfo[],
    private readonly baseUrl: string,
    private readonly httpClient: any = null
  ) {}

  /**
   * Fetch the actual transcript data
   * 
   * @param preserveFormatting - Whether to preserve HTML formatting
   */
  public async fetch(preserveFormatting: boolean = false): Promise<FetchedTranscript> {
    const transcriptResponse = await fetch(this.baseUrl, {
      headers: {
        'Accept-Language': this.languageCode,
        'User-Agent': Constants.USER_AGENT,
      },
    });
    
    if (!transcriptResponse.ok) {
      throw new YoutubeTranscriptNotAvailableError(this.videoId);
    }
    
    const transcriptBody = await transcriptResponse.text();
    const results = [...transcriptBody.matchAll(Constants.RE_XML_TRANSCRIPT)];
    
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
   * 
   * @param languageCode - The language code to translate to
   */
  public translate(languageCode: string): Transcript {
    if (!this.isTranslatable) {
      throw new YoutubeTranscriptTranslationError('This transcript cannot be translated');
    }

    if (!this.translationLanguages.some(lang => lang.languageCode === languageCode)) {
      throw new YoutubeTranscriptTranslationError(
        `This transcript cannot be translated to ${languageCode}. Available languages: ${
          this.translationLanguages.map(lang => lang.languageCode).join(', ')
        }`
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

/**
 * Represents a list of available transcripts for a video
 */
export class TranscriptList {
  /**
   * Creates a new TranscriptList instance
   * 
   * @param transcripts - The available transcripts
   * @param videoId - The YouTube video ID
   */
  constructor(
    private transcripts: Transcript[], 
    private videoId: string
  ) {}

  /**
   * Find a transcript in the specified languages
   * 
   * @param languageCodes - List of language codes in order of preference
   */
  public findTranscript(languageCodes: string[]): Transcript {
    for (const languageCode of languageCodes) {
      const transcript = this.transcripts.find(t => t.languageCode === languageCode);
      if (transcript) {
        return transcript;
      }
    }

    throw new YoutubeTranscriptError(
      `No transcripts found in languages: ${languageCodes.join(', ')} for video ${this.videoId}. ` +
      `Available languages: ${this.transcripts.map(t => t.languageCode).join(', ')}`
    );
  }

  /**
   * Find a manually created transcript in the specified languages
   * 
   * @param languageCodes - List of language codes in order of preference
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

    const availableLanguages = this.transcripts
      .filter(t => !t.isGenerated)
      .map(t => t.languageCode);

    throw new YoutubeTranscriptError(
      `No manually created transcripts found in languages: ${languageCodes.join(', ')} for video ${this.videoId}. ` +
      `Available languages: ${availableLanguages.join(', ') || 'none'}`
    );
  }

  /**
   * Find an automatically generated transcript in the specified languages
   * 
   * @param languageCodes - List of language codes in order of preference
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

    const availableLanguages = this.transcripts
      .filter(t => t.isGenerated)
      .map(t => t.languageCode);

    throw new YoutubeTranscriptError(
      `No automatically generated transcripts found in languages: ${languageCodes.join(', ')} for video ${this.videoId}. ` +
      `Available languages: ${availableLanguages.join(', ') || 'none'}`
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
