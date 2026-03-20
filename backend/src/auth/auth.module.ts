import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaModule } from '../prisma/prisma.module';
import { SmsService } from './services/sms.service';
import { RedisService } from './services/redis.service';
import { EmailService } from './services/email.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { GoogleStrategy } from './strategies/google.strategy';

const googleStrategyProvider = {
  provide: GoogleStrategy,
  useFactory: (configService: ConfigService) => {
    const clientId = configService.get<string>('GOOGLE_CLIENT_ID');
    if (clientId) {
      return new GoogleStrategy(configService);
    }
    return null;
  },
  inject: [ConfigService],
};

@Module({
  imports: [
    PrismaModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const expiresIn = configService.get<string>('JWT_EXPIRES_IN', '7d');
        return {
          secret: configService.get<string>('JWT_SECRET'),
          signOptions: {
            expiresIn: expiresIn as any,
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    SmsService,
    RedisService,
    EmailService,
    JwtStrategy,
    JwtRefreshStrategy,
    googleStrategyProvider,
  ],
  exports: [AuthService, JwtStrategy, RedisService, EmailService],
})
export class AuthModule {}
