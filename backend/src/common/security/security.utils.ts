import { Request } from 'express';

/**
 * Platform security helper utilities.
 */
export class SecurityUtils {
  /**
   * Safely extracts client IP taking reverse proxy/load balancer headers into account.
   */
  static getClientIp(req: Request): string {
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
      const ipList =
        typeof forwardedFor === 'string'
          ? forwardedFor.split(',')
          : forwardedFor;
      if (ipList && ipList.length > 0) {
        return ipList[0].trim();
      }
    }
    const realIp = req.headers['x-real-ip'];
    if (typeof realIp === 'string') {
      return realIp;
    }
    return req.ip || req.socket.remoteAddress || '';
  }

  /**
   * Returns clean client User Agent.
   */
  static getUserAgent(req: Request): string {
    return (req.headers['user-agent'] as string) || 'Unknown';
  }

  /**
   * Evaluates if a request origin aligns with configured CORS allowed boundaries.
   */
  static isValidOrigin(origin: string, allowedOrigins: string[]): boolean {
    if (allowedOrigins.includes('*')) {
      return true;
    }
    return allowedOrigins.includes(origin);
  }

  /**
   * Masks the last octet of an IPv4 address for privacy in logs.
   */
  static maskIp(ip: string): string {
    if (!ip) return '';
    const parts = ip.split('.');
    if (parts.length === 4) {
      parts[3] = 'xxx';
      return parts.join('.');
    }
    // ponytail: non-IPv4 addresses returned unmasked
    return ip;
  }
}
