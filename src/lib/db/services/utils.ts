/**
 * Service Layer Utilities
 *
 * This file contains shared utility functions used across different
 * service layers. It includes standardized error handling, success
 * response creation, and logging utilities to ensure consistency.
 */

/**
 * Generic service operation result type.
 * @template T The type of the data returned on success.
 * @template E The type of the error code on failure.
 */
export interface ServiceResult<T, E = string> {
  success: boolean;
  data?: T;
  error?: ServiceError<E>;
}

/**
 * Standardized error object for service failures.
 * @template E The type of the error code.
 */
export interface ServiceError<E> {
  code: E;
  message: string;
  details?: any;
  timestamp: Date;
}

/**
 * Creates a standardized success result object.
 * @template T The type of the data being returned.
 * @param data The data to include in the success result.
 * @returns A successful service result object.
 */
export function createSuccessResult<T, E>(data: T): ServiceResult<T, E> {
  return {
    success: true,
    data,
  };
}

/**
 * Creates a standardized error result object.
 * @template T The type of the data (usually null in error cases).
 * @template E The type of the error code.
 * @param code The error code.
 * @param message The error message.
 * @param details Optional additional details about the error.
 * @returns An error service result object.
 */
export function createErrorResult<T, E>(
  code: E,
  message: string,
  details?: any
): ServiceResult<T, E> {
  return {
    success: false,
    error: {
      code,
      message,
      details,
      timestamp: new Date(),
    },
  };
}

/**
 * Logs a service layer error with a consistent format.
 * @param operation The name of the service operation where the error occurred.
 * @param error The error object.
 * @param context Optional context to include in the log.
 */
export function logError(operation: string, error: any, context?: any): void {
  console.error(`[ServiceError] in ${operation}:`, {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
  });
}
