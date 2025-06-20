/**
 * Environment Debug API
 * 
 * Simple endpoint to check environment variable configuration
 */

import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🔍 Checking environment variables...');
    
    return NextResponse.json({
      success: true,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        MONGODB_URI: process.env.MONGODB_URI ? 'SET (hidden)' : 'NOT SET',
        MONGODB_URI_LENGTH: process.env.MONGODB_URI?.length || 0,
        MONGODB_URI_PREFIX: process.env.MONGODB_URI?.substring(0, 20) || 'N/A',
      },
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('❌ Environment check failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
} 