/**
 * User Preferences API Route
 *
 * This API route handles user preference management with full CRUD operations.
 * It provides secure endpoints for reading and updating user preferences
 * with proper authentication, validation, and error handling.
 *
 * Endpoints:
 * - GET /api/user/preferences - Fetch current user preferences
 * - PUT /api/user/preferences - Update user preferences (partial or full)
 *
 * Features:
 * - Clerk authentication integration
 * - Input validation and sanitization
 * - Database transaction support
 * - Comprehensive error handling
 * - Type-safe operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserByClerkId, updateUser, withTransaction } from '@/lib/db';
import type { IUser } from '@/types/database';

// ========================================
// TYPE DEFINITIONS
// ========================================

/**
 * Valid theme options
 */
const VALID_THEMES = ['light', 'dark', 'system'] as const;
type Theme = typeof VALID_THEMES[number];

/**
 * Valid AI model options
 */
const VALID_MODELS = ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo'] as const;
type AIModel = typeof VALID_MODELS[number];

/**
 * Valid font size options
 */
const VALID_FONT_SIZES = ['small', 'medium', 'large'] as const;
type FontSize = typeof VALID_FONT_SIZES[number];

/**
 * Preference update input interface
 */
interface PreferenceUpdateInput {
  theme?: Theme;
  model?: AIModel;
  language?: string;
  fontSize?: FontSize;
  aiModel?: AIModel;
  soundEnabled?: boolean;
  emailNotifications?: boolean;
}

/**
 * API Response interface
 */
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// ========================================
// VALIDATION UTILITIES
// ========================================

/**
 * Validate theme value
 */
function isValidTheme(theme: any): theme is Theme {
  return VALID_THEMES.includes(theme);
}

/**
 * Validate model value
 */
function isValidModel(model: any): model is AIModel {
  return VALID_MODELS.includes(model);
}

/**
 * Validate font size value
 */
function isValidFontSize(fontSize: any): fontSize is FontSize {
  return VALID_FONT_SIZES.includes(fontSize);
}

/**
 * Validate language code (basic validation for 2-5 character codes)
 */
function isValidLanguage(language: any): language is string {
  return typeof language === 'string' && 
         language.length >= 2 && 
         language.length <= 5 &&
         /^[a-z]{2}(-[A-Z]{2})?$/.test(language);
}

/**
 * Validate boolean value
 */
function isValidBoolean(value: any): value is boolean {
  return typeof value === 'boolean';
}

/**
 * Validate and sanitize preference input
 */
function validatePreferences(input: any): {
  valid: boolean;
  preferences?: PreferenceUpdateInput;
  errors: string[];
} {
  const errors: string[] = [];
  const preferences: PreferenceUpdateInput = {};

  // Validate theme
  if (input.theme !== undefined) {
    if (isValidTheme(input.theme)) {
      preferences.theme = input.theme;
    } else {
      errors.push(`Invalid theme. Must be one of: ${VALID_THEMES.join(', ')}`);
    }
  }

  // Validate model (check both 'model' and 'aiModel' for compatibility)
  if (input.model !== undefined) {
    if (isValidModel(input.model)) {
      preferences.aiModel = input.model; // Store as aiModel in DB
    } else {
      errors.push(`Invalid model. Must be one of: ${VALID_MODELS.join(', ')}`);
    }
  }

  if (input.aiModel !== undefined) {
    if (isValidModel(input.aiModel)) {
      preferences.aiModel = input.aiModel;
    } else {
      errors.push(`Invalid aiModel. Must be one of: ${VALID_MODELS.join(', ')}`);
    }
  }

  // Validate language
  if (input.language !== undefined) {
    if (isValidLanguage(input.language)) {
      preferences.language = input.language.toLowerCase();
    } else {
      errors.push('Invalid language code. Must be 2-5 characters (e.g., "en", "en-US")');
    }
  }

  // Validate fontSize
  if (input.fontSize !== undefined) {
    if (isValidFontSize(input.fontSize)) {
      preferences.fontSize = input.fontSize;
    } else {
      errors.push(`Invalid fontSize. Must be one of: ${VALID_FONT_SIZES.join(', ')}`);
    }
  }

  // Validate boolean preferences
  if (input.soundEnabled !== undefined) {
    if (isValidBoolean(input.soundEnabled)) {
      preferences.soundEnabled = input.soundEnabled;
    } else {
      errors.push('soundEnabled must be a boolean');
    }
  }

  if (input.emailNotifications !== undefined) {
    if (isValidBoolean(input.emailNotifications)) {
      preferences.emailNotifications = input.emailNotifications;
    } else {
      errors.push('emailNotifications must be a boolean');
    }
  }

  return {
    valid: errors.length === 0,
    preferences: errors.length === 0 ? preferences : undefined,
    errors
  };
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Create standardized error response
 */
function createErrorResponse(
  code: string, 
  message: string, 
  status: number = 400,
  details?: any
): NextResponse {
  return NextResponse.json({
    success: false,
    error: { code, message, details }
  }, { status });
}

/**
 * Create standardized success response
 */
function createSuccessResponse<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json({
    success: true,
    data
  }, { status });
}

/**
 * Get authenticated user from database
 */
async function getAuthenticatedUser(clerkId: string): Promise<{
  user?: IUser;
  error?: NextResponse;
}> {
  const userResult = await getUserByClerkId(clerkId);
  
  if (!userResult.success) {
    if (userResult.error?.code === 'USER_NOT_FOUND') {
      return {
        error: createErrorResponse(
          'USER_NOT_FOUND',
          'User profile not found. Please sign in again.',
          404
        )
      };
    }
    
    return {
      error: createErrorResponse(
        'DATABASE_ERROR',
        'Failed to fetch user data',
        500,
        userResult.error
      )
    };
  }

  return { user: userResult.data };
}

// ========================================
// API ROUTE HANDLERS
// ========================================

/**
 * GET /api/user/preferences
 * Fetch current user preferences
 */
export async function GET(): Promise<NextResponse> {
  try {
    // Check authentication
    const { userId } = await auth();
    
    if (!userId) {
      return createErrorResponse(
        'UNAUTHENTICATED',
        'Authentication required',
        401
      );
    }

    // Get user from database
    const { user, error } = await getAuthenticatedUser(userId);
    if (error) return error;
    if (!user) {
      return createErrorResponse(
        'USER_NOT_FOUND',
        'User not found',
        404
      );
    }

    // Return user preferences
    return createSuccessResponse({
      preferences: user.preferences,
      lastUpdated: user.updatedAt
    });

  } catch (error) {
    console.error('[GET /api/user/preferences] Error:', error);
    return createErrorResponse(
      'INTERNAL_ERROR',
      'An unexpected error occurred',
      500
    );
  }
}

/**
 * PUT /api/user/preferences
 * Update user preferences (partial or full update)
 */
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    // Check authentication
    const { userId } = await auth();
    
    if (!userId) {
      return createErrorResponse(
        'UNAUTHENTICATED',
        'Authentication required',
        401
      );
    }

    // Parse request body
    let requestBody: any;
    try {
      requestBody = await request.json();
    } catch (parseError) {
      return createErrorResponse(
        'INVALID_JSON',
        'Invalid JSON in request body',
        400
      );
    }

    // Validate preferences input
    const validation = validatePreferences(requestBody);
    if (!validation.valid) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        'Invalid preference values',
        400,
        { errors: validation.errors }
      );
    }

    if (!validation.preferences || Object.keys(validation.preferences).length === 0) {
      return createErrorResponse(
        'NO_UPDATES',
        'No valid preference updates provided',
        400
      );
    }

    // Get current user to ensure they exist
    const { user, error } = await getAuthenticatedUser(userId);
    if (error) return error;
    if (!user) {
      return createErrorResponse(
        'USER_NOT_FOUND',
        'User not found',
        404
      );
    }

    // Update user preferences in database with transaction
    const updateResult = await withTransaction(async (session) => {
      return await updateUser(
        userId,
        {
          preferences: {
            // Merge with existing preferences
            ...user.preferences,
            ...validation.preferences
          }
        },
        session
      );
    });

    if (!updateResult.success) {
      console.error('Failed to update user preferences:', updateResult.error);
      return createErrorResponse(
        'UPDATE_FAILED',
        'Failed to update preferences',
        500,
        updateResult.error
      );
    }

    // Return updated preferences
    return createSuccessResponse({
      preferences: updateResult.data!.preferences,
      lastUpdated: updateResult.data!.updatedAt,
      message: 'Preferences updated successfully'
    });

  } catch (error) {
    console.error('[PUT /api/user/preferences] Error:', error);
    return createErrorResponse(
      'INTERNAL_ERROR',
      'An unexpected error occurred',
      500
    );
  }
}

// ========================================
// ADDITIONAL METHODS (Optional)
// ========================================

/**
 * PATCH /api/user/preferences
 * Alternative endpoint for partial updates (if needed)
 */
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  // Delegate to PUT handler for consistency
  return PUT(request);
}

/**
 * OPTIONS /api/user/preferences
 * Handle CORS preflight requests
 */
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
} 