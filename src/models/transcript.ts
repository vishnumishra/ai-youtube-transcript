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
   * Get the transcript URL
   */
  get url(): string {
    return this.baseUrl;
  }

  /**
   * Fetch the actual transcript data using the new YouTube API
   * 
   * @param preserveFormatting - Whether to preserve HTML formatting
   */
  public async fetch(preserveFormatting: boolean = false): Promise<FetchedTranscript> {
    if (!this.httpClient || typeof this.httpClient.fetch !== 'function') {
      throw new YoutubeTranscriptNotAvailableError('HttpClient is required for transcript fetching');
    }

    // Check if this transcript URL requires PoToken (like Python library)
    if (this.url.includes('&exp=xpe')) {
      throw new YoutubeTranscriptNotAvailableError('PoToken required for this transcript');
    }

    // Fetch transcript using the URL from the player response (like Python library)
    const transcriptResponse = await this.httpClient.fetch(this.url);
    
    if (!transcriptResponse.ok) {
      throw new YoutubeTranscriptNotAvailableError(this.videoId);
    }
    
    const transcriptXml = await transcriptResponse.text();
    
    // Parse the XML transcript data
    const snippets = this.parseTranscriptXml(transcriptXml, preserveFormatting);
    
    return new FetchedTranscript(
      snippets,
      this.videoId,
      this.language,
      this.languageCode,
      this.isGenerated
    );
  }

  /**
   * Parse XML transcript data (like Python library)
   * 
   * @param xmlData - The XML response from the timedtext API
   * @param preserveFormatting - Whether to preserve HTML formatting
   * @returns Array of transcript snippets
   */
  private parseTranscriptXml(xmlData: string, preserveFormatting: boolean): TranscriptSnippet[] {
    try {
      const snippets: TranscriptSnippet[] = [];
      
      // Simple regex-based XML parsing (handle both <text> and <p> formats)
      // First try the new <p> format
      let textMatches = xmlData.match(/<p[^>]*t="([^"]*)"[^>]*d="([^"]*?)"[^>]*>([^<]*)<\/p>/g);
      let isNewFormat = true;
      
      // If no matches, try the old <text> format
      if (!textMatches) {
        textMatches = xmlData.match(/<text[^>]*start="([^"]*)"[^>]*dur="([^"]*?)"[^>]*>([^<]*)<\/text>/g);
        isNewFormat = false;
      }
      
      if (textMatches) {
        for (const match of textMatches) {
          let startMatch, durMatch, textMatch;
          
          if (isNewFormat) {
            // New format: <p t="1360" d="1680">[♪♪♪]</p>
            startMatch = match.match(/t="([^"]*)"/); 
            durMatch = match.match(/d="([^"]*)"/); 
            textMatch = match.match(/>([^<]*)</);
          } else {
            // Old format: <text start="1.36" dur="1.68">[♪♪♪]</text>
            startMatch = match.match(/start="([^"]*)"/); 
            durMatch = match.match(/dur="([^"]*)"/); 
            textMatch = match.match(/>([^<]*)</);
          }
          
          if (startMatch && durMatch && textMatch) {
            let text = textMatch[1];
            
            // Decode HTML entities
            text = text.replace(/&amp;/g, '&')
                      .replace(/&lt;/g, '<')
                      .replace(/&gt;/g, '>')
                      .replace(/&quot;/g, '"')
                      .replace(/&#39;/g, "'");
            
            // Remove HTML tags if not preserving formatting
            if (!preserveFormatting) {
              text = text.replace(/<[^>]*>/g, '');
            }
            
            // Handle time conversion based on format
            let startTime, duration;
            if (isNewFormat) {
              // New format uses milliseconds
              startTime = parseFloat(startMatch[1]) / 1000;
              duration = parseFloat(durMatch[1]) / 1000;
            } else {
              // Old format uses seconds
              startTime = parseFloat(startMatch[1]);
              duration = parseFloat(durMatch[1]);
            }
            
            snippets.push({
              text: text.trim(),
              start: startTime,
              duration: duration
            });
          }
        }
      }
      
      return snippets;
      
    } catch (error) {
      console.error('Error parsing XML transcript:', error);
      return [];
    }
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
    private _transcripts: Transcript[], 
    private videoId: string
  ) {}

  /**
   * Get the list of transcripts
   */
  get transcripts(): Transcript[] {
    return this._transcripts;
  }

  /**
   * Get the number of available transcripts
   */
  get length(): number {
    return this._transcripts.length;
  }

  /**
   * Find a transcript in the specified languages
   * 
   * @param languageCodes - List of language codes in order of preference
   */
  public findTranscript(languageCodes: string[]): Transcript {
    for (const languageCode of languageCodes) {
      const transcript = this._transcripts.find(t => t.languageCode === languageCode);
      if (transcript) {
        return transcript;
      }
    }

    throw new YoutubeTranscriptError(
      `No transcripts found in languages: ${languageCodes.join(', ')} for video ${this.videoId}. ` +
      `Available languages: ${this._transcripts.map(t => t.languageCode).join(', ')}`
    );
  }

  /**
   * Find a manually created transcript in the specified languages
   * 
   * @param languageCodes - List of language codes in order of preference
   */
  [Symbol.iterator]() {
    return this._transcripts[Symbol.iterator]();
  }

  public findManuallyCreatedTranscript(languageCodes: string[]): Transcript {
    for (const languageCode of languageCodes) {
      const transcript = this._transcripts.find(
        t => t.languageCode === languageCode && !t.isGenerated
      );
      if (transcript) {
        return transcript;
      }
    }

    const availableLanguages = this._transcripts
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
      const transcript = this._transcripts.find(
        t => t.languageCode === languageCode && t.isGenerated
      );
      if (transcript) {
        return transcript;
      }
    }

    const availableLanguages = this._transcripts
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
    return [...this._transcripts];
  }


}
