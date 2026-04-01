import { Controller, Get, Post, Body, Query, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreditsService } from './credits.service';
import { CreditBalanceDto, CreditHistoryResponseDto } from './dto';

@ApiTags('Credits')
@Controller('credits')
export class CreditsController {
  constructor(private creditsService: CreditsService) {}

  @Get('balance')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user credit balance' })
  @ApiResponse({ status: 200, description: 'Credit balance retrieved', type: CreditBalanceDto })
  async getBalance(@Req() req: any): Promise<CreditBalanceDto> {
    const userId = req.user.userId;
    return this.creditsService.getBalance(userId);
  }

  @Get('transactions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user transaction history' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'offset', required: false, type: Number, example: 0 })
  @ApiResponse({ status: 200, description: 'Transaction history retrieved', type: CreditHistoryResponseDto })
  async getTransactions(
    @Req() req: any,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<CreditHistoryResponseDto> {
    const userId = req.user.userId;
    return this.creditsService.getTransactionHistory(
      userId,
      limit ? parseInt(limit.toString(), 10) : 20,
      offset ? parseInt(offset.toString(), 10) : 0,
    );
  }

  @Get('costs')
  @ApiOperation({ summary: 'Get credit costs for all models' })
  @ApiResponse({ status: 200, description: 'Credit costs retrieved' })
  async getCreditCosts() {
    return {
      costs: this.creditsService.getAllCreditCosts(),
    };
  }

  @Post('admin/add')
  @ApiOperation({ summary: 'Admin: Add credits to user' })
  @ApiResponse({ status: 200, description: 'Credits added successfully' })
  async adminAddCredits(
    @Body() body: { email: string; amount: number; reason: string },
  ) {
    const user = await this.creditsService['prisma'].user.findUnique({
      where: { email: body.email },
      select: { id: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const result = await this.creditsService.addCredits(
      user.id,
      body.amount,
      'admin_adjust',
      body.reason,
    );

    return {
      success: true,
      userId: user.id,
      newBalance: result.newBalance,
      transactionId: result.transactionId,
    };
  }
}
