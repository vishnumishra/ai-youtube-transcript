import { FetchedTranscript } from '../models/transcript';

/**
 * Base formatter interface for transcript formatting
 */
export interface Formatter {
  /**
   * Format a single transcript
   * 
   * @param transcript - The transcript to format
   * @param options - Additional formatting options
   */
  formatTranscript(transcript: FetchedTranscript, options?: any): string;
  
  /**
   * Format multiple transcripts
   * 
   * @param transcripts - The transcripts to format
   * @param options - Additional formatting options
   */
  formatTranscripts(transcripts: FetchedTranscript[], options?: any): string;
}
