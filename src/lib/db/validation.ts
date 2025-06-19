/**
 * Database Validation Utilities for ChatGPT Clone
 *
 * Comprehensive validation and sanitization utilities to ensure data integrity
 * and prevent security vulnerabilities in database operations.
 *
 * Features:
 * - Input sanitization to prevent XSS and injection attacks
 * - MongoDB injection prevention
 * - Data type validation with detailed error reporting
 * - Size limit enforcement for various data types
 * - Content filtering and normalization
 * - Validation schemas for all database models
 */

import DOMPurify from 'isomorphic-dompurify';
import type { Types } from 'mongoose';
import validator from 'validator';

// ========================================
// VALIDATION ERROR TYPES
// ========================================

export interface ValidationError {
  field: string;
  value: any;
  message: string;
  code: ValidationErrorCode;
}

export type ValidationErrorCode =
  | 'REQUIRED_FIELD_MISSING'
  | 'INVALID_TYPE'
  | 'INVALID_FORMAT'
  | 'SIZE_LIMIT_EXCEEDED'
  | 'INVALID_ENUM_VALUE'
  | 'MONGODB_INJECTION_DETECTED'
  | 'XSS_CONTENT_DETECTED'
  | 'PROFANITY_DETECTED'
  | 'RATE_LIMIT_EXCEEDED';

export class ValidationException extends Error {
  constructor(
    public errors: ValidationError[],
    message = 'Validation failed'
  ) {
    super(message);
    this.name = 'ValidationException';
  }
}

// ========================================
// SANITIZATION UTILITIES
// ========================================

/**
 * Sanitizes user input to prevent XSS attacks
 */
export function sanitizeHTML(input: string): string {
  if (!input || typeof input !== 'string') return '';

  // Remove HTML tags and potentially dangerous characters
  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>'"&]/g, '') // Remove dangerous characters
    .trim();
}

/**
 * Sanitizes text content while preserving safe formatting
 */
export function sanitizeText(
  input: string,
  options: {
    allowBasicFormatting?: boolean;
    maxLength?: number;
  } = {}
): string {
  if (!input || typeof input !== 'string') return '';

  const { maxLength = 10000 } = options;

  let sanitized = input;

  // Remove HTML tags and dangerous characters
  sanitized = sanitized
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');

  // Trim and enforce length limits
  sanitized = sanitized.trim();
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

/**
 * Prevents MongoDB injection by detecting and rejecting malicious patterns
 */
export function preventMongoInjection(input: any): any {
  if (typeof input === 'string') {
    // Check for MongoDB operators and JavaScript code
    const dangerousPatterns = [
      /\$where/i,
      /\$ne/i,
      /\$in/i,
      /\$nin/i,
      /\$or/i,
      /\$and/i,
      /\$not/i,
      /\$nor/i,
      /\$exists/i,
      /\$type/i,
      /\$mod/i,
      /\$regex/i,
      /\$text/i,
      /\$search/i,
      /function\s*\(/i,
      /javascript:/i,
      /eval\s*\(/i,
      /setTimeout\s*\(/i,
      /setInterval\s*\(/i,
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(input)) {
        throw new ValidationException([
          {
            field: 'input',
            value: input,
            message: 'Potentially malicious input detected',
            code: 'MONGODB_INJECTION_DETECTED',
          },
        ]);
      }
    }

    return input;
  }

  if (typeof input === 'object' && input !== null) {
    if (Array.isArray(input)) {
      return input.map(preventMongoInjection);
    }

    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      // Reject keys starting with $ (MongoDB operators)
      if (key.startsWith('$')) {
        throw new ValidationException([
          {
            field: key,
            value,
            message: 'MongoDB operator keys are not allowed',
            code: 'MONGODB_INJECTION_DETECTED',
          },
        ]);
      }

      sanitized[key] = preventMongoInjection(value);
    }
    return sanitized;
  }

  return input;
}

/**
 * Normalizes email addresses
 */
export function normalizeEmail(email: string): string {
  if (!email || typeof email !== 'string') return '';

  return validator.normalizeEmail(email.trim().toLowerCase()) || '';
}

/**
 * Normalizes username with proper formatting
 */
export function normalizeUsername(username: string): string {
  if (!username || typeof username !== 'string') return '';

  return username
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_.-]/g, '') // Keep only alphanumeric, underscore, dot, dash
    .substring(0, 30); // Enforce max length
}

// ========================================
// VALIDATION FUNCTIONS
// ========================================

/**
 * Validates an email address
 */
export function validateEmail(email: string): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!email) {
    errors.push({
      field: 'email',
      value: email,
      message: 'Email is required',
      code: 'REQUIRED_FIELD_MISSING',
    });
    return errors;
  }

  if (typeof email !== 'string') {
    errors.push({
      field: 'email',
      value: email,
      message: 'Email must be a string',
      code: 'INVALID_TYPE',
    });
    return errors;
  }

  if (!validator.isEmail(email)) {
    errors.push({
      field: 'email',
      value: email,
      message: 'Invalid email format',
      code: 'INVALID_FORMAT',
    });
  }

  if (email.length > 254) {
    errors.push({
      field: 'email',
      value: email,
      message: 'Email address too long (max 254 characters)',
      code: 'SIZE_LIMIT_EXCEEDED',
    });
  }

  return errors;
}

/**
 * Validates a MongoDB ObjectId
 */
export function validateObjectId(
  id: string,
  fieldName = 'id'
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!id) {
    errors.push({
      field: fieldName,
      value: id,
      message: `${fieldName} is required`,
      code: 'REQUIRED_FIELD_MISSING',
    });
    return errors;
  }

  if (typeof id !== 'string') {
    errors.push({
      field: fieldName,
      value: id,
      message: `${fieldName} must be a string`,
      code: 'INVALID_TYPE',
    });
    return errors;
  }

  if (!validator.isMongoId(id)) {
    errors.push({
      field: fieldName,
      value: id,
      message: `Invalid ${fieldName} format`,
      code: 'INVALID_FORMAT',
    });
  }

  return errors;
}

/**
 * Validates a URL
 */
export function validateUrl(
  url: string,
  fieldName = 'url',
  required = false
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!url) {
    if (required) {
      errors.push({
        field: fieldName,
        value: url,
        message: `${fieldName} is required`,
        code: 'REQUIRED_FIELD_MISSING',
      });
    }
    return errors;
  }

  if (typeof url !== 'string') {
    errors.push({
      field: fieldName,
      value: url,
      message: `${fieldName} must be a string`,
      code: 'INVALID_TYPE',
    });
    return errors;
  }

  if (
    !validator.isURL(url, {
      protocols: ['http', 'https'],
      require_protocol: true,
      require_valid_protocol: true,
    })
  ) {
    errors.push({
      field: fieldName,
      value: url,
      message: `Invalid ${fieldName} format`,
      code: 'INVALID_FORMAT',
    });
  }

  if (url.length > 2048) {
    errors.push({
      field: fieldName,
      value: url,
      message: `${fieldName} too long (max 2048 characters)`,
      code: 'SIZE_LIMIT_EXCEEDED',
    });
  }

  return errors;
}

/**
 * Validates text content with configurable options
 */
export function validateText(
  text: string,
  fieldName: string,
  options: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    allowEmpty?: boolean;
    allowNewlines?: boolean;
    pattern?: RegExp;
  } = {}
): ValidationError[] {
  const errors: ValidationError[] = [];
  const {
    required = false,
    minLength = 0,
    maxLength = 10000,
    allowEmpty = true,
    allowNewlines = true,
    pattern,
  } = options;

  if (!text) {
    if (required) {
      errors.push({
        field: fieldName,
        value: text,
        message: `${fieldName} is required`,
        code: 'REQUIRED_FIELD_MISSING',
      });
    }
    return errors;
  }

  if (typeof text !== 'string') {
    errors.push({
      field: fieldName,
      value: text,
      message: `${fieldName} must be a string`,
      code: 'INVALID_TYPE',
    });
    return errors;
  }

  const trimmed = text.trim();

  if (!allowEmpty && trimmed.length === 0) {
    errors.push({
      field: fieldName,
      value: text,
      message: `${fieldName} cannot be empty`,
      code: 'INVALID_FORMAT',
    });
    return errors;
  }

  if (trimmed.length < minLength) {
    errors.push({
      field: fieldName,
      value: text,
      message: `${fieldName} must be at least ${minLength} characters`,
      code: 'SIZE_LIMIT_EXCEEDED',
    });
  }

  if (trimmed.length > maxLength) {
    errors.push({
      field: fieldName,
      value: text,
      message: `${fieldName} cannot exceed ${maxLength} characters`,
      code: 'SIZE_LIMIT_EXCEEDED',
    });
  }

  if (!allowNewlines && /[\r\n]/.test(text)) {
    errors.push({
      field: fieldName,
      value: text,
      message: `${fieldName} cannot contain line breaks`,
      code: 'INVALID_FORMAT',
    });
  }

  if (pattern && !pattern.test(trimmed)) {
    errors.push({
      field: fieldName,
      value: text,
      message: `${fieldName} format is invalid`,
      code: 'INVALID_FORMAT',
    });
  }

  return errors;
}

/**
 * Validates enum values
 */
export function validateEnum<T extends string>(
  value: T,
  allowedValues: readonly T[],
  fieldName: string,
  required = true
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!value) {
    if (required) {
      errors.push({
        field: fieldName,
        value,
        message: `${fieldName} is required`,
        code: 'REQUIRED_FIELD_MISSING',
      });
    }
    return errors;
  }

  if (!allowedValues.includes(value)) {
    errors.push({
      field: fieldName,
      value,
      message: `${fieldName} must be one of: ${allowedValues.join(', ')}`,
      code: 'INVALID_ENUM_VALUE',
    });
  }

  return errors;
}

/**
 * Validates numeric values
 */
export function validateNumber(
  value: number,
  fieldName: string,
  options: {
    required?: boolean;
    min?: number;
    max?: number;
    integer?: boolean;
  } = {}
): ValidationError[] {
  const errors: ValidationError[] = [];
  const { required = false, min, max, integer = false } = options;

  if (value === undefined || value === null) {
    if (required) {
      errors.push({
        field: fieldName,
        value,
        message: `${fieldName} is required`,
        code: 'REQUIRED_FIELD_MISSING',
      });
    }
    return errors;
  }

  if (typeof value !== 'number' || isNaN(value)) {
    errors.push({
      field: fieldName,
      value,
      message: `${fieldName} must be a valid number`,
      code: 'INVALID_TYPE',
    });
    return errors;
  }

  if (integer && !Number.isInteger(value)) {
    errors.push({
      field: fieldName,
      value,
      message: `${fieldName} must be an integer`,
      code: 'INVALID_TYPE',
    });
  }

  if (min !== undefined && value < min) {
    errors.push({
      field: fieldName,
      value,
      message: `${fieldName} must be at least ${min}`,
      code: 'SIZE_LIMIT_EXCEEDED',
    });
  }

  if (max !== undefined && value > max) {
    errors.push({
      field: fieldName,
      value,
      message: `${fieldName} cannot exceed ${max}`,
      code: 'SIZE_LIMIT_EXCEEDED',
    });
  }

  return errors;
}

// ========================================
// MODEL-SPECIFIC VALIDATORS
// ========================================

/**
 * Validates user input data
 */
export function validateUserData(data: any): ValidationError[] {
  const errors: ValidationError[] = [];

  // Prevent injection attacks
  try {
    data = preventMongoInjection(data);
  } catch (error) {
    if (error instanceof ValidationException) {
      errors.push(...error.errors);
    }
  }

  // Validate required fields
  if (data.clerkId) {
    errors.push(
      ...validateText(data.clerkId, 'clerkId', {
        required: true,
        maxLength: 100,
        pattern: /^user_[a-zA-Z0-9]+$/,
      })
    );
  }

  if (data.email) {
    errors.push(...validateEmail(data.email));
  }

  // Validate optional fields
  if (data.firstName !== undefined) {
    errors.push(
      ...validateText(data.firstName, 'firstName', {
        maxLength: 50,
        allowNewlines: false,
      })
    );
  }

  if (data.lastName !== undefined) {
    errors.push(
      ...validateText(data.lastName, 'lastName', {
        maxLength: 50,
        allowNewlines: false,
      })
    );
  }

  if (data.username !== undefined && data.username !== null) {
    errors.push(
      ...validateText(data.username, 'username', {
        maxLength: 30,
        allowNewlines: false,
        pattern: /^[a-zA-Z0-9_.-]+$/,
      })
    );
  }

  if (data.imageUrl !== undefined && data.imageUrl !== null) {
    errors.push(...validateUrl(data.imageUrl, 'imageUrl', false));
  }

  return errors;
}

/**
 * Validates conversation input data
 */
export function validateConversationData(data: any): ValidationError[] {
  const errors: ValidationError[] = [];

  // Prevent injection attacks
  try {
    data = preventMongoInjection(data);
  } catch (error) {
    if (error instanceof ValidationException) {
      errors.push(...error.errors);
    }
  }

  // Validate required fields
  if (data.clerkId) {
    errors.push(
      ...validateText(data.clerkId, 'clerkId', {
        required: true,
        maxLength: 100,
      })
    );
  }

  if (data.title !== undefined) {
    errors.push(
      ...validateText(data.title, 'title', {
        required: true,
        maxLength: 200,
        allowNewlines: false,
      })
    );
  }

  if (data.description !== undefined) {
    errors.push(
      ...validateText(data.description, 'description', {
        maxLength: 500,
      })
    );
  }

  // Validate settings
  if (data.settings) {
    if (data.settings.aiModel) {
      const allowedModels = [
        'gpt-3.5-turbo',
        'gpt-4',
        'gpt-4-turbo',
        'gpt-4o',
        'gpt-4o-mini',
      ] as const;
      errors.push(
        ...validateEnum(data.settings.aiModel, allowedModels, 'aiModel')
      );
    }

    if (data.settings.temperature !== undefined) {
      errors.push(
        ...validateNumber(data.settings.temperature, 'temperature', {
          min: 0,
          max: 2,
        })
      );
    }

    if (data.settings.maxTokens !== undefined) {
      errors.push(
        ...validateNumber(data.settings.maxTokens, 'maxTokens', {
          min: 1,
          max: 32000,
          integer: true,
        })
      );
    }

    if (data.settings.systemMessage !== undefined) {
      errors.push(
        ...validateText(data.settings.systemMessage, 'systemMessage', {
          maxLength: 1000,
        })
      );
    }
  }

  return errors;
}

/**
 * Validates message input data
 */
export function validateMessageData(data: any): ValidationError[] {
  const errors: ValidationError[] = [];

  // Prevent injection attacks
  try {
    data = preventMongoInjection(data);
  } catch (error) {
    if (error instanceof ValidationException) {
      errors.push(...error.errors);
    }
  }

  // Validate required fields
  if (data.conversationId) {
    errors.push(...validateObjectId(data.conversationId, 'conversationId'));
  }

  if (data.clerkId) {
    errors.push(
      ...validateText(data.clerkId, 'clerkId', {
        required: true,
        maxLength: 100,
      })
    );
  }

  if (data.role) {
    const allowedRoles = ['system', 'user', 'assistant'] as const;
    errors.push(...validateEnum(data.role, allowedRoles, 'role'));
  }

  if (data.content !== undefined) {
    errors.push(
      ...validateText(data.content, 'content', {
        required: true,
        maxLength: 16000,
      })
    );
  }

  // Validate attachments
  if (data.attachments && Array.isArray(data.attachments)) {
    data.attachments.forEach((attachment: any, index: number) => {
      if (attachment.originalName) {
        errors.push(
          ...validateText(
            attachment.originalName,
            `attachments[${index}].originalName`,
            {
              required: true,
              maxLength: 255,
              allowNewlines: false,
            }
          )
        );
      }

      if (attachment.fileSize !== undefined) {
        errors.push(
          ...validateNumber(
            attachment.fileSize,
            `attachments[${index}].fileSize`,
            {
              required: true,
              min: 1,
              max: 100 * 1024 * 1024, // 100MB limit
              integer: true,
            }
          )
        );
      }

      if (attachment.mimeType) {
        errors.push(
          ...validateText(
            attachment.mimeType,
            `attachments[${index}].mimeType`,
            {
              required: true,
              maxLength: 100,
              allowNewlines: false,
              pattern:
                /^[a-zA-Z0-9][a-zA-Z0-9!#$&\-^_.]*\/[a-zA-Z0-9][a-zA-Z0-9!#$&\-^_.]*$/,
            }
          )
        );
      }

      if (attachment.storageUrl) {
        errors.push(
          ...validateUrl(
            attachment.storageUrl,
            `attachments[${index}].storageUrl`,
            true
          )
        );
      }
    });
  }

  return errors;
}

// ========================================
// BATCH VALIDATION
// ========================================

/**
 * Validates multiple items and collects all errors
 */
export function validateBatch<T>(
  items: T[],
  validator: (item: T, index: number) => ValidationError[]
): {
  valid: boolean;
  errors: Array<{ index: number; errors: ValidationError[] }>;
} {
  const allErrors: Array<{ index: number; errors: ValidationError[] }> = [];

  items.forEach((item, index) => {
    const errors = validator(item, index);
    if (errors.length > 0) {
      allErrors.push({ index, errors });
    }
  });

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
  };
}

/**
 * Utility to throw ValidationException if errors exist
 */
export function throwIfInvalid(errors: ValidationError[]): void {
  if (errors.length > 0) {
    throw new ValidationException(errors);
  }
}
