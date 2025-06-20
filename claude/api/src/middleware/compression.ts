import { FastifyPluginAsync } from 'fastify';
import fastifyCompress from '@fastify/compress';
import { logger } from '../utils/logger';

export interface CompressionOptions {
  global?: boolean;              // Enable compression globally
  threshold?: number;            // Minimum size to compress (bytes)
  brotliOptions?: {             // Brotli compression options
    params?: {
      [key: number]: number;
    };
  };
  zlibOptions?: {               // Zlib compression options
    level?: number;
  };
  encodings?: string[];         // Supported encodings
  customTypes?: RegExp;         // Custom content types to compress
  removeContentLengthHeader?: boolean;
}

const defaultOptions: CompressionOptions = {
  global: true,
  threshold: 1024, // 1KB
  brotliOptions: {
    params: {
      [11]: 4, // BROTLI_PARAM_QUALITY - balance between speed and compression
    },
  },
  zlibOptions: {
    level: 6, // Default zlib compression level
  },
  encodings: ['gzip', 'deflate', 'br', 'identity'],
  customTypes: /^(text|application)\/(json|javascript|xml|html|css|plain)/,
};

export const compressionPlugin: FastifyPluginAsync<CompressionOptions> = async (
  fastify,
  options = {}
) => {
  const config = { ...defaultOptions, ...options };
  
  // Register compression plugin
  await fastify.register(fastifyCompress, {
    global: config.global,
    threshold: config.threshold,
    brotliOptions: config.brotliOptions,
    zlibOptions: config.zlibOptions,
    encodings: config.encodings,
    customTypes: config.customTypes,
    removeContentLengthHeader: config.removeContentLengthHeader,
  });
  
  // Add compression stats hook
  fastify.addHook('onSend', async (request, reply, payload) => {
    const encoding = reply.getHeader('content-encoding');
    const originalSize = Buffer.isBuffer(payload) 
      ? payload.length 
      : JSON.stringify(payload).length;
    
    if (encoding && encoding !== 'identity') {
      logger.debug({
        url: request.url,
        method: request.method,
        encoding,
        originalSize,
        threshold: config.threshold,
      }, 'Response compressed');
    }
    
    return payload;
  });
  
  // Add route-specific compression control
  fastify.decorate('compress', (options?: CompressionOptions) => {
    return async function (request: any, reply: any) {
      if (options?.threshold !== undefined) {
        reply.compressMinLength = options.threshold;
      }
      
      if (options?.encodings) {
        reply.header('Accept-Encoding', options.encodings.join(', '));
      }
    };
  });
};

// Compression utilities
export class CompressionUtils {
  /**
   * Estimate compression ratio for different content types
   */
  static estimateCompressionRatio(
    contentType: string,
    content: string | Buffer
  ): number {
    const size = Buffer.isBuffer(content) ? content.length : content.length;
    
    // Rough estimates based on content type
    if (contentType.includes('json')) {
      // JSON typically compresses 60-80%
      return 0.3;
    } else if (contentType.includes('html') || contentType.includes('xml')) {
      // HTML/XML typically compresses 70-85%
      return 0.25;
    } else if (contentType.includes('text')) {
      // Plain text typically compresses 50-70%
      return 0.4;
    } else if (contentType.includes('javascript') || contentType.includes('css')) {
      // JS/CSS typically compresses 65-80%
      return 0.3;
    } else {
      // Unknown content type, conservative estimate
      return 0.7;
    }
  }
  
  /**
   * Check if content should be compressed
   */
  static shouldCompress(
    contentType: string,
    size: number,
    threshold: number = 1024
  ): boolean {
    // Don't compress if below threshold
    if (size < threshold) {
      return false;
    }
    
    // Don't compress already compressed formats
    const compressedFormats = [
      'image/',
      'video/',
      'audio/',
      'application/zip',
      'application/gzip',
      'application/x-bzip',
      'application/x-compress',
    ];
    
    for (const format of compressedFormats) {
      if (contentType.includes(format)) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Get optimal compression level based on content size
   */
  static getOptimalCompressionLevel(size: number): number {
    if (size < 10 * 1024) {        // < 10KB
      return 1; // Fastest compression
    } else if (size < 100 * 1024) { // < 100KB
      return 4; // Balanced
    } else if (size < 1024 * 1024) { // < 1MB
      return 6; // Default
    } else {
      return 9; // Maximum compression for large content
    }
  }
}

// Streaming compression support
export class StreamingCompression {
  /**
   * Create compression transform stream
   */
  static createCompressionStream(
    encoding: 'gzip' | 'deflate' | 'br' = 'gzip',
    options?: any
  ): any {
    const zlib = require('zlib');
    
    switch (encoding) {
      case 'gzip':
        return zlib.createGzip(options);
      case 'deflate':
        return zlib.createDeflate(options);
      case 'br':
        return zlib.createBrotliCompress(options);
      default:
        throw new Error(`Unsupported encoding: ${encoding}`);
    }
  }
  
  /**
   * Compress streaming response
   */
  static compressStream(
    stream: NodeJS.ReadableStream,
    encoding: string,
    options?: any
  ): NodeJS.ReadableStream {
    if (!encoding || encoding === 'identity') {
      return stream;
    }
    
    const compressionStream = this.createCompressionStream(
      encoding as any,
      options
    );
    
    return stream.pipe(compressionStream);
  }
}

// Export plugin and utilities
export default compressionPlugin;
export { StreamingCompression as StreamCompression };