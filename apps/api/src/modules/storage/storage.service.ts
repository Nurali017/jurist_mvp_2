import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class StorageService {
  private supabase: SupabaseClient;
  private bucketName = 'documents';
  private bucketInitialized = false;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('supabase.url');
    const supabaseKey = this.configService.get<string>('supabase.serviceRoleKey');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration is missing');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  private async ensureBucketExists(): Promise<void> {
    if (this.bucketInitialized) return;

    const { data: buckets } = await this.supabase.storage.listBuckets();
    const bucketExists = buckets?.some((b) => b.name === this.bucketName);

    if (!bucketExists) {
      const { error } = await this.supabase.storage.createBucket(this.bucketName, {
        public: true,
        fileSizeLimit: 20 * 1024 * 1024, // 20MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf'],
      });

      if (error && !error.message.includes('already exists')) {
        throw new BadRequestException(`Failed to create bucket: ${error.message}`);
      }
    }

    this.bucketInitialized = true;
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string,
  ): Promise<string> {
    await this.ensureBucketExists();

    // Validate file type
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'application/pdf',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only JPG, PNG, and PDF are allowed.',
      );
    }

    // Validate file size (20MB max)
    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('File size must be less than 20MB');
    }

    // Generate unique filename
    const fileExtension = file.originalname.split('.').pop();
    const fileName = `${folder}/${uuidv4()}.${fileExtension}`;

    // Upload to Supabase Storage
    const { data, error } = await this.supabase.storage
      .from(this.bucketName)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      throw new BadRequestException(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = this.supabase.storage
      .from(this.bucketName)
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  }

  async getSignedUrl(filePath: string, expiresIn = 900): Promise<string> {
    const { data, error } = await this.supabase.storage
      .from(this.bucketName)
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      throw new BadRequestException(`Failed to get signed URL: ${error.message}`);
    }

    return data.signedUrl;
  }

  async deleteFile(filePath: string): Promise<void> {
    const { error } = await this.supabase.storage
      .from(this.bucketName)
      .remove([filePath]);

    if (error) {
      throw new BadRequestException(`Delete failed: ${error.message}`);
    }
  }

  extractPathFromUrl(url: string): string {
    // Extract file path from Supabase public URL
    const match = url.match(/\/storage\/v1\/object\/public\/documents\/(.+)/);
    return match ? match[1] : url;
  }
}
