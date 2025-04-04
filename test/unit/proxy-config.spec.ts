/**
 * Unit tests for the proxy configuration classes
 * 
 * This file tests the proxy configuration classes.
 */

import { 
  GenericProxyConfig, 
  WebshareProxyConfig 
} from '../../src/new-index';

describe('Proxy Configuration Unit Tests', () => {
  // Test 1: GenericProxyConfig
  describe('GenericProxyConfig', () => {
    it('should handle both HTTP and HTTPS URLs', () => {
      const httpUrl = 'http://user:pass@proxy.example.com:8080';
      const httpsUrl = 'https://user:pass@proxy.example.com:8443';
      
      const proxyConfig = new GenericProxyConfig(httpUrl, httpsUrl);
      expect(proxyConfig.getHttpProxyUrl()).toBe(httpUrl);
      expect(proxyConfig.getHttpsProxyUrl()).toBe(httpsUrl);
    });
    
    it('should handle only HTTP URL', () => {
      const httpUrl = 'http://user:pass@proxy.example.com:8080';
      
      const proxyConfig = new GenericProxyConfig(httpUrl);
      expect(proxyConfig.getHttpProxyUrl()).toBe(httpUrl);
      expect(proxyConfig.getHttpsProxyUrl()).toBeUndefined();
    });
    
    it('should handle only HTTPS URL', () => {
      const httpsUrl = 'https://user:pass@proxy.example.com:8443';
      
      const proxyConfig = new GenericProxyConfig(undefined, httpsUrl);
      expect(proxyConfig.getHttpProxyUrl()).toBeUndefined();
      expect(proxyConfig.getHttpsProxyUrl()).toBe(httpsUrl);
    });
  });
  
  // Test 2: WebshareProxyConfig
  describe('WebshareProxyConfig', () => {
    it('should generate correct proxy URLs', () => {
      const username = 'testuser';
      const password = 'testpass';
      
      const proxyConfig = new WebshareProxyConfig(username, password);
      
      // Check HTTP URL
      const httpUrl = proxyConfig.getHttpProxyUrl();
      expect(httpUrl).toBeDefined();
      expect(httpUrl).toContain(username);
      expect(httpUrl).toContain(password);
      expect(httpUrl).toMatch(/^http:\/\//);
      
      // Check HTTPS URL
      const httpsUrl = proxyConfig.getHttpsProxyUrl();
      expect(httpsUrl).toBeDefined();
      expect(httpsUrl).toContain(username);
      expect(httpsUrl).toContain(password);
      expect(httpsUrl).toMatch(/^http:\/\//);
    });
  });
});
