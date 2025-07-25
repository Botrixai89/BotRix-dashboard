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

    // Check if we're in a Vercel environment (read-only filesystem)
    const isVercel = process.env.VERCEL === '1';
    
    // Check if Cloudinary is configured
    const hasCloudinary = process.env.CLOUDINARY_CLOUD_NAME && 
                         process.env.CLOUDINARY_API_KEY && 
                         process.env.CLOUDINARY_API_SECRET;
    
    if (isVercel && hasCloudinary) {
      // Use Cloudinary for production uploads
      return await uploadToCloudinary(file);
    } else if (isVercel && !hasCloudinary) {
      // Fallback to data URL if Cloudinary not configured
      return await convertToDataUrl(file);
    } else {
      // Use local filesystem for development
      return await uploadToLocal(file, request);
    }
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ 
      error: 'Upload failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function uploadToCloudinary(file: File) {
  try {
    console.log('Uploading to Cloudinary...');
    
    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const dataURI = `data:${file.type};base64,${base64}`;

    // Upload to Cloudinary using server-side upload
    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`;
    
    const formData = new FormData();
    formData.append('file', dataURI);
    formData.append('upload_preset', process.env.CLOUDINARY_UPLOAD_PRESET || 'ml_default');
    
    // Add optional parameters for better image handling
    formData.append('folder', 'botrix-logos'); // Organize uploads in a folder
    formData.append('transformation', 'f_auto,q_auto'); // Auto format and quality

    const response = await fetch(cloudinaryUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Cloudinary upload failed:', errorText);
      throw new Error(`Cloudinary upload failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Cloudinary upload successful:', result.secure_url);
    
    return NextResponse.json({ 
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      size: result.bytes
    });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return NextResponse.json({ 
      error: 'Failed to upload to cloud storage',
      details: error instanceof Error ? error.message : 'Unknown cloud upload error'
    }, { status: 500 });
  }
}

async function convertToDataUrl(file: File) {
  try {
    console.log('Converting to data URL...');
    
    // Convert file to base64 data URL
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    console.log('Converted to data URL successfully');
    
    return NextResponse.json({ url: dataUrl });
  } catch (error) {
    console.error('Data URL conversion error:', error);
    return NextResponse.json({ 
      error: 'Failed to process image',
      details: error instanceof Error ? error.message : 'Unknown conversion error'
    }, { status: 500 });
  }
}

async function uploadToLocal(file: File, request: NextRequest) {
  try {
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

    // Generate URL - Use request headers to determine the correct base URL
    const host = request.headers.get('host');
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${protocol}://${host}`;
    const url = `${baseUrl}/uploads/${filename}`;

    console.log('Upload successful, URL:', url);
    return NextResponse.json({ url });
  } catch (error) {
    console.error('Local upload error:', error);
    return NextResponse.json({ 
      error: 'Failed to save file locally',
      details: error instanceof Error ? error.message : 'Unknown local upload error'
    }, { status: 500 });
  }
} 