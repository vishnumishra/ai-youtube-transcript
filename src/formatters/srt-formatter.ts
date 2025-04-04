import { Formatter } from './formatter';
import { FetchedTranscript } from '../models/transcript';

/**
 * Formats transcripts in SRT (SubRip) format
 */
export class SRTFormatter implements Formatter {
  /**
   * Format a single transcript in SRT format
   * 
   * @param transcript - The transcript to format
   */
  formatTranscript(transcript: FetchedTranscript): string {
    return transcript.snippets
      .map((snippet, index) => {
        const startTime = this.formatTime(snippet.start);
        const endTime = this.formatTime(snippet.start + snippet.duration);
        
        return `${index + 1}\n${startTime} --> ${endTime}\n${snippet.text}\n`;
      })
      .join('\n');
  }
  
  /**
   * Format multiple transcripts in SRT format
   * 
   * @param transcripts - The transcripts to format
   */
  formatTranscripts(transcripts: FetchedTranscript[]): string {
    return transcripts
      .map(transcript => {
        return `WEBVTT - ${transcript.videoId} (${transcript.language})\n\n${this.formatTranscript(transcript)}`;
      })
      .join('\n\n');
  }
  
  /**
   * Format a time value in SRT format (HH:MM:SS,mmm)
   * 
   * @param seconds - The time in seconds
   */
  private formatTime(seconds: number): string {
    const date = new Date(seconds * 1000);
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    const secs = date.getUTCSeconds().toString().padStart(2, '0');
    const ms = date.getUTCMilliseconds().toString().padStart(3, '0');
    
    return `${hours}:${minutes}:${secs},${ms}`;
  }
}
