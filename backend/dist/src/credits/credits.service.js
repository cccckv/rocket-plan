"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var CreditsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreditsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const config_1 = require("@nestjs/config");
let CreditsService = CreditsService_1 = class CreditsService {
    prisma;
    configService;
    logger = new common_1.Logger(CreditsService_1.name);
    creditCosts;
    constructor(prisma, configService) {
        this.prisma = prisma;
        this.configService = configService;
        this.creditCosts = this.loadCreditCosts();
    }
    loadCreditCosts() {
        const costs = new Map();
        const envCosts = this.configService.get('CREDIT_COSTS');
        if (envCosts) {
            try {
                const parsed = JSON.parse(envCosts);
                Object.entries(parsed).forEach(([model, cost]) => {
                    costs.set(model, cost);
                });
                this.logger.log('Credit costs loaded from environment');
                return costs;
            }
            catch (error) {
                this.logger.warn('Failed to parse CREDIT_COSTS from env, using defaults');
            }
        }
        costs.set('veo3.1-fast-components', 0.26);
        costs.set('veo_3_1-fast-components', 0.26);
        costs.set('veo_3_1-fast', 0.43);
        costs.set('veo_3_1-fast-4K', 0.43);
        costs.set('veo3.1-fast', 0.70);
        costs.set('veo3-fast', 0.90);
        costs.set('veo3.1', 0.70);
        costs.set('veo_3_1', 0.73);
        costs.set('veo3.1-components', 0.70);
        costs.set('veo_3_1-components', 0.73);
        costs.set('veo3', 0.90);
        costs.set('veo_3_1-4K', 0.85);
        costs.set('veo_3_1-components-4K', 0.85);
        costs.set('veo_3_1-fast-components-4K', 0.86);
        costs.set('veo3.1-4k', 1.00);
        costs.set('veo3.1-components-4k', 1.00);
        costs.set('veo3-fast-frames', 0.90);
        costs.set('veo3-frames', 0.90);
        costs.set('veo3-pro-frames', 4.00);
        costs.set('veo3.1-pro', 3.50);
        costs.set('veo3.1-pro-4k', 3.50);
        this.logger.log(`Loaded ${costs.size} default credit costs`);
        return costs;
    }
    getCreditCost(model) {
        const cost = this.creditCosts.get(model);
        if (cost === undefined) {
            this.logger.warn(`No credit cost defined for model: ${model}, using default 3 credits`);
            return 3;
        }
        return cost;
    }
    getAllCreditCosts() {
        return Array.from(this.creditCosts.entries()).map(([model, cost]) => ({
            model,
            cost,
        }));
    }
    async checkBalance(userId, requiredAmount) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { credits: true },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return user.credits >= requiredAmount;
    }
    async getBalance(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { credits: true, tier: true },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return {
            credits: user.credits,
            tier: user.tier,
        };
    }
    async deductCredits(userId, amount, reason, videoId) {
        if (amount <= 0) {
            throw new common_1.BadRequestException('Deduction amount must be positive');
        }
        const result = await this.prisma.$transaction(async (tx) => {
            const user = await tx.user.findUnique({
                where: { id: userId },
                select: { credits: true, email: true },
            });
            if (!user) {
                throw new common_1.NotFoundException('User not found');
            }
            if (user.credits < amount) {
                throw new common_1.BadRequestException(`Insufficient credits. Required: ${amount}, Available: ${user.credits}`);
            }
            const updatedUser = await tx.user.update({
                where: { id: userId },
                data: { credits: { decrement: amount } },
                select: { credits: true },
            });
            const transaction = await tx.transaction.create({
                data: {
                    userId,
                    amount: -amount,
                    type: 'consume',
                    videoId: videoId ? parseInt(videoId, 10) : null,
                },
            });
            this.logger.log(`Deducted ${amount} credits from user ${userId} (${user.email}). ` +
                `Reason: ${reason}. New balance: ${updatedUser.credits}`);
            return {
                newBalance: updatedUser.credits,
                transactionId: transaction.id,
            };
        });
        return result;
    }
    async addCredits(userId, amount, type, reason, videoId) {
        if (amount <= 0) {
            throw new common_1.BadRequestException('Addition amount must be positive');
        }
        const result = await this.prisma.$transaction(async (tx) => {
            const user = await tx.user.findUnique({
                where: { id: userId },
                select: { email: true },
            });
            if (!user) {
                throw new common_1.NotFoundException('User not found');
            }
            const updatedUser = await tx.user.update({
                where: { id: userId },
                data: { credits: { increment: amount } },
                select: { credits: true },
            });
            const transaction = await tx.transaction.create({
                data: {
                    userId,
                    amount: amount,
                    type,
                    videoId: videoId ? parseInt(videoId, 10) : null,
                },
            });
            this.logger.log(`Added ${amount} credits to user ${userId} (${user.email}). ` +
                `Type: ${type}, Reason: ${reason}. New balance: ${updatedUser.credits}`);
            return {
                newBalance: updatedUser.credits,
                transactionId: transaction.id,
            };
        });
        return result;
    }
    async refundCredits(userId, amount, videoId, reason) {
        return this.addCredits(userId, amount, 'refund', reason, videoId);
    }
    async getTransactionHistory(userId, limit = 20, offset = 0) {
        const [transactions, total] = await Promise.all([
            this.prisma.transaction.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset,
            }),
            this.prisma.transaction.count({
                where: { userId },
            }),
        ]);
        return {
            transactions,
            total,
            limit,
            offset,
        };
    }
    async getTransaction(transactionId, userId) {
        const transaction = await this.prisma.transaction.findFirst({
            where: {
                id: transactionId,
                userId,
            },
        });
        if (!transaction) {
            throw new common_1.NotFoundException('Transaction not found or access denied');
        }
        return transaction;
    }
};
exports.CreditsService = CreditsService;
exports.CreditsService = CreditsService = CreditsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], CreditsService);
//# sourceMappingURL=credits.service.js.map