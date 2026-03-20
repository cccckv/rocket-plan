import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from './storage.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('storage')
@UseGuards(JwtAuthGuard)
export class StorageController {
  constructor(private storageService: StorageService) {}

  @Post('upload/:folder')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Param('folder') folder: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const validFolders = ['materials', 'videos', 'bgm', 'templates'];
    if (!validFolders.includes(folder)) {
      throw new BadRequestException('Invalid folder. Must be: materials, videos, bgm, or templates');
    }

    const result = await this.storageService.upload(
      file,
      folder as 'materials' | 'videos' | 'bgm' | 'templates',
    );

    return {
      message: 'File uploaded successfully',
      ...result,
    };
  }

  @Get('signed-url/*key')
  async getSignedUrl(
    @Param('key') key: string,
    @Query('expiresIn') expiresIn?: string,
  ) {
    const expires = expiresIn ? parseInt(expiresIn, 10) : 3600;
    const url = await this.storageService.getSignedUrl(key, expires);

    return {
      url,
      expiresIn: expires,
    };
  }

  @Delete('*key')
  async deleteFile(@Param('key') key: string) {
    await this.storageService.delete(key);

    return {
      message: 'File deleted successfully',
      key,
    };
  }

  @Get('exists/*key')
  async checkExists(@Param('key') key: string) {
    const exists = await this.storageService.exists(key);

    return {
      exists,
      key,
    };
  }

  @Get('public-url/*key')
  async getPublicUrl(@Param('key') key: string) {
    const url = this.storageService.getPublicUrl(key);

    return {
      url,
      key,
    };
  }
}
