import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { exportService } from '@/lib/services/export.service';
import { ExportRequest } from '@/types/export';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const body = await request.json();
    const exportRequest: ExportRequest = {
      ...body,
      userId,
    };

    // Validate required fields
    if (!exportRequest.type || !exportRequest.format) {
      return NextResponse.json(
        { error: 'Missing required fields: type and format' },
        { status: 400 }
      );
    }

    const job = await exportService.createExportJob(exportRequest);

    return NextResponse.json({ job });
  } catch (error) {
    console.error('Export creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create export' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const jobs = await exportService.getUserExportJobs(userId);

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error('Export list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exports' },
      { status: 500 }
    );
  }
}
