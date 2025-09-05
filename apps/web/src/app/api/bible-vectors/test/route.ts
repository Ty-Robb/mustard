import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Check environment variables
  const envCheck = {
    MONGODB_URI: !!process.env.MONGODB_URI,
    GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
    NODE_ENV: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  };

  console.log('Test API - Environment check:', envCheck);

  // Try a simple response without any database connection
  return NextResponse.json({
    status: 'ok',
    message: 'Test endpoint working',
    environment: envCheck
  });
}
