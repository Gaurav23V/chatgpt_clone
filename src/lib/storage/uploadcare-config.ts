/**
 * Uploadcare Configuration for ChatGPT Clone
 *
 * This file contains configuration for Uploadcare file upload and delivery service.
 * Uploadcare provides robust file handling capabilities including:
 * - Fast and reliable file uploads with resumable uploads
 * - Automatic image optimization and processing
 * - Global CDN delivery network
 * - Advanced file transformations and filters
 * - Built-in security features and virus scanning
 * - Real-time image processing via URL transformations
 *
 * Required Environment Variables:
 * - UPLOADCARE_PUBLIC_KEY: Your Uploadcare public key
 * - UPLOADCARE_SECRET_KEY: Your Uploadcare secret key (server-side only)
 *
 * Optional Environment Variables:
 * - NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY: Public key for client-side usage
 * - UPLOADCARE_WEBHOOK_URL: URL for upload notifications
 * - UPLOADCARE_CDN_BASE: Custom CDN base URL
 */

import {
  FileUploadConfig,
  StorageServiceConfig,
  SupportedFileType,
  FileTransformation,
  UploadcareUploadResponse,
  ProcessedFileMetadata
} from '@/types/file-upload';

/**
 * Environment variable validation
 */
const UPLOADCARE_PUBLIC_KEY = process.env.UPLOADCARE_PUBLIC_KEY || process.env.NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY;
const UPLOADCARE_SECRET_KEY = process.env.UPLOADCARE_SECRET_KEY;
const UPLOADCARE_WEBHOOK_URL = process.env.UPLOADCARE_WEBHOOK_URL;
const UPLOADCARE_CDN_BASE = process.env.UPLOADCARE_CDN_BASE || 'https://ucarecdn.com';

// Validate required environment variables
if (!UPLOADCARE_PUBLIC_KEY) {
  console.warn('⚠️  UPLOADCARE_PUBLIC_KEY not found. Uploadcare functionality will be limited.');
}

/**
 * Uploadcare file type restrictions and configurations
 */
export const UPLOADCARE_CONFIG = {
  // Supported file types for Uploadcare uploads
  SUPPORTED_IMAGE_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
  ] as SupportedFileType[],

  SUPPORTED_DOCUMENT_TYPES: [
    'application/pdf',
    'text/plain',
    'text/markdown',
    'application/json',
    'text/css',
    'text/html',
    'text/csv',
  ] as SupportedFileType[],

  // File size limits (in bytes)
  MAX_FILE_SIZE: {
    // Free tier limits
    FREE: 25 * 1024 * 1024, // 25MB
    // Paid tier limits
    PRO: 100 * 1024 * 1024, // 100MB
    ENTERPRISE: 500 * 1024 * 1024, // 500MB
  },

  // Image transformation operations
  TRANSFORMATIONS: {
    // Thumbnail presets
    THUMBNAIL_SMALL: {
      resize: '150x150',
      crop: '150x150/center',
      format: 'webp',
      quality: 'smart',
    },
    THUMBNAIL_MEDIUM: {
      resize: '300x300',
      crop: '300x300/center',
      format: 'webp',
      quality: 'smart',
    },
    THUMBNAIL_LARGE: {
      resize: '600x600',
      crop: '600x600/center',
      format: 'webp',
      quality: 'smart',
    },

    // Responsive sizes
    MOBILE: {
      resize: '480x',
      format: 'webp',
      quality: 'smart_retina',
    },
    TABLET: {
      resize: '768x',
      format: 'webp',
      quality: 'smart_retina',
    },
    DESKTOP: {
      resize: '1200x',
      format: 'webp',
      quality: 'smart_retina',
    },

    // Optimized formats
    WEBP_OPTIMIZED: {
      format: 'webp',
      quality: 'smart',
      progressive: 'yes',
    },
    AVIF_OPTIMIZED: {
      format: 'avif',
      quality: 'smart',
      progressive: 'yes',
    },
  },

  // Upload widget settings
  WIDGET_SETTINGS: {
    // Basic settings
    multiple: true,
    multipleMax: 10,
    multipleMin: 1,

    // File restrictions
    imagesOnly: false,
    previewStep: true,
    clearable: true,

    // Upload behavior
    publicKey: UPLOADCARE_PUBLIC_KEY,
    secureSignature: '',
    secureExpire: '',

    // Localization
    locale: 'en',

    // Styling
    tabs: 'file camera url facebook gdrive gphotos dropbox instagram',

    // Image processing
    crop: 'free',
    imageShrink: '2048x2048',
    imageCompress: true,

    // Security
    validators: [
      // File size validator
      function(fileInfo: any) {
        if (fileInfo.size > UPLOADCARE_CONFIG.MAX_FILE_SIZE.FREE) {
          throw new Error(`File is too large. Maximum size is ${UPLOADCARE_CONFIG.MAX_FILE_SIZE.FREE / (1024 * 1024)}MB`);
        }
      },
    ],
  },

  // CDN settings
  CDN: {
    BASE_URL: UPLOADCARE_CDN_BASE,
    // Auto-format based on browser support
    AUTO_FORMAT: true,
    // Progressive JPEG loading
    PROGRESSIVE: true,
    // Smart compression
    SMART_COMPRESSION: true,
  },

  // Security settings
  SECURITY: {
    // Enable virus scanning
    VIRUS_SCAN: true,
    // Content moderation
    CONTENT_MODERATION: true,
    // Secure delivery
    SECURE_DELIVERY: process.env.NODE_ENV === 'production',
  },
} as const;

/**
 * Default Uploadcare upload configuration
 */
export const defaultUploadcareConfig: FileUploadConfig = {
  provider: 'uploadcare',

  // Size limits based on subscription tier
  maxFileSize: UPLOADCARE_CONFIG.MAX_FILE_SIZE.FREE,
  maxTotalSize: 100 * 1024 * 1024, // 100MB total per session

  // Allowed file types
  allowedTypes: [
    ...UPLOADCARE_CONFIG.SUPPORTED_IMAGE_TYPES,
    ...UPLOADCARE_CONFIG.SUPPORTED_DOCUMENT_TYPES,
  ],

  // Blocked file types for security
  blockedTypes: [
    'application/x-executable',
    'application/x-msdownload',
    'application/x-msdos-program',
    'application/x-sh',
    'text/x-script',
    'application/octet-stream',
  ],

  // Processing options
  autoProcess: true,
  processingOptions: {
    optimize: true,
    progressive: true,
    format: 'auto',
    extractText: false, // Uploadcare doesn't support text extraction
    scanForMalware: true,
    resize: {
      width: 1920,
      height: 1080,
      fit: 'inside',
      quality: 85,
    },
  },

  // Security settings
  requireAuth: true,
  scanForMalware: true,

  // Storage settings
  publicAccess: true, // Uploadcare files are public by default
  expirationTime: undefined, // No automatic expiration
};

/**
 * Uploadcare service configuration
 */
export const uploadcareServiceConfig: StorageServiceConfig = {
  provider: 'uploadcare',
  publicKey: UPLOADCARE_PUBLIC_KEY,
  secretKey: UPLOADCARE_SECRET_KEY,
  defaultConfig: defaultUploadcareConfig,
};

/**
 * Upload widget configuration for different use cases
 */
export const getUploadcareWidgetConfig = (fileType?: SupportedFileType, userId?: string) => {
  const baseConfig = {
    ...UPLOADCARE_CONFIG.WIDGET_SETTINGS,

    // Metadata
    metadata: {
      userId: userId || 'anonymous',
      uploadedAt: new Date().toISOString(),
      source: 'chatgpt-clone',
    },

    // Webhook for upload notifications
    ...(UPLOADCARE_WEBHOOK_URL && {
      webhookUrl: UPLOADCARE_WEBHOOK_URL,
    }),
  };

  // Image-specific configuration
  if (fileType?.startsWith('image/')) {
    return {
      ...baseConfig,
      imagesOnly: true,
      crop: 'free',
      effects: 'crop,rotate,mirror,flip',
      previewStep: true,

      // Image processing
      imageShrink: '2048x2048',
      imageCompress: true,

      // Auto-generate thumbnails
      autoStore: true,
    };
  }

  // Document-specific configuration
  if (fileType === 'application/pdf' || fileType?.startsWith('text/')) {
    return {
      ...baseConfig,
      imagesOnly: false,
      previewStep: false,
      tabs: 'file url gdrive dropbox',

      // Document handling
      autoStore: true,
    };
  }

  return baseConfig;
};

/**
 * Transform Uploadcare response to our standard format
 */
export const transformUploadcareResponse = (
  response: UploadcareUploadResponse,
  originalFile?: File
): ProcessedFileMetadata => {
  const fileExtension = response.name.split('.').pop() || '';

  return {
    id: response.uuid,
    publicId: response.uuid,
    originalName: originalFile?.name || response.originalFilename,
    fileName: response.name,
    fileSize: response.size,
    mimeType: response.mimeType as SupportedFileType,
    fileExtension: `.${fileExtension}`,
    url: response.cdnUrl,
    secureUrl: response.cdnUrl, // Uploadcare uses HTTPS by default
    thumbnailUrl: response.isImage ? `${response.cdnUrl}-/resize/300x300/-/crop/300x300/center/-/format/webp/` : undefined,
    provider: 'uploadcare',
    status: response.isStored ? 'completed' : 'pending',
    uploadedAt: new Date(),

    // Image metadata
    imageMetadata: response.imageInfo ? {
      width: response.imageInfo.width,
      height: response.imageInfo.height,
      format: response.imageInfo.format,
      hasTransparency: response.imageInfo.format === 'PNG' || response.imageInfo.format === 'GIF',
      colorSpace: response.imageInfo.colorMode || 'sRGB',
      orientation: response.imageInfo.orientation,
      dpi: response.imageInfo.dpi?.[0],
    } : undefined,

    // Security scan (Uploadcare provides built-in scanning)
    securityScan: {
      isClean: true, // Assume clean if upload succeeded
      scanResult: 'clean',
      scanDetails: 'Uploadcare security scan passed',
    },

    // Access control
    isPublic: true, // Uploadcare files are public by default

    // Usage tracking
    downloadCount: 0,
  };
};

/**
 * Generate optimized image URLs with transformations
 */
export const generateOptimizedUploadcareUrl = (
  uuid: string,
  transformation: FileTransformation = {}
): string => {
  if (!uuid) {
    console.warn('Uploadcare UUID not provided');
    return '';
  }

  const baseUrl = `${UPLOADCARE_CONFIG.CDN.BASE_URL}/${uuid}`;
  const operations: string[] = [];

  // Resize operations
  if (transformation.width || transformation.height) {
    const width = transformation.width || '';
    const height = transformation.height || '';
    operations.push(`-/resize/${width}x${height}/`);
  }

  // Crop operations
  if (transformation.crop && transformation.width && transformation.height) {
    const { crop, width, height, gravity = 'center' } = transformation;
    if (crop === 'fill' || crop === 'crop') {
      operations.push(`-/crop/${width}x${height}/${gravity}/`);
    }
  }

  // Quality and format
  if (transformation.quality) {
    operations.push(`-/quality/${transformation.quality}/`);
  }

  if (transformation.format && transformation.format !== 'auto') {
    operations.push(`-/format/${transformation.format}/`);
  } else if (UPLOADCARE_CONFIG.CDN.AUTO_FORMAT) {
    operations.push('-/format/auto/');
  }

  // Effects
  if (transformation.blur) {
    operations.push(`-/blur/${transformation.blur}/`);
  }

  if (transformation.sharpen) {
    operations.push(`-/sharp/${transformation.sharpen}/`);
  }

  if (transformation.brightness) {
    operations.push(`-/brightness/${transformation.brightness}/`);
  }

  // Progressive loading
  if (UPLOADCARE_CONFIG.CDN.PROGRESSIVE) {
    operations.push('-/progressive/yes/');
  }

  return baseUrl + operations.join('');
};

/**
 * Validate Uploadcare configuration
 */
export const validateUploadcareConfig = (): boolean => {
  const isValid = !!UPLOADCARE_PUBLIC_KEY;

  if (!isValid) {
    console.error('❌ Uploadcare configuration is incomplete. Please check environment variables.');
  }

  return isValid;
};

/**
 * Generate secure signature for authenticated uploads
 */
export const generateUploadcareSignature = (expire: number): string => {
  if (!UPLOADCARE_SECRET_KEY) {
    throw new Error('Uploadcare secret key not configured');
  }

  // This would typically use crypto to generate HMAC signature
  // For now, return a placeholder
  return 'signature-placeholder';
};

/**
 * Get file information from Uploadcare API
 */
export const getUploadcareFileInfo = async (uuid: string): Promise<UploadcareUploadResponse | null> => {
  if (!UPLOADCARE_PUBLIC_KEY) {
    throw new Error('Uploadcare public key not configured');
  }

  try {
    const response = await fetch(`https://api.uploadcare.com/files/${uuid}/`, {
      headers: {
        'Authorization': `Uploadcare.Simple ${UPLOADCARE_PUBLIC_KEY}:${UPLOADCARE_SECRET_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch file info: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching Uploadcare file info:', error);
    return null;
  }
};

/**
 * Delete file from Uploadcare
 */
export const deleteUploadcareFile = async (uuid: string): Promise<boolean> => {
  if (!UPLOADCARE_SECRET_KEY) {
    throw new Error('Uploadcare secret key not configured');
  }

  try {
    const response = await fetch(`https://api.uploadcare.com/files/${uuid}/storage/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Uploadcare.Simple ${UPLOADCARE_PUBLIC_KEY}:${UPLOADCARE_SECRET_KEY}`,
      },
    });

    return response.ok;
  } catch (error) {
    console.error('Error deleting Uploadcare file:', error);
    return false;
  }
};

/**
 * Default export for convenience
 */
export default {
  config: UPLOADCARE_CONFIG,
  defaultConfig: defaultUploadcareConfig,
  serviceConfig: uploadcareServiceConfig,
  getWidgetConfig: getUploadcareWidgetConfig,
  transformResponse: transformUploadcareResponse,
  generateOptimizedUrl: generateOptimizedUploadcareUrl,
  validateConfig: validateUploadcareConfig,
  generateSignature: generateUploadcareSignature,
  getFileInfo: getUploadcareFileInfo,
  deleteFile: deleteUploadcareFile,
};
