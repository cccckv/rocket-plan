import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class VideoStorageService {
  private readonly logger = new Logger(VideoStorageService.name);
  private readonly uploadDir: string;

  constructor(private configService: ConfigService) {
    this.uploadDir = path.join(process.cwd(), 'uploads', 'ai-videos');
    this.ensureUploadDirectory();
  }

  private async ensureUploadDirectory() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
      this.logger.log(`Upload directory ensured: ${this.uploadDir}`);
    } catch (error) {
      this.logger.error('Failed to create upload directory:', error);
    }
  }

  async saveVideo(videoBuffer: Buffer, originalFilename?: string): Promise<string> {
    const filename = `${uuidv4()}.mp4`;
    const filePath = path.join(this.uploadDir, filename);

    try {
      await fs.writeFile(filePath, videoBuffer);
      this.logger.log(`Video saved to: ${filePath}`);
      return `/uploads/ai-videos/${filename}`;
    } catch (error) {
      this.logger.error('Failed to save video:', error);
      throw new Error(`Failed to save video: ${error.message}`);
    }
  }

  async deleteVideo(localPath: string): Promise<void> {
    try {
      const fullPath = path.join(process.cwd(), localPath);
      await fs.unlink(fullPath);
      this.logger.log(`Video deleted: ${fullPath}`);
    } catch (error) {
      this.logger.error(`Failed to delete video ${localPath}:`, error);
    }
  }

  async videoExists(localPath: string): Promise<boolean> {
    try {
      const fullPath = path.join(process.cwd(), localPath);
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  getVideoFullPath(localPath: string): string {
    return path.join(process.cwd(), localPath);
  }
}
