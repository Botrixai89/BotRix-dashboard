import { NextRequest } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export interface UploadedFile {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  path: string;
  url: string;
}

export interface FileUploadConfig {
  maxSize: number;
  allowedTypes: string[];
  uploadDir: string;
  baseUrl?: string; // Make baseUrl optional since we'll detect it dynamically
}

const DEFAULT_CONFIG: FileUploadConfig = {
  maxSize: parseInt(process.env.UPLOAD_MAX_SIZE || '10485760'), // 10MB
  allowedTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ],
  uploadDir: join(process.cwd(), 'public', 'uploads'),
  // Remove baseUrl from default config since we'll detect it dynamically
};

export class FileUploadService {
  private config: FileUploadConfig;

  constructor(config: Partial<FileUploadConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  private getBaseUrl(request: NextRequest): string {
    // Use environment variable if set, otherwise detect from request headers
    if (this.config.baseUrl) {
      return this.config.baseUrl;
    }
    
    if (process.env.NEXT_PUBLIC_BASE_URL) {
      return process.env.NEXT_PUBLIC_BASE_URL;
    }
    
    // Detect from request headers
    const host = request.headers.get('host');
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    return `${protocol}://${host}`;
  }

  async uploadFile(request: NextRequest): Promise<UploadedFile> {
    try {
      const formData = await request.formData();
      const file = formData.get('file') as File;

      if (!file) {
        throw new Error('No file provided');
      }

      // Validate file size
      if (file.size > this.config.maxSize) {
        throw new Error(`File size exceeds maximum allowed size of ${this.formatBytes(this.config.maxSize)}`);
      }

      // Validate file type
      if (!this.config.allowedTypes.includes(file.type)) {
        throw new Error(`File type ${file.type} is not allowed`);
      }

      // Create upload directory if it doesn't exist
      await this.ensureUploadDir();

      // Generate unique filename
      const filename = this.generateUniqueFilename(file.name);
      const filePath = join(this.config.uploadDir, filename);

      // Convert file to buffer and save
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);

      // Generate URL using dynamic base URL detection
      const baseUrl = this.getBaseUrl(request);
      const url = `${baseUrl}/uploads/${filename}`;

      return {
        filename,
        originalName: file.name,
        mimetype: file.type,
        size: file.size,
        path: filePath,
        url
      };
    } catch (error) {
      console.error('File upload error:', error);
      throw error;
    }
  }

  async uploadMultipleFiles(request: NextRequest): Promise<UploadedFile[]> {
    try {
      const formData = await request.formData();
      const files: File[] = [];

      // Extract all files from form data
      for (const [key, value] of Array.from(formData.entries())) {
        if (value instanceof File) {
          files.push(value);
        }
      }

      if (files.length === 0) {
        throw new Error('No files provided');
      }

      // Validate total size
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);
      if (totalSize > this.config.maxSize * 5) { // Allow 5x max size for multiple files
        throw new Error(`Total file size exceeds maximum allowed size`);
      }

      // Upload all files
      const uploadPromises = files.map(file => {
        const fileFormData = new FormData();
        fileFormData.append('file', file);
        
        const mockRequest = {
          formData: () => Promise.resolve(fileFormData)
        } as NextRequest;
        
        return this.uploadFile(mockRequest);
      });

      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Multiple file upload error:', error);
      throw error;
    }
  }

  private async ensureUploadDir(): Promise<void> {
    if (!existsSync(this.config.uploadDir)) {
      await mkdir(this.config.uploadDir, { recursive: true });
    }
  }

  private generateUniqueFilename(originalName: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const extension = originalName.split('.').pop();
    return `${timestamp}-${random}.${extension}`;
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  validateFile(file: File): { valid: boolean; error?: string } {
    // Check file size
    if (file.size > this.config.maxSize) {
      return {
        valid: false,
        error: `File size exceeds maximum allowed size of ${this.formatBytes(this.config.maxSize)}`
      };
    }

    // Check file type
    if (!this.config.allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type ${file.type} is not allowed`
      };
    }

    return { valid: true };
  }

  getFileIcon(mimetype: string): string {
    if (mimetype.startsWith('image/')) {
      return '🖼️';
    } else if (mimetype === 'application/pdf') {
      return '📄';
    } else if (mimetype.startsWith('text/')) {
      return '📝';
    } else if (mimetype.includes('word')) {
      return '📄';
    } else if (mimetype.includes('excel') || mimetype.includes('spreadsheet')) {
      return '📊';
    } else {
      return '📎';
    }
  }

  getFileTypeCategory(mimetype: string): string {
    if (mimetype.startsWith('image/')) {
      return 'image';
    } else if (mimetype === 'application/pdf') {
      return 'document';
    } else if (mimetype.startsWith('text/')) {
      return 'text';
    } else if (mimetype.includes('word')) {
      return 'document';
    } else if (mimetype.includes('excel') || mimetype.includes('spreadsheet')) {
      return 'spreadsheet';
    } else {
      return 'other';
    }
  }
}

// Export default instance
export const fileUploadService = new FileUploadService(); 