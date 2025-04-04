import { Formatter } from './formatter';
import { FetchedTranscript } from '../models/transcript';

/**
 * Formats transcripts as plain text
 */
export class TextFormatter implements Formatter {
  /**
   * Format a single transcript as plain text
   * 
   * @param transcript - The transcript to format
   */
  formatTranscript(transcript: FetchedTranscript): string {
    return transcript.snippets
      .map(snippet => snippet.text)
      .join(' ');
  }
  
  /**
   * Format multiple transcripts as plain text
   * 
   * @param transcripts - The transcripts to format
   */
  formatTranscripts(transcripts: FetchedTranscript[]): string {
    return transcripts
      .map(transcript => {
        return `[${transcript.videoId} - ${transcript.language}]\n${this.formatTranscript(transcript)}`;
      })
      .join('\n\n');
  }
}
