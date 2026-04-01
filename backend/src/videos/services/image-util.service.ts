import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

const TEMP_DIR = path.join('/tmp', 'rocket-plan-images');

@Injectable()
export class ImageUtilService {
  private readonly logger = new Logger(ImageUtilService.name);

  async onModuleInit() {
    await fs.mkdir(TEMP_DIR, { recursive: true });
  }

  base64ToBuffer(base64: string): Buffer {
    const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
    return Buffer.from(base64Data, 'base64');
  }

  private detectFormat(buffer: Buffer): string {
    if (buffer[0] === 0xff && buffer[1] === 0xd8) return 'jpg';
    if (buffer[0] === 0x89 && buffer[1] === 0x50) return 'png';
    if (buffer[0] === 0x52 && buffer[1] === 0x49) return 'webp';
    return 'png';
  }

  async saveTemporaryImage(buffer: Buffer, format?: string): Promise<string> {
    const ext = format || this.detectFormat(buffer);
    const filename = `${uuidv4()}.${ext}`;
    const filePath = path.join(TEMP_DIR, filename);

    await fs.writeFile(filePath, buffer);
    this.logger.debug(`Saved temporary image: ${filePath} (${buffer.length} bytes)`);
    return filePath;
  }

  async mergeImages(imagePaths: string[], maxWidth = 2048): Promise<string> {
    const images = await Promise.all(
      imagePaths.map(async (p) => {
        const img = sharp(p);
        const metadata = await img.metadata();
        return { path: p, width: metadata.width || 0, height: metadata.height || 0 };
      }),
    );

    const maxHeight = Math.max(...images.map((i) => i.height));
    const perImageWidth = Math.floor(maxWidth / images.length);

    const resizedBuffers = await Promise.all(
      images.map(async (img) => {
        const resized = await sharp(img.path)
          .resize({
            width: perImageWidth,
            height: maxHeight,
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          })
          .png()
          .toBuffer();
        return { buffer: resized, width: perImageWidth, height: maxHeight };
      }),
    );

    const compositeInputs = resizedBuffers.map((item, index) => ({
      input: item.buffer,
      left: index * perImageWidth,
      top: 0,
    }));

    const totalWidth = perImageWidth * images.length;
    const mergedPath = path.join(TEMP_DIR, `${uuidv4()}-merged.png`);

    await sharp({
      create: {
        width: totalWidth,
        height: maxHeight,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite(compositeInputs)
      .png()
      .toFile(mergedPath);

    this.logger.debug(`Merged ${images.length} images into: ${mergedPath} (${totalWidth}x${maxHeight})`);
    return mergedPath;
  }

  async cleanupTemporaryFiles(filePaths: string[]): Promise<void> {
    for (const filePath of filePaths) {
      try {
        await fs.unlink(filePath);
        this.logger.debug(`Cleaned up temp file: ${filePath}`);
      } catch (error) {
        this.logger.warn(`Failed to cleanup temp file ${filePath}: ${error.message}`);
      }
    }
  }
}
