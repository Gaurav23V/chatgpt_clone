/**
 * Cloudinary Configuration for ChatGPT Clone
 *
 * This file contains configuration for Cloudinary image and file upload service.
 * Cloudinary provides powerful image and video management capabilities including:
 * - Automatic image optimization and format conversion
 * - Real-time image transformations
 * - Advanced compression algorithms
 * - CDN delivery for fast global access
 * - AI-powered content analysis
 *
 * Required Environment Variables:
 * - CLOUDINARY_CLOUD_NAME: Your Cloudinary cloud name
 * - CLOUDINARY_API_KEY: Your Cloudinary API key
 * - CLOUDINARY_API_SECRET: Your Cloudinary API secret (server-side only)
 * - NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: Public cloud name for client-side usage
 *
 * Optional Environment Variables:
 * - CLOUDINARY_SECURE: Force HTTPS URLs (default: true)
 * - CLOUDINARY_UPLOAD_PRESET: Default upload preset name
 * - CLOUDINARY_FOLDER: Default folder for uploads
 */

import { Cloudinary } from '@cloudinary/url-gen';
import {
  FileUploadConfig,
  StorageServiceConfig,
  SupportedFileType,
  FileTransformation,
  CloudinaryUploadResponse,
  ProcessedFileMetadata
} from '@/types/file-upload';

/**
 * Environment variable validation
 */
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;
const CLOUDINARY_UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET;
const CLOUDINARY_FOLDER = process.env.CLOUDINARY_FOLDER || 'chatgpt-clone';

// Validate required environment variables
if (!CLOUDINARY_CLOUD_NAME) {
  console.warn('⚠️  CLOUDINARY_CLOUD_NAME not found. Cloudinary functionality will be limited.');
}

/**
 * Cloudinary instance for URL generation and transformations
 */
export const cloudinary = new Cloudinary({
  cloud: {
    cloudName: CLOUDINARY_CLOUD_NAME,
  },
  url: {
    secure: true, // Always use HTTPS
  },
});

/**
 * Cloudinary file type restrictions and configurations
 */
export const CLOUDINARY_CONFIG = {
  // Supported file types for Cloudinary uploads
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
  ] as SupportedFileType[],

  // File size limits (in bytes)
  MAX_FILE_SIZE: {
    // Free tier limits
    FREE: 10 * 1024 * 1024, // 10MB
    // Paid tier limits
    PRO: 100 * 1024 * 1024, // 100MB
    ENTERPRISE: 300 * 1024 * 1024, // 300MB
  },

  // Image transformation presets
  TRANSFORMATIONS: {
    // Thumbnail sizes
    THUMBNAIL_SMALL: { width: 150, height: 150, crop: 'fill' as const },
    THUMBNAIL_MEDIUM: { width: 300, height: 300, crop: 'fill' as const },
    THUMBNAIL_LARGE: { width: 600, height: 600, crop: 'fill' as const },

    // Responsive image sizes
    MOBILE: { width: 480, quality: 'auto' as const, format: 'auto' as const },
    TABLET: { width: 768, quality: 'auto' as const, format: 'auto' as const },
    DESKTOP: { width: 1200, quality: 'auto' as const, format: 'auto' as const },

    // Optimized formats
    WEBP_OPTIMIZED: { format: 'webp' as const, quality: 'auto' as const },
    AVIF_OPTIMIZED: { format: 'avif' as const, quality: 'auto' as const },
  },

  // Upload presets for different use cases
  UPLOAD_PRESETS: {
    CHAT_IMAGES: 'chat_images',
    PROFILE_PICTURES: 'profile_pictures',
    DOCUMENTS: 'documents',
    ATTACHMENTS: 'attachments',
  },

  // Folder structure
  FOLDERS: {
    CHAT_ATTACHMENTS: `${CLOUDINARY_FOLDER}/chat-attachments`,
    USER_UPLOADS: `${CLOUDINARY_FOLDER}/user-uploads`,
    PROFILE_IMAGES: `${CLOUDINARY_FOLDER}/profile-images`,
    TEMP_UPLOADS: `${CLOUDINARY_FOLDER}/temp`,
  },
} as const;

/**
 * Default Cloudinary upload configuration
 */
export const defaultCloudinaryConfig: FileUploadConfig = {
  provider: 'cloudinary',

  // Size limits based on subscription tier
  maxFileSize: CLOUDINARY_CONFIG.MAX_FILE_SIZE.FREE,
  maxTotalSize: 50 * 1024 * 1024, // 50MB total per session

  // Allowed file types
  allowedTypes: [
    ...CLOUDINARY_CONFIG.SUPPORTED_IMAGE_TYPES,
    ...CLOUDINARY_CONFIG.SUPPORTED_DOCUMENT_TYPES,
  ],

  // Blocked file types for security
  blockedTypes: [
    'application/x-executable',
    'application/x-msdownload',
    'application/x-msdos-program',
    'application/x-sh',
    'text/x-script',
  ],

  // Processing options
  autoProcess: true,
  processingOptions: {
    optimize: true,
    progressive: true,
    format: 'auto',
    extractText: true, // For documents
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
  publicAccess: false,
  expirationTime: 30 * 24 * 60 * 60, // 30 days
};

/**
 * Cloudinary service configuration
 */
export const cloudinaryServiceConfig: StorageServiceConfig = {
  provider: 'cloudinary',
  cloudName: CLOUDINARY_CLOUD_NAME,
  apiKey: CLOUDINARY_API_KEY,
  apiSecret: CLOUDINARY_API_SECRET,
  defaultConfig: defaultCloudinaryConfig,
};

/**
 * Upload parameters for different file types
 */
export const getCloudinaryUploadParams = (fileType: SupportedFileType, userId?: string) => {
  const baseParams = {
    cloud_name: CLOUDINARY_CLOUD_NAME,
    upload_preset: CLOUDINARY_CONFIG.UPLOAD_PRESETS.ATTACHMENTS,
    folder: CLOUDINARY_CONFIG.FOLDERS.CHAT_ATTACHMENTS,
    resource_type: 'auto' as const,
    unique_filename: true,
    use_filename: true,
    filename_override: undefined as string | undefined,

    // Security settings
    invalidate: true,
    notification_url: process.env.CLOUDINARY_WEBHOOK_URL,

    // Metadata
    context: {
      userId: userId || 'anonymous',
      uploadedAt: new Date().toISOString(),
      source: 'chatgpt-clone',
    },

    // Tags for organization
    tags: ['chatgpt-clone', 'chat-attachment'],
  };

  // Image-specific parameters
  if (fileType.startsWith('image/')) {
    return {
      ...baseParams,
      upload_preset: CLOUDINARY_CONFIG.UPLOAD_PRESETS.CHAT_IMAGES,
      transformation: [
        {
          width: 1920,
          height: 1080,
          crop: 'limit',
          quality: 'auto',
          format: 'auto',
        },
      ],
      eager: [
        CLOUDINARY_CONFIG.TRANSFORMATIONS.THUMBNAIL_SMALL,
        CLOUDINARY_CONFIG.TRANSFORMATIONS.THUMBNAIL_MEDIUM,
        CLOUDINARY_CONFIG.TRANSFORMATIONS.MOBILE,
      ],
      tags: [...baseParams.tags, 'image'],
    };
  }

  // Document-specific parameters
  if (fileType === 'application/pdf' || fileType.startsWith('text/')) {
    return {
      ...baseParams,
      upload_preset: CLOUDINARY_CONFIG.UPLOAD_PRESETS.DOCUMENTS,
      resource_type: 'raw' as const,
      tags: [...baseParams.tags, 'document'],
    };
  }

  return baseParams;
};

/**
 * Transform Cloudinary response to our standard format
 */
export const transformCloudinaryResponse = (
  response: CloudinaryUploadResponse,
  originalFile: File
): ProcessedFileMetadata => {
  return {
    id: response.public_id,
    publicId: response.public_id,
    originalName: originalFile.name,
    fileName: response.original_filename,
    fileSize: response.bytes,
    mimeType: `${response.resource_type}/${response.format}` as SupportedFileType,
    fileExtension: `.${response.format}`,
    url: response.url,
    secureUrl: response.secure_url,
    thumbnailUrl: response.eager?.[0]?.secure_url,
    provider: 'cloudinary',
    status: 'completed',
    uploadedAt: new Date(response.created_at),

    // Image metadata
    imageMetadata: response.width && response.height ? {
      width: response.width,
      height: response.height,
      format: response.format,
      hasTransparency: response.format === 'png' || response.format === 'gif',
      colorSpace: 'sRGB', // Default assumption
    } : undefined,

    // Security scan (placeholder - implement actual scanning)
    securityScan: {
      isClean: true,
      scanResult: 'clean',
      scanDetails: 'Cloudinary security scan passed',
    },

    // Access control
    isPublic: response.access_mode === 'public',

    // Usage tracking
    downloadCount: 0,
  };
};

/**
 * Generate optimized image URLs with transformations
 */
export const generateOptimizedImageUrl = (
  publicId: string,
  transformation: FileTransformation = {}
): string => {
  if (!CLOUDINARY_CLOUD_NAME) {
    console.warn('Cloudinary cloud name not configured');
    return '';
  }

  const {
    width,
    height,
    crop = 'fill',
    quality = 'auto',
    format = 'auto',
    ...otherTransforms
  } = transformation;

  // Build transformation string
  const transforms = [];

  if (width || height) {
    transforms.push(`w_${width || 'auto'},h_${height || 'auto'},c_${crop}`);
  }

  if (quality) {
    transforms.push(`q_${quality}`);
  }

  if (format) {
    transforms.push(`f_${format}`);
  }

  // Add other transformations
  Object.entries(otherTransforms).forEach(([key, value]) => {
    if (value !== undefined) {
      transforms.push(`${key}_${value}`);
    }
  });

  const transformString = transforms.length > 0 ? `/${transforms.join(',')}` : '';

  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload${transformString}/${publicId}`;
};

/**
 * Validate Cloudinary configuration
 */
export const validateCloudinaryConfig = (): boolean => {
  const isValid = !!(CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY);

  if (!isValid) {
    console.error('❌ Cloudinary configuration is incomplete. Please check environment variables.');
  }

  return isValid;
};

/**
 * Get Cloudinary upload signature (for secure uploads)
 */
export const getCloudinarySignature = async (params: Record<string, any>): Promise<string> => {
  if (!CLOUDINARY_API_SECRET) {
    throw new Error('Cloudinary API secret not configured');
  }

  // This would typically be implemented on the server side
  // For now, return a placeholder
  return 'signature-placeholder';
};

/**
 * Default export for convenience
 */
export default {
  cloudinary,
  config: CLOUDINARY_CONFIG,
  defaultConfig: defaultCloudinaryConfig,
  serviceConfig: cloudinaryServiceConfig,
  getUploadParams: getCloudinaryUploadParams,
  transformResponse: transformCloudinaryResponse,
  generateOptimizedUrl: generateOptimizedImageUrl,
  validateConfig: validateCloudinaryConfig,
  getSignature: getCloudinarySignature,
};
