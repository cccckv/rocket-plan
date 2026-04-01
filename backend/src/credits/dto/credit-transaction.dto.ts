import { ApiProperty } from '@nestjs/swagger';

export class CreditTransactionDto {
  @ApiProperty({ example: 1, description: 'Transaction ID' })
  id: number;

  @ApiProperty({ example: 1, description: 'User ID' })
  userId: number;

  @ApiProperty({ example: -1, description: 'Amount (positive=recharge, negative=consume)' })
  amount: number;

  @ApiProperty({ example: 'consume', description: 'Transaction type', enum: ['purchase', 'consume', 'refund', 'admin_adjust'] })
  type: string;

  @ApiProperty({ example: 'abc-123-def', description: 'Related video task ID', required: false, nullable: true })
  videoId?: number | null;

  @ApiProperty({ example: '2024-03-29T10:00:00Z', description: 'Transaction timestamp' })
  createdAt: Date;
}

export class CreditBalanceDto {
  @ApiProperty({ example: 10, description: 'Current credit balance' })
  credits: number;

  @ApiProperty({ example: 'free', description: 'User tier', enum: ['free', 'basic', 'pro'] })
  tier: string;
}

export class CreditHistoryResponseDto {
  @ApiProperty({ type: [CreditTransactionDto], description: 'Transaction list' })
  transactions: CreditTransactionDto[];

  @ApiProperty({ example: 25, description: 'Total number of transactions' })
  total: number;

  @ApiProperty({ example: 20, description: 'Page size' })
  limit: number;

  @ApiProperty({ example: 0, description: 'Offset' })
  offset: number;
}
