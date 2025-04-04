/**
 * Constants used throughout the application
 */
export class Constants {
  /**
   * Regular expression to extract YouTube video ID from URL
   */
  public static readonly RE_YOUTUBE =
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  
  /**
   * User agent string for requests
   */
  public static readonly USER_AGENT =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.83 Safari/537.36,gzip(gfe)';
  
  /**
   * Regular expression to parse XML transcript
   */
  public static readonly RE_XML_TRANSCRIPT =
    /<text start="([^"]*)" dur="([^"]*)">([^<]*)<\/text>/g;
}
