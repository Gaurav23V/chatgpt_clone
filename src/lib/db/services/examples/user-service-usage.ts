/**
 * User Service Usage Examples
 *
 * This file demonstrates how to use the user service layer in real
 * application scenarios within the ChatGPT clone.
 */

import {
  batchUpdateUserPreferences,
  type ClerkUserData,
  createUser,
  deleteUser,
  getUserBasicInfo,
  getUserByClerkId,
  getUserPreferences,
  handleUserCreated,
  handleUserDeleted,
  handleUserUpdated,
  type ServiceResult,
  updateUser,
  type UpdateUserInput,
  updateUserPreferences,
  upsertUser,
  userExists,
  withTransaction,
} from '../user.service';

// ========================================
// WEBHOOK HANDLERS
// ========================================

/**
 * Example: Handle Clerk user.created webhook
 * Called when a new user signs up via Clerk
 */
export async function handleClerkUserCreated(clerkUserData: ClerkUserData) {
  try {
    console.log(`Creating user for Clerk ID: ${clerkUserData.id}`);

    const result = await handleUserCreated(clerkUserData);

    if (result.success) {
      console.log('✅ User created successfully:', result.data?.clerkId);

      // Optional: Send welcome email, set up default preferences, etc.
      await setupNewUserDefaults(result.data!);

      return { success: true, userId: result.data!._id };
    } else {
      console.error('❌ Failed to create user:', result.error?.message);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('❌ Unexpected error in user creation:', error);
    return { success: false, error };
  }
}

/**
 * Example: Handle Clerk user.updated webhook
 * Called when user updates their profile in Clerk
 */
export async function handleClerkUserUpdated(clerkUserData: ClerkUserData) {
  try {
    console.log(`Updating user for Clerk ID: ${clerkUserData.id}`);

    const result = await handleUserUpdated(clerkUserData);

    if (result.success) {
      const { user, created } = result.data!;

      if (created) {
        console.log('✅ User created (via update webhook):', user.clerkId);
        await setupNewUserDefaults(user);
      } else {
        console.log('✅ User updated successfully:', user.clerkId);
      }

      return { success: true, user, created };
    } else {
      console.error('❌ Failed to update user:', result.error?.message);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('❌ Unexpected error in user update:', error);
    return { success: false, error };
  }
}

/**
 * Example: Handle Clerk user.deleted webhook
 * Called when user deletes their account
 */
export async function handleClerkUserDeleted(
  clerkId: string,
  hardDelete = false
) {
  try {
    console.log(`Deleting user: ${clerkId} (hard: ${hardDelete})`);

    const result = await handleUserDeleted(clerkId, hardDelete);

    if (result.success) {
      console.log('✅ User deleted successfully:', clerkId);

      // Optional: Send goodbye email, analytics cleanup, etc.
      await cleanupUserData(clerkId);

      return { success: true, deleted: true };
    } else {
      console.error('❌ Failed to delete user:', result.error?.message);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('❌ Unexpected error in user deletion:', error);
    return { success: false, error };
  }
}

// ========================================
// API ROUTE HANDLERS
// ========================================

/**
 * Example: GET /api/user - Get current user info
 * Used in layouts, headers, and profile pages
 */
export async function getCurrentUser(clerkId: string) {
  try {
    // Use basic info for performance if only displaying name/email
    const result = await getUserBasicInfo(clerkId);

    if (result.success) {
      return {
        success: true,
        user: result.data,
      };
    } else {
      return {
        success: false,
        error: result.error?.message || 'User not found',
        status: result.error?.code === 'USER_NOT_FOUND' ? 404 : 500,
      };
    }
  } catch (error) {
    console.error('Error fetching current user:', error);
    return {
      success: false,
      error: 'Internal server error',
      status: 500,
    };
  }
}

/**
 * Example: PUT /api/user - Update user profile
 * Used in profile/settings pages
 */
export async function updateUserProfile(
  clerkId: string,
  updates: UpdateUserInput
) {
  try {
    const result = await updateUser(clerkId, updates);

    if (result.success) {
      return {
        success: true,
        user: result.data,
        message: 'Profile updated successfully',
      };
    } else {
      return {
        success: false,
        error: result.error?.message || 'Failed to update profile',
        status: result.error?.code === 'USER_NOT_FOUND' ? 404 : 400,
      };
    }
  } catch (error) {
    console.error('Error updating user profile:', error);
    return {
      success: false,
      error: 'Internal server error',
      status: 500,
    };
  }
}

/**
 * Example: GET /api/user/preferences - Get user preferences
 * Used in settings pages and for applying user preferences
 */
export async function getUserPrefs(clerkId: string) {
  try {
    const result = await getUserPreferences(clerkId);

    if (result.success) {
      return {
        success: true,
        preferences: result.data,
      };
    } else {
      return {
        success: false,
        error: result.error?.message || 'Failed to fetch preferences',
        status: result.error?.code === 'USER_NOT_FOUND' ? 404 : 500,
      };
    }
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return {
      success: false,
      error: 'Internal server error',
      status: 500,
    };
  }
}

/**
 * Example: PUT /api/user/preferences - Update user preferences
 * Used in settings pages for theme, AI model, etc.
 */
export async function updateUserPrefs(
  clerkId: string,
  preferences: Parameters<typeof updateUserPreferences>[1]
) {
  try {
    const result = await updateUserPreferences(clerkId, preferences);

    if (result.success) {
      return {
        success: true,
        user: result.data,
        message: 'Preferences updated successfully',
      };
    } else {
      return {
        success: false,
        error: result.error?.message || 'Failed to update preferences',
        status:
          result.error?.code === 'USER_NOT_FOUND'
            ? 404
            : result.error?.code === 'VALIDATION_ERROR'
              ? 400
              : 500,
      };
    }
  } catch (error) {
    console.error('Error updating user preferences:', error);
    return {
      success: false,
      error: 'Internal server error',
      status: 500,
    };
  }
}

// ========================================
// AUTHENTICATION MIDDLEWARE HELPERS
// ========================================

/**
 * Example: Check if user exists for auth middleware
 * Used to verify user exists before allowing access to protected routes
 */
export async function verifyUserExists(clerkId: string): Promise<boolean> {
  try {
    const result = await userExists(clerkId);
    return result.success && result.data === true;
  } catch (error) {
    console.error('Error verifying user existence:', error);
    return false;
  }
}

/**
 * Example: Get user for auth context
 * Used to populate auth context with user data
 */
export async function getUserForAuth(clerkId: string) {
  try {
    const result = await getUserBasicInfo(clerkId);

    if (result.success) {
      return result.data;
    }

    return null;
  } catch (error) {
    console.error('Error getting user for auth:', error);
    return null;
  }
}

// ========================================
// BACKGROUND OPERATIONS
// ========================================

/**
 * Example: Bulk update user preferences
 * Used for migrations, A/B testing, or admin operations
 */
export async function bulkUpdatePreferences(
  updates: Array<{ clerkId: string; preferences: any }>
) {
  try {
    console.log(`Starting bulk update for ${updates.length} users...`);

    const result = await batchUpdateUserPreferences(updates);

    if (result.success) {
      const { modifiedCount, errors } = result.data!;

      console.log(
        `✅ Bulk update completed: ${modifiedCount} updated, ${errors.length} errors`
      );

      if (errors.length > 0) {
        console.warn('Errors during bulk update:', errors);
      }

      return {
        success: true,
        modifiedCount,
        errors,
      };
    } else {
      console.error('❌ Bulk update failed:', result.error?.message);
      return {
        success: false,
        error: result.error,
      };
    }
  } catch (error) {
    console.error('❌ Unexpected error in bulk update:', error);
    return {
      success: false,
      error,
    };
  }
}

/**
 * Example: Transaction-based user operations
 * Used when multiple operations need to succeed or fail together
 */
export async function performComplexUserOperation(clerkId: string) {
  try {
    return await withTransaction(async (session) => {
      // Example: Update user profile and preferences atomically
      const profileResult = await updateUser(
        clerkId,
        {
          firstName: 'Updated Name',
        },
        session
      );

      if (!profileResult.success) {
        throw new Error(
          `Failed to update profile: ${profileResult.error?.message}`
        );
      }

      const preferencesResult = await updateUserPreferences(
        clerkId,
        {
          theme: 'dark',
          aiModel: 'gpt-4',
        },
        session
      );

      if (!preferencesResult.success) {
        throw new Error(
          `Failed to update preferences: ${preferencesResult.error?.message}`
        );
      }

      return {
        success: true,
        user: preferencesResult.data,
        message: 'Complex operation completed successfully',
      };
    });
  } catch (error) {
    console.error('Complex operation failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Set up defaults for new users
 */
async function setupNewUserDefaults(user: any) {
  try {
    console.log(`Setting up defaults for new user: ${user.clerkId}`);

    // Example: Set default preferences based on location/browser
    // Example: Create welcome conversation
    // Example: Send welcome email

    console.log('✅ New user setup completed');
  } catch (error) {
    console.error('❌ Error setting up new user:', error);
  }
}

/**
 * Clean up user data after deletion
 */
async function cleanupUserData(clerkId: string) {
  try {
    console.log(`Cleaning up data for deleted user: ${clerkId}`);

    // Example: Remove from analytics
    // Example: Cancel subscriptions
    // Example: Archive conversations

    console.log('✅ User data cleanup completed');
  } catch (error) {
    console.error('❌ Error cleaning up user data:', error);
  }
}

/**
 * Helper to handle service results consistently
 */
export function handleServiceResult<T>(
  result: ServiceResult<T>,
  operation: string
): { success: boolean; data?: T; error?: string; status?: number } {
  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }

  console.error(`${operation} failed:`, result.error);

  const statusMap = {
    USER_NOT_FOUND: 404,
    VALIDATION_ERROR: 400,
    INVALID_CLERK_ID: 400,
    INVALID_EMAIL: 400,
    USER_ALREADY_EXISTS: 409,
    DATABASE_ERROR: 500,
    TRANSACTION_ERROR: 500,
    UNKNOWN_ERROR: 500,
  };

  return {
    success: false,
    error: result.error?.message || 'Unknown error',
    status: statusMap[result.error?.code as keyof typeof statusMap] || 500,
  };
}
