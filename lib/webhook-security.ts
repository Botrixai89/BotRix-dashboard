import crypto from 'crypto';
import { NextRequest } from 'next/server';

export interface WebhookSecurityConfig {
  secretKey: string;
  signatureHeader: string;
  timestampHeader: string;
  maxAge: number; // Maximum age of webhook in seconds
  allowedOrigins: string[];
}

const DEFAULT_CONFIG: WebhookSecurityConfig = {
  secretKey: process.env.WEBHOOK_SECRET || 'your-webhook-secret-key',
  signatureHeader: 'x-webhook-signature',
  timestampHeader: 'x-webhook-timestamp',
  maxAge: 300, // 5 minutes
  allowedOrigins: process.env.ALLOWED_WEBHOOK_ORIGINS?.split(',') || ['*']
};

export class WebhookSecurityService {
  private config: WebhookSecurityConfig;

  constructor(config: Partial<WebhookSecurityConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Generate a signature for webhook payload
   */
  generateSignature(payload: string, timestamp: number): string {
    const data = `${timestamp}.${payload}`;
    return crypto
      .createHmac('sha256', this.config.secretKey)
      .update(data)
      .digest('hex');
  }

  /**
   * Verify webhook signature
   */
  verifySignature(request: NextRequest, payload: string): boolean {
    try {
      const signature = request.headers.get(this.config.signatureHeader);
      const timestamp = request.headers.get(this.config.timestampHeader);

      if (!signature || !timestamp) {
        console.warn('Missing webhook signature or timestamp');
        return false;
      }

      const timestampNum = parseInt(timestamp);
      if (isNaN(timestampNum)) {
        console.warn('Invalid webhook timestamp');
        return false;
      }

      // Check timestamp age
      const age = Math.floor(Date.now() / 1000) - timestampNum;
      if (age > this.config.maxAge) {
        console.warn(`Webhook too old: ${age}s > ${this.config.maxAge}s`);
        return false;
      }

      // Verify signature
      const expectedSignature = this.generateSignature(payload, timestampNum);
      const isValid = crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );

      if (!isValid) {
        console.warn('Invalid webhook signature');
      }

      return isValid;
    } catch (error) {
      console.error('Error verifying webhook signature:', error);
      return false;
    }
  }

  /**
   * Validate webhook origin
   */
  validateOrigin(request: NextRequest): boolean {
    const origin = request.headers.get('origin') || request.headers.get('referer');
    
    if (!origin) {
      return true; // Allow if no origin header
    }

    if (this.config.allowedOrigins.includes('*')) {
      return true;
    }

    const url = new URL(origin);
    const hostname = url.hostname;

    return this.config.allowedOrigins.some(allowed => {
      if (allowed.startsWith('*.')) {
        // Wildcard subdomain
        const domain = allowed.substring(2);
        return hostname.endsWith(domain);
      }
      return hostname === allowed;
    });
  }

  /**
   * Rate limiting for webhooks
   */
  private rateLimitMap = new Map<string, { count: number; resetTime: number }>();

  isRateLimited(botId: string, limit: number = 100, windowMs: number = 60000): boolean {
    const now = Date.now();
    const key = `webhook:${botId}`;
    const record = this.rateLimitMap.get(key);

    if (!record || now > record.resetTime) {
      // Reset or create new record
      this.rateLimitMap.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
      return false;
    }

    if (record.count >= limit) {
      return true;
    }

    record.count++;
    return false;
  }

  /**
   * Validate webhook payload structure
   */
  validatePayload(payload: any): { valid: boolean; error?: string } {
    if (!payload) {
      return { valid: false, error: 'Empty payload' };
    }

    if (typeof payload !== 'object') {
      return { valid: false, error: 'Payload must be an object' };
    }

    // Check for required fields based on payload type
    if (payload.type === 'text' && (!payload.content || !payload.content.text)) {
      return { valid: false, error: 'Text payload must contain content.text' };
    }

    if (payload.type === 'file' && (!payload.content || !payload.content.url)) {
      return { valid: false, error: 'File payload must contain content.url' };
    }

    return { valid: true };
  }

  /**
   * Sanitize webhook payload
   */
  sanitizePayload(payload: any): any {
    if (!payload || typeof payload !== 'object') {
      return payload;
    }

    const sanitized = { ...payload };

    // Remove potentially dangerous fields
    delete sanitized.__proto__;
    delete sanitized.constructor;

    // Sanitize content
    if (sanitized.content && typeof sanitized.content === 'object') {
      if (sanitized.content.text && typeof sanitized.content.text === 'string') {
        // Basic XSS prevention
        sanitized.content.text = sanitized.content.text
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '');
      }

      if (sanitized.content.url && typeof sanitized.content.url === 'string') {
        // Validate URL
        try {
          const url = new URL(sanitized.content.url);
          if (!['http:', 'https:'].includes(url.protocol)) {
            delete sanitized.content.url;
          }
        } catch {
          delete sanitized.content.url;
        }
      }
    }

    return sanitized;
  }

  /**
   * Create secure webhook headers
   */
  createSecureHeaders(payload: string): Record<string, string> {
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = this.generateSignature(payload, timestamp);

    return {
      [this.config.signatureHeader]: signature,
      [this.config.timestampHeader]: timestamp.toString(),
      'Content-Type': 'application/json',
      'User-Agent': 'Botrix-Webhook-Service/1.0'
    };
  }

  /**
   * Validate webhook URL
   */
  validateWebhookUrl(url: string): { valid: boolean; error?: string } {
    try {
      const parsedUrl = new URL(url);
      
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return { valid: false, error: 'Webhook URL must use HTTP or HTTPS' };
      }

      if (parsedUrl.hostname === 'localhost' || parsedUrl.hostname === '127.0.0.1') {
        return { valid: false, error: 'Local webhook URLs are not allowed' };
      }

      // Check for common malicious patterns
      const suspiciousPatterns = [
        /\.(exe|bat|cmd|com|pif|scr|vbs|js)$/i,
        /javascript:/i,
        /data:/i,
        /vbscript:/i
      ];

      for (const pattern of suspiciousPatterns) {
        if (pattern.test(url)) {
          return { valid: false, error: 'Webhook URL contains suspicious content' };
        }
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, error: 'Invalid webhook URL format' };
    }
  }

  /**
   * Test webhook connectivity
   */
  async testWebhook(url: string, timeout: number = 10000): Promise<{
    success: boolean;
    statusCode?: number;
    responseTime?: number;
    error?: string;
  }> {
    try {
      const startTime = Date.now();
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Botrix-Webhook-Test/1.0'
        },
        body: JSON.stringify({
          type: 'test',
          content: { text: 'Webhook connectivity test' },
          timestamp: new Date().toISOString()
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      return {
        success: response.ok,
        statusCode: response.status,
        responseTime
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Export default instance
export const webhookSecurityService = new WebhookSecurityService(); 