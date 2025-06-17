/**
 * Storage Services Index for ChatGPT Clone
 *
 * This file serves as the main entry point for all file storage operations.
 * It exports configurations for multiple storage providers and provides
 * a unified interface for file upload and management.
 *
 * Supported Storage Providers:
 * - Cloudinary: Advanced image and video management with AI-powered features
 * - Uploadcare: Fast and reliable file uploads with global CDN
 * - Local Storage: For development and testing (future implementation)
 * - AWS S3: Enterprise-grade object storage (future implementation)
 *
 * Usage:
 * import { getStorageConfig, uploadFile, StorageProvider } from '@/lib/storage';
 * import { cloudinaryConfig, uploadcareConfig } from '@/lib/storage';
 */

// Export all storage configurations
export { default as cloudinaryConfig, cloudinary } from './cloudinary-config';
export { default as uploadcareConfig } from './uploadcare-config';

// Export specific functions and configurations
export {
  // Cloudinary exports
  CLOUDINARY_CONFIG,
  defaultCloudinaryConfig,
  cloudinaryServiceConfig,
  getCloudinaryUploadParams,
  transformCloudinaryResponse,
  generateOptimizedImageUrl,
  validateCloudinaryConfig,
  getCloudinarySignature,
} from './cloudinary-config';

export {
  // Uploadcare exports
  UPLOADCARE_CONFIG,
  defaultUploadcareConfig,
  uploadcareServiceConfig,
  getUploadcareWidgetConfig,
  transformUploadcareResponse,
  generateOptimizedUploadcareUrl,
  validateUploadcareConfig,
  generateUploadcareSignature,
  getUploadcareFileInfo,
  deleteUploadcareFile,
} from './uploadcare-config';

// Export types
export type {
  FileUploadConfig,
  StorageServiceConfig,
  SupportedFileType,
  StorageProvider,
  FileTransformation,
  ProcessedFileMetadata,
  FileUploadResponse,
  CloudinaryUploadResponse,
  UploadcareUploadResponse,
  UploadProgress,
  BatchUploadResponse,
  FileValidationResult,
  FileProcessingOptions,
  ImageMetadata,
  BaseFileInfo,
  UploadStatus,
  FileSearchOptions,
  CreateFileData,
  UpdateFileData,
  FileUploadErrorCode,
} from '@/types/file-upload';

import {
  StorageProvider,
  StorageServiceConfig,
  FileUploadConfig,
  FileValidationResult,
  SupportedFileType,
  FILE_UPLOAD_ERROR_CODES
} from '@/types/file-upload';

import { cloudinaryServiceConfig, validateCloudinaryConfig } from './cloudinary-config';
import { uploadcareServiceConfig, validateUploadcareConfig } from './uploadcare-config';

/**
 * Available storage providers
 */
export const STORAGE_PROVIDERS = {
  CLOUDINARY: 'cloudinary' as const,
  UPLOADCARE: 'uploadcare' as const,
  LOCAL: 'local' as const,
  AWS_S3: 'aws-s3' as const,
};

/**
 * Default storage provider based on environment
 */
export const DEFAULT_STORAGE_PROVIDER: StorageProvider =
  process.env.DEFAULT_STORAGE_PROVIDER as StorageProvider || 'cloudinary';

/**
 * Get storage configuration for a specific provider
 */
export const getStorageConfig = (provider: StorageProvider): StorageServiceConfig => {
  switch (provider) {
    case 'cloudinary':
      return cloudinaryServiceConfig;
    case 'uploadcare':
      return uploadcareServiceConfig;
    case 'local':
      // TODO: Implement local storage configuration
      throw new Error('Local storage not yet implemented');
    case 'aws-s3':
      // TODO: Implement AWS S3 configuration
      throw new Error('AWS S3 storage not yet implemented');
    default:
      throw new Error(`Unsupported storage provider: ${provider}`);
  }
};

/**
 * Get upload configuration for a specific provider
 */
export const getUploadConfig = (provider: StorageProvider): FileUploadConfig => {
  const config = getStorageConfig(provider);
  return config.defaultConfig;
};

/**
 * Validate file before upload
 */
export const validateFile = (
  file: File,
  config: FileUploadConfig
): FileValidationResult => {
  const errors: FileValidationResult['errors'] = [];
  const warnings: FileValidationResult['warnings'] = [];

  // Check file size
  if (file.size > config.maxFileSize) {
    errors.push({
      code: 'FILE_TOO_LARGE',
      message: `File size (${Math.round(file.size / (1024 * 1024))}MB) exceeds maximum allowed size (${Math.round(config.maxFileSize / (1024 * 1024))}MB)`,
      field: 'fileSize',
    });
  }

  // Check file type
  if (!config.allowedTypes.includes(file.type as SupportedFileType)) {
    errors.push({
      code: 'INVALID_TYPE',
      message: `File type "${file.type}" is not allowed`,
      field: 'mimeType',
    });
  }

  // Check blocked types
  if (config.blockedTypes?.includes(file.type)) {
    errors.push({
      code: 'INVALID_TYPE',
      message: `File type "${file.type}" is blocked for security reasons`,
      field: 'mimeType',
    });
  }

  // File name validation
  if (file.name.length > 255) {
    warnings.push({
      code: 'LONG_FILENAME',
      message: 'File name is very long and may be truncated',
    });
  }

  // Check for potentially dangerous file extensions
  const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.jar'];
  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

  if (dangerousExtensions.includes(fileExtension)) {
    errors.push({
      code: 'MALICIOUS_CONTENT',
      message: `File extension "${fileExtension}" is not allowed for security reasons`,
      field: 'fileName',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Validate multiple files for batch upload
 */
export const validateFiles = (
  files: File[],
  config: FileUploadConfig
): FileValidationResult => {
  const allErrors: FileValidationResult['errors'] = [];
  const allWarnings: FileValidationResult['warnings'] = [];

  // Check total size if configured
  if (config.maxTotalSize) {
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > config.maxTotalSize) {
      allErrors.push({
        code: 'FILE_TOO_LARGE',
        message: `Total file size (${Math.round(totalSize / (1024 * 1024))}MB) exceeds maximum allowed total size (${Math.round(config.maxTotalSize / (1024 * 1024))}MB)`,
      });
    }
  }

  // Validate each file
  files.forEach((file, index) => {
    const validation = validateFile(file, config);

    // Add file index to error messages
    validation.errors.forEach(error => {
      allErrors.push({
        ...error,
        message: `File ${index + 1}: ${error.message}`,
      });
    });

    validation.warnings?.forEach(warning => {
      allWarnings.push({
        ...warning,
        message: `File ${index + 1}: ${warning.message}`,
      });
    });
  });

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
  };
};

/**
 * Get file type category
 */
export const getFileTypeCategory = (mimeType: string): 'image' | 'document' | 'video' | 'audio' | 'other' => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.includes('pdf') || mimeType.startsWith('text/') || mimeType.includes('document')) {
    return 'document';
  }
  return 'other';
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Generate unique file name
 */
export const generateUniqueFileName = (originalName: string): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = originalName.substring(originalName.lastIndexOf('.'));
  const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.'));

  return `${nameWithoutExt}_${timestamp}_${random}${extension}`;
};

/**
 * Validate all storage configurations
 */
export const validateAllStorageConfigs = (): Record<StorageProvider, boolean> => {
  return {
    cloudinary: validateCloudinaryConfig(),
    uploadcare: validateUploadcareConfig(),
    local: false, // Not implemented yet
    'aws-s3': false, // Not implemented yet
  };
};

/**
 * Get available storage providers
 */
export const getAvailableProviders = (): StorageProvider[] => {
  const validations = validateAllStorageConfigs();
  return Object.entries(validations)
    .filter(([_, isValid]) => isValid)
    .map(([provider]) => provider as StorageProvider);
};

/**
 * Storage service health check
 */
export const checkStorageHealth = async (): Promise<Record<StorageProvider, boolean>> => {
  const results: Record<string, boolean> = {};

  // Check Cloudinary
  try {
    results.cloudinary = validateCloudinaryConfig();
  } catch {
    results.cloudinary = false;
  }

  // Check Uploadcare
  try {
    results.uploadcare = validateUploadcareConfig();
  } catch {
    results.uploadcare = false;
  }

  // Other providers
  results.local = false; // Not implemented
  results['aws-s3'] = false; // Not implemented

  return results as Record<StorageProvider, boolean>;
};

/**
 * Default export for convenience
 */
export default {
  providers: STORAGE_PROVIDERS,
  defaultProvider: DEFAULT_STORAGE_PROVIDER,
  getStorageConfig,
  getUploadConfig,
  validateFile,
  validateFiles,
  getFileTypeCategory,
  formatFileSize,
  generateUniqueFileName,
  validateAllStorageConfigs,
  getAvailableProviders,
  checkStorageHealth,
  errorCodes: FILE_UPLOAD_ERROR_CODES,
};
