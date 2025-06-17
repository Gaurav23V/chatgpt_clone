/**
 * File Upload Type Definitions for ChatGPT Clone
 *
 * This file contains TypeScript interfaces for file upload functionality,
 * storage service responses, and file metadata handling across different
 * storage providers (Cloudinary, Uploadcare, local storage).
 */

/**
 * Supported file types for uploads
 */
export type SupportedFileType =
  | 'image/jpeg'
  | 'image/png'
  | 'image/gif'
  | 'image/webp'
  | 'image/svg+xml'
  | 'text/plain'
  | 'text/markdown'
  | 'application/pdf'
  | 'application/json'
  | 'application/javascript'
  | 'text/css'
  | 'text/html'
  | 'text/csv';

/**
 * Storage providers supported by the application
 */
export type StorageProvider = 'cloudinary' | 'uploadcare' | 'local' | 'aws-s3';

/**
 * File upload status during processing
 */
export type UploadStatus =
  | 'pending'
  | 'uploading'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'deleted';

/**
 * Base file information interface
 */
export interface BaseFileInfo {
  originalName: string;
  fileName: string;
  fileSize: number;
  mimeType: SupportedFileType;
  fileExtension: string;
  uploadedAt: Date;
  checksum?: string;
}

/**
 * Image-specific metadata
 */
export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  hasTransparency: boolean;
  colorSpace: string;
  orientation?: number;
  dpi?: number;
  quality?: number;
}

/**
 * File processing options
 */
export interface FileProcessingOptions {
  // Image processing
  resize?: {
    width?: number;
    height?: number;
    fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
    quality?: number;
  };

  // Format conversion
  format?: 'auto' | 'webp' | 'avif' | 'png' | 'jpg';

  // Optimization
  optimize?: boolean;
  progressive?: boolean;

  // Text extraction (for documents)
  extractText?: boolean;

  // Security scanning
  scanForMalware?: boolean;
}

/**
 * Generic file upload response interface
 */
export interface FileUploadResponse {
  success: boolean;
  file?: ProcessedFileMetadata;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  uploadId?: string;
  provider: StorageProvider;
}

/**
 * Processed file metadata after upload and processing
 */
export interface ProcessedFileMetadata extends BaseFileInfo {
  id: string;
  publicId?: string; // For CDN providers
  url: string;
  secureUrl?: string;
  thumbnailUrl?: string;
  provider: StorageProvider;
  status: UploadStatus;

  // Processing metadata
  processingTime?: number;
  processingError?: string;

  // Image-specific data
  imageMetadata?: ImageMetadata;

  // Text extraction results
  extractedText?: string;

  // Security scan results
  securityScan?: {
    isClean: boolean;
    scanResult: 'clean' | 'infected' | 'suspicious' | 'pending';
    scanDetails?: string;
  };

  // Access control
  isPublic: boolean;
  expiresAt?: Date;

  // Usage tracking
  downloadCount: number;
  lastAccessedAt?: Date;
}

/**
 * Cloudinary-specific response interface
 */
export interface CloudinaryUploadResponse {
  public_id: string;
  version: number;
  signature: string;
  width?: number;
  height?: number;
  format: string;
  resource_type: 'image' | 'video' | 'raw' | 'auto';
  created_at: string;
  tags: string[];
  bytes: number;
  type: string;
  etag: string;
  placeholder: boolean;
  url: string;
  secure_url: string;
  access_mode: string;
  original_filename: string;
  eager?: Array<{
    transformation: string;
    width: number;
    height: number;
    url: string;
    secure_url: string;
  }>;
}

/**
 * Uploadcare-specific response interface
 */
export interface UploadcareUploadResponse {
  uuid: string;
  name: string;
  size: number;
  isStored: boolean;
  isImage: boolean;
  mimeType: string;
  cdnUrl: string;
  s3Url?: string;
  originalFilename: string;
  imageInfo?: {
    width: number;
    height: number;
    geoLocation?: {
      latitude: number;
      longitude: number;
    };
    datetimeOriginal?: string;
    format: string;
    colorMode: string;
    orientation?: number;
    dpi?: [number, number];
  };
  videoInfo?: {
    duration: number;
    format: string;
    bitrate: number;
    video: {
      height: number;
      width: number;
      frameRate: number;
      bitrate: number;
      codec: string;
    };
    audio?: {
      bitrate: number;
      codec: string;
      sampleRate: number;
      channels: string;
    };
  };
}

/**
 * File upload configuration interface
 */
export interface FileUploadConfig {
  // Provider settings
  provider: StorageProvider;

  // Size limits (in bytes)
  maxFileSize: number;
  maxTotalSize?: number;

  // File type restrictions
  allowedTypes: SupportedFileType[];
  blockedTypes?: string[];

  // Processing options
  autoProcess?: boolean;
  processingOptions?: FileProcessingOptions;

  // Security settings
  requireAuth?: boolean;
  scanForMalware?: boolean;

  // Storage settings
  publicAccess?: boolean;
  expirationTime?: number; // in seconds

  // Callback URLs
  webhookUrl?: string;
  successRedirect?: string;
  errorRedirect?: string;
}

/**
 * Upload progress information
 */
export interface UploadProgress {
  uploadId: string;
  fileName: string;
  bytesUploaded: number;
  totalBytes: number;
  percentage: number;
  status: UploadStatus;
  speed?: number; // bytes per second
  timeRemaining?: number; // seconds
  error?: string;
}

/**
 * Batch upload response for multiple files
 */
export interface BatchUploadResponse {
  success: boolean;
  uploadId: string;
  files: Array<{
    fileName: string;
    status: UploadStatus;
    result?: ProcessedFileMetadata;
    error?: string;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
    pending: number;
  };
}

/**
 * File validation result
 */
export interface FileValidationResult {
  isValid: boolean;
  errors: Array<{
    code: 'FILE_TOO_LARGE' | 'INVALID_TYPE' | 'MALICIOUS_CONTENT' | 'CORRUPTED_FILE';
    message: string;
    field?: string;
  }>;
  warnings?: Array<{
    code: string;
    message: string;
  }>;
}

/**
 * Storage service configuration
 */
export interface StorageServiceConfig {
  provider: StorageProvider;
  apiKey?: string;
  apiSecret?: string;
  cloudName?: string; // Cloudinary specific
  publicKey?: string; // Uploadcare specific
  secretKey?: string; // Uploadcare specific
  region?: string; // AWS specific
  bucket?: string; // AWS specific
  endpoint?: string;

  // Default settings
  defaultConfig: FileUploadConfig;
}

/**
 * File transformation options (for image processing)
 */
export interface FileTransformation {
  // Resize operations
  width?: number;
  height?: number;
  crop?: 'fill' | 'fit' | 'scale' | 'crop' | 'thumb' | 'auto';
  gravity?: 'center' | 'north' | 'south' | 'east' | 'west' | 'face' | 'auto';

  // Quality and format
  quality?: number | 'auto';
  format?: 'auto' | 'webp' | 'avif' | 'png' | 'jpg' | 'gif';

  // Effects
  blur?: number;
  sharpen?: number;
  brightness?: number;
  contrast?: number;
  saturation?: number;

  // Overlays
  overlay?: {
    text?: string;
    image?: string;
    position?: string;
    opacity?: number;
  };
}

/**
 * File search and filtering options
 */
export interface FileSearchOptions {
  query?: string;
  provider?: StorageProvider;
  fileType?: SupportedFileType;
  uploadedAfter?: Date;
  uploadedBefore?: Date;
  minSize?: number;
  maxSize?: number;
  isPublic?: boolean;
  tags?: string[];

  // Pagination
  page?: number;
  limit?: number;
  sortBy?: 'uploadedAt' | 'fileName' | 'fileSize' | 'downloadCount';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Utility types for creating and updating file records
 */
export type CreateFileData = Omit<ProcessedFileMetadata, 'id' | 'downloadCount' | 'lastAccessedAt'>;
export type UpdateFileData = Partial<Pick<ProcessedFileMetadata, 'isPublic' | 'expiresAt' | 'extractedText'>>;

/**
 * Error codes for file upload operations
 */
export const FILE_UPLOAD_ERROR_CODES = {
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  UPLOAD_FAILED: 'UPLOAD_FAILED',
  PROCESSING_FAILED: 'PROCESSING_FAILED',
  MALWARE_DETECTED: 'MALWARE_DETECTED',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  AUTHENTICATION_FAILED: 'AUTHENTICATION_FAILED',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  FILE_CORRUPTED: 'FILE_CORRUPTED',
} as const;

export type FileUploadErrorCode = typeof FILE_UPLOAD_ERROR_CODES[keyof typeof FILE_UPLOAD_ERROR_CODES];
