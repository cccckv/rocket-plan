export declare class CreditTransactionDto {
    id: number;
    userId: number;
    amount: number;
    type: string;
    videoId?: number | null;
    createdAt: Date;
}
export declare class CreditBalanceDto {
    credits: number;
    tier: string;
}
export declare class CreditHistoryResponseDto {
    transactions: CreditTransactionDto[];
    total: number;
    limit: number;
    offset: number;
}
