import type { Response } from 'express';
import { AuthService } from './auth.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { RegisterPhoneDto } from './dto/register-phone.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ResetPasswordEmailDto } from './dto/reset-password-email.dto';
import { SetPasswordDto } from './dto/set-password.dto';
import { SendEmailOtpDto } from './dto/send-email-otp.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresIn: string;
        user: {
            id: number;
            name: string | null;
            email: string;
            credits: number;
            tier: string;
            hasPassword: boolean;
        };
    }>;
    registerPhone(dto: RegisterPhoneDto): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresIn: string;
        user: {
            id: number;
            phone: string | null;
            email: string;
            credits: number;
            tier: string;
            hasPassword: boolean;
        };
    }>;
    login(dto: LoginDto): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresIn: string;
        user: {
            id: number;
            name: string | null;
            phone: string | null;
            email: string;
            credits: number;
            tier: string;
            hasPassword: boolean;
        };
    }>;
    sendOtp(sendOtpDto: SendOtpDto): Promise<{
        message: string;
    }>;
    verifyOtp(verifyOtpDto: VerifyOtpDto): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresIn: string;
        user: {
            id: number;
            phone: string | null;
            email: string;
            credits: number;
            tier: string;
            hasPassword: boolean;
        };
    }>;
    sendEmailOtp(dto: SendEmailOtpDto): Promise<{
        message: string;
    }>;
    setPassword(userId: number, dto: SetPasswordDto): Promise<{
        message: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    resetPasswordEmail(dto: ResetPasswordEmailDto): Promise<{
        message: string;
    }>;
    googleAuth(): Promise<void>;
    googleAuthCallback(req: any, res: Response): Promise<void>;
    refresh(userId: number, dto: RefreshTokenDto): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresIn: string;
    }>;
    logout(userId: number): Promise<{
        message: string;
    }>;
    getProfile(user: any): Promise<{
        id: number;
        name: string | null;
        phone: string | null;
        googleId: string | null;
        email: string;
        credits: number;
        tier: string;
        hasPassword: boolean;
    }>;
}
