import { Constants } from './constants';
import { YoutubeTranscriptError } from '../errors';

/**
 * Helper functions for the YouTube transcript API
 */
export class Helpers {
  /**
   * Extract the YouTube video ID from a URL or ID string
   *
   * @param videoId - The YouTube video URL or ID
   * @returns The extracted video ID
   */
  public static extractVideoId(videoId: string): string {
    // If the input is already a valid video ID (11 characters)
    if (videoId.length === 11) {
      return videoId;
    }

    // Try to extract the ID from a URL
    const matchId = videoId.match(Constants.RE_YOUTUBE);
    if (matchId && matchId.length > 1) {
      return matchId[1];
    }

    throw new YoutubeTranscriptError('Impossible to retrieve YouTube video ID.');
  }

  /**
   * Parse the captions data from YouTube's response
   *
   * @param html - The HTML content of the YouTube page
   * @returns The parsed captions data or undefined if not found
   */
  public static parseCaptionsFromHtml(html: string): any {
    const splittedHtml = html.split('"captions":');

    if (splittedHtml.length <= 1) {
      return undefined;
    }

    try {
      const captionsJson = splittedHtml[1].split(',"videoDetails')[0].replace('\n', '');
      const parsedJson = JSON.parse(captionsJson);
      return parsedJson?.playerCaptionsTracklistRenderer;
    } catch (e) {
      return undefined;
    }
  }

  /**
   * Check if the HTML contains a CAPTCHA challenge
   *
   * @param html - The HTML content to check
   * @returns Whether the HTML contains a CAPTCHA challenge
   */
  public static hasCaptchaChallenge(html: string): boolean {
    return html.includes('class="g-recaptcha"');
  }

  /**
   * Check if the video is available
   *
   * @param html - The HTML content to check
   * @returns Whether the video is available
   */
  public static isVideoAvailable(html: string): boolean {
    return html.includes('"playabilityStatus":');
  }

  /**
   * Extract YouTube API key from homepage
   *
   * @param html - The HTML content of YouTube homepage
   * @returns The extracted API key or null if not found
   */
  public static extractApiKey(html: string): string | null {
    const match = html.match(Constants.RE_API_KEY);
    return match ? match[1] : null; // Use group 1 since regex has capture group
  }

  /**
   * Create request body for the YouTube player API (like Python library)
   */
  public static createPlayerRequestBody(videoId: string): any {
    return {
      context: {
        client: {
          clientName: Constants.YOUTUBE_CLIENT_NAME,
          clientVersion: Constants.YOUTUBE_CLIENT_VERSION
        }
      },
      videoId: videoId
    };
  }
}
