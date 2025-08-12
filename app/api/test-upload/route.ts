import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Return file info for testing
    return NextResponse.json({
      success: true,
      fileInfo: {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified
      },
      message: 'File received successfully'
    });
  } catch (error) {
    console.error('Test upload error:', error);
    return NextResponse.json(
      { error: 'Test upload failed' },
      { status: 500 }
    );
  }
}
