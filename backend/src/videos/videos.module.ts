import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { VideosController } from './videos.controller';
import { VideosService } from './videos.service';
import { AIApiKeyService } from './services/aiapikey.service';
import { VideoStorageService } from './services/video-storage.service';
import { ImageUtilService } from './services/image-util.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CreditsModule } from '../credits/credits.module';

@Module({
  imports: [ConfigModule, PrismaModule, CreditsModule],
  controllers: [VideosController],
  providers: [VideosService, AIApiKeyService, VideoStorageService, ImageUtilService],
  exports: [VideosService],
})
export class VideosModule {}
