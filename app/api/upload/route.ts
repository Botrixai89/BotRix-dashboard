import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    console.log('Upload API called');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      console.log('No file provided in request');
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate that file is actually a File object
    if (!(file instanceof File)) {
      console.log('Invalid file object:', typeof file);
      return NextResponse.json({ error: 'Invalid file object' }, { status: 400 });
    }

    console.log('File received:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    // Validate file type (only images for logos)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      console.log('Invalid file type:', file.type);
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      console.log('File too large:', file.size);
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 });
    }

    // Create upload directory with better error handling
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    console.log('Upload directory:', uploadDir);
    
    try {
      if (!existsSync(uploadDir)) {
        console.log('Creating upload directory...');
        await mkdir(uploadDir, { recursive: true });
        console.log('Upload directory created successfully');
      }
    } catch (dirError) {
      console.error('Error creating upload directory:', dirError);
      return NextResponse.json({ error: 'Failed to create upload directory' }, { status: 500 });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split('.').pop() || 'jpg';
    const filename = `${timestamp}-${random}.${extension}`;
    const filePath = join(uploadDir, filename);

    console.log('Saving file to:', filePath);

    try {
      // Validate that arrayBuffer method exists
      if (typeof file.arrayBuffer !== 'function') {
        throw new Error('File.arrayBuffer method is not available');
      }

      // Convert file to buffer and save
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);
      console.log('File saved successfully');
    } catch (writeError) {
      console.error('Error writing file:', writeError);
      return NextResponse.json({ 
        error: 'Failed to save file',
        details: writeError instanceof Error ? writeError.message : 'Unknown write error'
      }, { status: 500 });
    }

    // Generate URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const url = `${baseUrl}/uploads/${filename}`;

    console.log('Upload successful, URL:', url);
    return NextResponse.json({ url });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ 
      error: 'Upload failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 