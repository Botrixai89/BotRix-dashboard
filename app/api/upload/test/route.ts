import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function GET(request: NextRequest) {
  try {
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    
    // Test directory creation
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }
    
    // Test file writing
    const testFile = join(uploadDir, 'test.txt');
    await writeFile(testFile, 'test content');
    
    // Test file reading
    const content = await readFile(testFile, 'utf-8');
    
    return NextResponse.json({
      success: true,
      uploadDir,
      testFile,
      content,
      message: 'Upload directory is working correctly'
    });
  } catch (error) {
    console.error('Upload test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Upload directory test failed'
    }, { status: 500 });
  }
} 