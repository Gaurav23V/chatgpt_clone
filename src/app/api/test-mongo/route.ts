/**
 * MongoDB Connection Test API
 *
 * Simple endpoint to test MongoDB connection without authentication
 */

import { NextResponse } from 'next/server';

import mongoose from 'mongoose';

import { connectToDatabase, getConnectionStatus } from '@/lib/db/connection';

export async function GET() {
  try {
    console.log('🔍 Testing MongoDB connection...');

    // Test connection
    const connection = await connectToDatabase();
    const status = getConnectionStatus();

    console.log('📊 Connection status:', status);

    // Test a simple ping to the database
    const db = connection.db;
    const pingResult = db ? await db.admin().ping() : null;

    console.log('🏓 Database ping result:', pingResult);

    return NextResponse.json({
      success: true,
      message: 'MongoDB connection successful',
      connectionInfo: {
        isConnected: status.isConnected,
        readyState: status.readyState,
        host: status.host,
        port: status.port,
        database: status.name,
      },
      pingResult,
      mongooseReadyState: mongoose.connection.readyState,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ MongoDB test failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * Use Node.js runtime for MongoDB compatibility
 */
// No edge runtime - using Node.js for MongoDB
