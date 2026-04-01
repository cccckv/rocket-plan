import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const databaseUrl = process.env.DATABASE_URL || 'file:./dev.db';
    
    const adapter = new PrismaLibSql({
      url: databaseUrl,
    });

    super({ 
      adapter,
      log: ['warn', 'error'],
    });
    
    this.logger.log(`Prisma initialized with libsql adapter: ${databaseUrl}`);
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
