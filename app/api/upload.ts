import { NextRequest, NextResponse } from 'next/server';
import { fileUploadService } from '@/lib/file-upload';

export async function POST(request: NextRequest) {
  try {
    const uploaded = await fileUploadService.uploadFile(request);
    return NextResponse.json({ url: uploaded.url });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message || 'Upload failed' }, { status: 400 });
  }
} 