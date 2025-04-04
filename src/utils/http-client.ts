import { Constants } from './constants';
import { ProxyConfig } from '../proxies/proxy-config';
import * as fs from 'fs';

/**
 * HTTP client for making requests to YouTube
 */
export class HttpClient {
  private cookieHeader: string | undefined;

  /**
   * Creates a new HttpClient instance
   *
   * @param cookiePath - Path to a cookies.txt file
   * @param proxyConfig - Proxy configuration
   */
  constructor(
    private readonly cookiePath?: string,
    private readonly proxyConfig?: ProxyConfig
  ) {
    if (cookiePath) {
      this.loadCookies(cookiePath);
    }
  }

  /**
   * Load cookies from a file
   *
   * @param cookiePath - Path to the cookies file
   */
  private loadCookies(cookiePath: string): void {
    try {
      if (fs.existsSync(cookiePath)) {
        const cookieContent = fs.readFileSync(cookiePath, 'utf-8');
        const cookies: string[] = [];

        // Parse Netscape format cookies
        const lines = cookieContent.split('\n');
        for (const line of lines) {
          // Skip comments and empty lines
          if (line.startsWith('#') || line.trim() === '') {
            continue;
          }

          const parts = line.split('\t');
          if (parts.length >= 7) {
            const domain = parts[0];
            // const path = parts[2];
            // const secure = parts[3] === 'TRUE';
            const expiration = parseInt(parts[4], 10);
            const name = parts[5];
            const value = parts[6];

            // Only include cookies for youtube.com
            if (domain.includes('youtube.com') &&
                expiration > Math.floor(Date.now() / 1000)) {
              cookies.push(`${name}=${value}`);
            }
          }
        }

        if (cookies.length > 0) {
          this.cookieHeader = cookies.join('; ');
        }
      }
    } catch (error) {
      console.error('Error loading cookies:', error);
    }
  }

  /**
   * Make a fetch request with the configured options
   *
   * @param url - The URL to fetch
   * @param options - Additional fetch options
   */
  public async fetch(url: string, options: RequestInit = {}): Promise<Response> {
    const headers: HeadersInit = {
      'User-Agent': Constants.USER_AGENT,
      ...options.headers,
    };

    if (this.cookieHeader) {
      (headers as Record<string, string>).Cookie = this.cookieHeader;
    }

    const fetchOptions: RequestInit = {
      ...options,
      headers,
    };

    // Add proxy if configured
    if (this.proxyConfig) {
      // In a browser environment, we can't directly set proxy
      // In Node.js, we would use an agent here
      // This is a placeholder for actual implementation
      console.log('Using proxy:',
        url.startsWith('https')
          ? this.proxyConfig.getHttpsProxyUrl()
          : this.proxyConfig.getHttpProxyUrl()
      );
    }

    return fetch(url, fetchOptions);
  }
}
