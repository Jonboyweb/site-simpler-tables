# File Upload Security Analysis 2024
*The Backroom Leeds - Event Artwork Upload System*

## Executive Summary

This research analyzes file upload security libraries and patterns for The Backroom Leeds event artwork upload system (JPEG/PNG, 5MB max). Key findings: **Next.js 15.5 built-in handling** with **file-type magic number validation** is the recommended approach over multer/formidable for security and performance.

---

## 1. File Upload Libraries Comparison

### 1.1 Next.js 15.5 Built-in (RECOMMENDED)

**Version**: Next.js 15.5+
**TypeScript Support**: ✅ Native
**Security Rating**: ⭐⭐⭐⭐⭐
**Bundle Impact**: Zero (built-in)

**Advantages**:
- No additional dependencies
- Automatic memory management
- Built-in streaming support
- Request size limits
- CSRF protection
- Perfect TypeScript integration

**Implementation**:
```typescript
// app/api/admin/events/artwork/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('artwork') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Security validations here
    
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Save file logic here
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
```

**Configuration**:
```typescript
// next.config.js
module.exports = {
  experimental: {
    serverComponentsExternalPackages: [],
  },
  api: {
    bodyParser: {
      sizeLimit: '5mb',
    },
  },
}
```

### 1.2 multer (Legacy Approach)

**Version**: 1.4.5-lts.1
**TypeScript Support**: Via `@types/multer`
**Security Rating**: ⭐⭐⭐ (Requires careful configuration)
**Weekly Downloads**: ~2.8M

**Security Concerns**:
- **File type validation is NOT secure by default**
- Relies on MIME types and extensions (easily spoofed)
- Requires manual magic number validation
- Memory management complexity

**Critical Security Issue**:
> "File-Type Validation in Multer is NOT SAFE🙃 - Multer does not validate the actual content of a file; it only depends on the file extension or the MIME type provided by the client, which is editable."

**Why Not Recommended for The Backroom Leeds**:
- Additional dependency overhead
- Security vulnerabilities without proper configuration
- Next.js built-in handling is superior

### 1.3 formidable (Alternative)

**Version**: 3.5.1+
**TypeScript Support**: Via `@types/formidable`
**Security Rating**: ⭐⭐⭐
**Use Case**: Legacy Next.js versions only

**Implementation Example**:
```typescript
// Next.js API route with formidable
import { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm } from 'formidable';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = new IncomingForm();
  
  form.parse(req, (err, fields, files) => {
    if (err) {
      return res.status(500).json({ error: 'Upload failed' });
    }
    
    // Process files
    res.status(200).json({ success: true });
  });
}
```

**Limitations**:
- Requires disabling Next.js bodyParser
- More complex error handling
- Less TypeScript-friendly than built-in approach

---

## 2. Magic Number Validation (CRITICAL SECURITY)

### 2.1 file-type Package (REQUIRED)

**Version**: 19.0.3+
**Purpose**: Detect file types by magic numbers (file signatures)
**Security Rating**: ⭐⭐⭐⭐⭐
**Installation**: `npm install file-type`

**Magic Numbers for Image Files**:
```typescript
const IMAGE_SIGNATURES = {
  'image/jpeg': [
    [0xFF, 0xD8, 0xFF, 0xE0],  // JPEG JFIF
    [0xFF, 0xD8, 0xFF, 0xE1],  // JPEG EXIF
    [0xFF, 0xD8, 0xFF, 0xE8]   // JPEG SPIFF
  ],
  'image/png': [
    [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]  // PNG signature
  ]
};
```

**Implementation**:
```typescript
import { fileTypeFromBuffer } from 'file-type';

const validateFileType = async (buffer: Buffer): Promise<boolean> => {
  try {
    const fileType = await fileTypeFromBuffer(buffer);
    
    if (!fileType) {
      return false;
    }
    
    const allowedTypes = ['image/jpeg', 'image/png'];
    return allowedTypes.includes(fileType.mime);
  } catch (error) {
    return false;
  }
};

// Usage in upload handler
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('artwork') as File;
  
  const buffer = Buffer.from(await file.arrayBuffer());
  
  // CRITICAL: Validate by magic number, not extension or MIME type
  const isValidType = await validateFileType(buffer);
  if (!isValidType) {
    return NextResponse.json(
      { error: 'Invalid file type. Only JPEG and PNG images allowed.' },
      { status: 400 }
    );
  }
  
  // Continue with upload...
}
```

### 2.2 Additional Security Validations

```typescript
interface FileValidationResult {
  isValid: boolean;
  error?: string;
  fileInfo?: {
    type: string;
    size: number;
    dimensions?: { width: number; height: number };
  };
}

const validateEventArtwork = async (file: File): Promise<FileValidationResult> => {
  // Size validation
  if (file.size > 5 * 1024 * 1024) { // 5MB limit
    return { isValid: false, error: 'File too large. Maximum size is 5MB.' };
  }
  
  if (file.size < 1024) { // Minimum 1KB (suspicious)
    return { isValid: false, error: 'File too small. Minimum size is 1KB.' };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  
  // Magic number validation
  const fileType = await fileTypeFromBuffer(buffer);
  if (!fileType || !['image/jpeg', 'image/png'].includes(fileType.mime)) {
    return { isValid: false, error: 'Invalid file type.' };
  }

  // Image dimension validation using sharp
  try {
    const sharp = require('sharp');
    const metadata = await sharp(buffer).metadata();
    
    // Minimum dimensions for event artwork
    if (metadata.width < 400 || metadata.height < 400) {
      return { 
        isValid: false, 
        error: 'Image too small. Minimum dimensions: 400x400 pixels.' 
      };
    }

    // Maximum dimensions
    if (metadata.width > 2048 || metadata.height > 2048) {
      return { 
        isValid: false, 
        error: 'Image too large. Maximum dimensions: 2048x2048 pixels.' 
      };
    }

    return {
      isValid: true,
      fileInfo: {
        type: fileType.mime,
        size: file.size,
        dimensions: {
          width: metadata.width,
          height: metadata.height
        }
      }
    };
  } catch (error) {
    return { isValid: false, error: 'Invalid image file.' };
  }
};
```

---

## 3. Image Processing and Optimization

### 3.1 sharp (RECOMMENDED)

**Version**: 0.32.6+
**Purpose**: High-performance image processing
**Security Benefits**: 
- Memory-safe image processing
- Automatic format validation
- Built-in security checks

**Installation**: `npm install sharp`

**Implementation**:
```typescript
import sharp from 'sharp';

const processEventArtwork = async (buffer: Buffer, filename: string) => {
  try {
    // Create optimized versions
    const originalPath = path.join(process.cwd(), 'public/events/artwork', filename);
    const thumbnailPath = path.join(process.cwd(), 'public/events/artwork/thumbs', 
      `thumb_${filename}`);

    // Save original (with optimization)
    await sharp(buffer)
      .jpeg({ quality: 85, progressive: true })
      .png({ quality: 85, compressionLevel: 9 })
      .toFile(originalPath);

    // Create thumbnail
    await sharp(buffer)
      .resize(300, 300, { 
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath.replace(/\.(png|jpeg)$/, '.jpg'));

    return {
      originalPath,
      thumbnailPath: thumbnailPath.replace(/\.(png|jpeg)$/, '.jpg')
    };
  } catch (error) {
    throw new Error('Image processing failed');
  }
};
```

### 3.2 Image Metadata Sanitization

```typescript
const sanitizeImageMetadata = async (buffer: Buffer): Promise<Buffer> => {
  try {
    // Remove all metadata (EXIF, GPS, etc.)
    return await sharp(buffer)
      .rotate() // Auto-rotate based on EXIF
      .withMetadata(false) // Remove all metadata
      .toBuffer();
  } catch (error) {
    throw new Error('Metadata sanitization failed');
  }
};
```

---

## 4. Malware Scanning Considerations

### 4.1 ClamAV Integration (Production)

**For Production Environment**:
```typescript
import { execPromise } from 'util';
import { promisify } from 'util';

const exec = promisify(require('child_process').exec);

const scanForMalware = async (filePath: string): Promise<boolean> => {
  try {
    // ClamAV scan
    const { stdout } = await exec(`clamscan --no-summary "${filePath}"`);
    return !stdout.includes('FOUND');
  } catch (error) {
    // If ClamAV not available, log and continue
    console.warn('Malware scanning unavailable:', error);
    return true; // Allow upload but log the issue
  }
};
```

### 4.2 Alternative: Cloud-based Scanning

**VirusTotal API Integration**:
```typescript
const scanWithVirusTotal = async (buffer: Buffer): Promise<boolean> => {
  const apiKey = process.env.VIRUSTOTAL_API_KEY;
  if (!apiKey) return true; // Skip if not configured

  try {
    const response = await fetch('https://www.virustotal.com/api/v3/files', {
      method: 'POST',
      headers: {
        'x-apikey': apiKey
      },
      body: buffer
    });

    const result = await response.json();
    return result.data.attributes.stats.malicious === 0;
  } catch (error) {
    console.warn('VirusTotal scan failed:', error);
    return true; // Allow upload on scan failure
  }
};
```

---

## 5. CDN Integration Patterns

### 5.1 AWS S3 + CloudFront

**Upload Strategy**:
```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({ region: 'eu-west-2' });

const uploadToS3 = async (buffer: Buffer, key: string, contentType: string) => {
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: `events/artwork/${key}`,
    Body: buffer,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000', // 1 year
    ServerSideEncryption: 'AES256'
  });

  await s3Client.send(command);
  
  return `https://${process.env.AWS_CLOUDFRONT_DOMAIN}/events/artwork/${key}`;
};
```

### 5.2 Vercel Blob Storage

**Next.js 15 Integration**:
```typescript
import { put } from '@vercel/blob';

const uploadToVercelBlob = async (buffer: Buffer, filename: string) => {
  const blob = await put(`events/artwork/${filename}`, buffer, {
    access: 'public',
    contentType: 'image/jpeg'
  });

  return blob.url;
};
```

---

## 6. Complete Upload Handler Implementation

### 6.1 Secure Upload API Route

```typescript
// app/api/admin/events/artwork/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { fileTypeFromBuffer } from 'file-type';
import sharp from 'sharp';
import { z } from 'zod';

const uploadSchema = z.object({
  eventId: z.string().uuid(),
  artworkType: z.enum(['poster', 'banner', 'thumbnail'])
});

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession();
    if (!session?.user?.role || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting
    const rateLimitKey = `artwork_upload:${session.user.id}`;
    const attempts = await redis.incr(rateLimitKey);
    if (attempts === 1) await redis.expire(rateLimitKey, 3600); // 1 hour
    if (attempts > 10) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Try again later.' },
        { status: 429 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('artwork') as File;
    const eventId = formData.get('eventId') as string;
    const artworkType = formData.get('artworkType') as string;

    // Validate form data
    const validation = uploadSchema.safeParse({ eventId, artworkType });
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // File validation
    const buffer = Buffer.from(await file.arrayBuffer());
    const validation = await validateEventArtwork(file);
    
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Process and optimize image
    const sanitizedBuffer = await sanitizeImageMetadata(buffer);
    const filename = `${eventId}-${artworkType}-${Date.now()}.jpg`;
    
    // Upload to CDN
    const imageUrl = await uploadToS3(sanitizedBuffer, filename, 'image/jpeg');
    
    // Update database
    await updateEventArtwork(eventId, artworkType, imageUrl);
    
    // Audit log
    await logSecurityEvent({
      action: 'ARTWORK_UPLOADED',
      userId: session.user.id,
      eventId,
      artworkType,
      filename,
      size: file.size,
      timestamp: new Date()
    });

    return NextResponse.json({
      success: true,
      imageUrl,
      filename
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}
```

### 6.2 Client-Side Upload Component

```typescript
// components/admin/ArtworkUpload.tsx
'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';

interface ArtworkUploadProps {
  eventId: string;
  artworkType: 'poster' | 'banner' | 'thumbnail';
  onUploadComplete: (imageUrl: string) => void;
}

export const ArtworkUpload: React.FC<ArtworkUploadProps> = ({
  eventId,
  artworkType,
  onUploadComplete
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Client-side validation
    if (file.size > 5 * 1024 * 1024) {
      setError('File too large. Maximum size is 5MB.');
      return;
    }

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setError('Invalid file type. Only JPEG and PNG allowed.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('artwork', file);
      formData.append('eventId', eventId);
      formData.append('artworkType', artworkType);

      const response = await fetch('/api/admin/events/artwork', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      onUploadComplete(result.imageUrl);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="artwork-upload">
      <label className="block">
        <span className="sr-only">Choose artwork file</span>
        <input
          type="file"
          accept="image/jpeg,image/png"
          onChange={handleUpload}
          disabled={uploading}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
      </label>
      
      {uploading && <p className="mt-2 text-sm text-blue-600">Uploading...</p>}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      
      <p className="mt-2 text-xs text-gray-500">
        JPEG or PNG, max 5MB, min 400x400px
      </p>
    </div>
  );
};
```

---

## 7. Security Recommendations for The Backroom Leeds

### 7.1 Primary Implementation Strategy

1. **Use Next.js 15.5 built-in file handling** (no multer/formidable)
2. **Implement magic number validation** with file-type package
3. **Process images with sharp** for optimization and sanitization
4. **Upload to CDN** (AWS S3 + CloudFront or Vercel Blob)
5. **Comprehensive logging** for security audits

### 7.2 Security Checklist

- [ ] Magic number validation (file-type package)
- [ ] File size limits (5MB max)
- [ ] Image dimension validation
- [ ] Metadata sanitization
- [ ] Rate limiting (10 uploads/hour/user)
- [ ] Authentication and authorization
- [ ] Audit logging
- [ ] CDN upload with encryption
- [ ] Malware scanning (production)
- [ ] Input validation and sanitization

### 7.3 File Storage Structure

```
/public/events/artwork/
├── originals/
│   ├── {eventId}-poster-{timestamp}.jpg
│   └── {eventId}-banner-{timestamp}.jpg
└── thumbnails/
    ├── thumb_{eventId}-poster-{timestamp}.jpg
    └── thumb_{eventId}-banner-{timestamp}.jpg
```

---

**Research Date**: August 26, 2024  
**Next Review**: November 2024  
**Confidence Level**: High (5/5)

This research provides comprehensive security guidance for implementing event artwork uploads at The Backroom Leeds, prioritizing security through magic number validation, proper image processing, and secure file handling patterns.