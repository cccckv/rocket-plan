import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

export interface CreditCost {
  model: string;
  cost: number;
}

@Injectable()
export class CreditsService {
  private readonly logger = new Logger(CreditsService.name);
  private readonly creditCosts: Map<string, number>;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    // Initialize credit costs from config or use defaults
    this.creditCosts = this.loadCreditCosts();
  }

  /**
   * Load credit costs for different models from environment or use defaults
   */
  private loadCreditCosts(): Map<string, number> {
    const costs = new Map<string, number>();
    
    // Try to load from environment variable (JSON format)
    const envCosts = this.configService.get<string>('CREDIT_COSTS');
    if (envCosts) {
      try {
        const parsed = JSON.parse(envCosts);
        Object.entries(parsed).forEach(([model, cost]) => {
          costs.set(model, cost as number);
        });
        this.logger.log('Credit costs loaded from environment');
        return costs;
      } catch (error) {
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

  /**
   * Get credit cost for a specific model
   */
  getCreditCost(model: string): number {
    const cost = this.creditCosts.get(model);
    if (cost === undefined) {
      this.logger.warn(`No credit cost defined for model: ${model}, using default 3 credits`);
      return 3; // Default fallback
    }
    return cost;
  }

  /**
   * Get all credit costs (for admin or info purposes)
   */
  getAllCreditCosts(): CreditCost[] {
    return Array.from(this.creditCosts.entries()).map(([model, cost]) => ({
      model,
      cost,
    }));
  }

  /**
   * Check if user has sufficient balance
   */
  async checkBalance(userId: number, requiredAmount: number): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user.credits >= requiredAmount;
  }

  /**
   * Get user's current credit balance
   */
  async getBalance(userId: number): Promise<{ credits: number; tier: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true, tier: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      credits: user.credits,
      tier: user.tier,
    };
  }

  /**
   * Deduct credits from user and create transaction record
   */
  async deductCredits(
    userId: number,
    amount: number,
    reason: string,
    videoId?: string,
  ): Promise<{ newBalance: number; transactionId: number }> {
    if (amount <= 0) {
      throw new BadRequestException('Deduction amount must be positive');
    }

    // Use transaction to ensure atomicity
    const result = await this.prisma.$transaction(async (tx) => {
      // Get current balance with lock
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { credits: true, email: true },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (user.credits < amount) {
        throw new BadRequestException(
          `Insufficient credits. Required: ${amount}, Available: ${user.credits}`,
        );
      }

      // Deduct credits
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { credits: { decrement: amount } },
        select: { credits: true },
      });

      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          userId,
          amount: -amount, // Negative for consumption
          type: 'consume',
          videoId: videoId ? parseInt(videoId, 10) : null,
        },
      });

      this.logger.log(
        `Deducted ${amount} credits from user ${userId} (${user.email}). ` +
        `Reason: ${reason}. New balance: ${updatedUser.credits}`,
      );

      return {
        newBalance: updatedUser.credits,
        transactionId: transaction.id,
      };
    });

    return result;
  }

  /**
   * Add credits to user (for refunds or admin adjustments)
   */
  async addCredits(
    userId: number,
    amount: number,
    type: 'refund' | 'admin_adjust' | 'purchase',
    reason: string,
    videoId?: string,
  ): Promise<{ newBalance: number; transactionId: number }> {
    if (amount <= 0) {
      throw new BadRequestException('Addition amount must be positive');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Add credits
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { credits: { increment: amount } },
        select: { credits: true },
      });

      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          userId,
          amount: amount, // Positive for addition
          type,
          videoId: videoId ? parseInt(videoId, 10) : null,
        },
      });

      this.logger.log(
        `Added ${amount} credits to user ${userId} (${user.email}). ` +
        `Type: ${type}, Reason: ${reason}. New balance: ${updatedUser.credits}`,
      );

      return {
        newBalance: updatedUser.credits,
        transactionId: transaction.id,
      };
    });

    return result;
  }

  /**
   * Refund credits for failed video generation
   */
  async refundCredits(
    userId: number,
    amount: number,
    videoId: string,
    reason: string,
  ): Promise<{ newBalance: number; transactionId: number }> {
    return this.addCredits(userId, amount, 'refund', reason, videoId);
  }

  /**
   * Get user's transaction history
   */
  async getTransactionHistory(
    userId: number,
    limit: number = 20,
    offset: number = 0,
  ) {
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

  /**
   * Get transaction by ID
   */
  async getTransaction(transactionId: number, userId: number) {
    const transaction = await this.prisma.transaction.findFirst({
      where: {
        id: transactionId,
        userId,
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found or access denied');
    }

    return transaction;
  }
}
