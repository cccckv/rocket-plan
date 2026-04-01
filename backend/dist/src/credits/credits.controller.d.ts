import { CreditsService } from './credits.service';
import { CreditBalanceDto, CreditHistoryResponseDto } from './dto';
export declare class CreditsController {
    private creditsService;
    constructor(creditsService: CreditsService);
    getBalance(req: any): Promise<CreditBalanceDto>;
    getTransactions(req: any, limit?: number, offset?: number): Promise<CreditHistoryResponseDto>;
    getCreditCosts(): Promise<{
        costs: import("./credits.service").CreditCost[];
    }>;
    adminAddCredits(body: {
        email: string;
        amount: number;
        reason: string;
    }): Promise<{
        success: boolean;
        userId: number;
        newBalance: number;
        transactionId: number;
    }>;
}
