import { ProxyConfig } from './proxy-config';

/**
 * Configuration for Webshare proxies
 */
export class WebshareProxyConfig implements ProxyConfig {
  private static readonly WEBSHARE_PROXY_HOST = 'p.webshare.io';
  private static readonly WEBSHARE_PROXY_PORT = '80';
  private static readonly WEBSHARE_PROXY_HTTPS_PORT = '443';
  
  /**
   * Creates a new WebshareProxyConfig instance
   * 
   * @param proxyUsername - The Webshare proxy username
   * @param proxyPassword - The Webshare proxy password
   */
  constructor(
    private readonly proxyUsername: string,
    private readonly proxyPassword: string
  ) {}
  
  /**
   * Get the HTTP proxy URL
   */
  getHttpProxyUrl(): string {
    return `http://${this.proxyUsername}:${this.proxyPassword}@${WebshareProxyConfig.WEBSHARE_PROXY_HOST}:${WebshareProxyConfig.WEBSHARE_PROXY_PORT}`;
  }
  
  /**
   * Get the HTTPS proxy URL
   */
  getHttpsProxyUrl(): string {
    return `http://${this.proxyUsername}:${this.proxyPassword}@${WebshareProxyConfig.WEBSHARE_PROXY_HOST}:${WebshareProxyConfig.WEBSHARE_PROXY_HTTPS_PORT}`;
  }
}
