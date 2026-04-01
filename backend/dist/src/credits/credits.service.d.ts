import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
export interface CreditCost {
    model: string;
    cost: number;
}
export declare class CreditsService {
    private prisma;
    private configService;
    private readonly logger;
    private readonly creditCosts;
    constructor(prisma: PrismaService, configService: ConfigService);
    private loadCreditCosts;
    getCreditCost(model: string): number;
    getAllCreditCosts(): CreditCost[];
    checkBalance(userId: number, requiredAmount: number): Promise<boolean>;
    getBalance(userId: number): Promise<{
        credits: number;
        tier: string;
    }>;
    deductCredits(userId: number, amount: number, reason: string, videoId?: string): Promise<{
        newBalance: number;
        transactionId: number;
    }>;
    addCredits(userId: number, amount: number, type: 'refund' | 'admin_adjust' | 'purchase', reason: string, videoId?: string): Promise<{
        newBalance: number;
        transactionId: number;
    }>;
    refundCredits(userId: number, amount: number, videoId: string, reason: string): Promise<{
        newBalance: number;
        transactionId: number;
    }>;
    getTransactionHistory(userId: number, limit?: number, offset?: number): Promise<{
        transactions: {
            type: string;
            createdAt: Date;
            id: number;
            userId: number;
            amount: number;
            videoId: number | null;
        }[];
        total: number;
        limit: number;
        offset: number;
    }>;
    getTransaction(transactionId: number, userId: number): Promise<{
        type: string;
        createdAt: Date;
        id: number;
        userId: number;
        amount: number;
        videoId: number | null;
    }>;
}
