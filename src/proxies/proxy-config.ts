/**
 * Base interface for proxy configurations
 */
export interface ProxyConfig {
  /**
   * Get the proxy URL for HTTP requests
   */
  getHttpProxyUrl(): string | undefined;
  
  /**
   * Get the proxy URL for HTTPS requests
   */
  getHttpsProxyUrl(): string | undefined;
}

/**
 * Generic proxy configuration
 */
export class GenericProxyConfig implements ProxyConfig {
  /**
   * Creates a new GenericProxyConfig instance
   * 
   * @param httpUrl - The HTTP proxy URL
   * @param httpsUrl - The HTTPS proxy URL
   */
  constructor(
    private readonly httpUrl?: string,
    private readonly httpsUrl?: string
  ) {}
  
  /**
   * Get the HTTP proxy URL
   */
  getHttpProxyUrl(): string | undefined {
    return this.httpUrl;
  }
  
  /**
   * Get the HTTPS proxy URL
   */
  getHttpsProxyUrl(): string | undefined {
    return this.httpsUrl;
  }
}
