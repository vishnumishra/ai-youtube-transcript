import { Formatter } from './formatter';
import { FetchedTranscript } from '../models/transcript';

/**
 * Formats transcripts as JSON
 */
export class JSONFormatter implements Formatter {
  /**
   * Format a single transcript as JSON
   * 
   * @param transcript - The transcript to format
   * @param options - JSON.stringify options
   */
  formatTranscript(transcript: FetchedTranscript, options?: any): string {
    return JSON.stringify(transcript.toRawData(), null, options?.indent);
  }
  
  /**
   * Format multiple transcripts as JSON
   * 
   * @param transcripts - The transcripts to format
   * @param options - JSON.stringify options
   */
  formatTranscripts(transcripts: FetchedTranscript[], options?: any): string {
    return JSON.stringify(
      transcripts.map(transcript => ({
        videoId: transcript.videoId,
        language: transcript.language,
        languageCode: transcript.languageCode,
        isGenerated: transcript.isGenerated,
        transcript: transcript.toRawData()
      })),
      null,
      options?.indent
    );
  }
}
