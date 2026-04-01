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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreditsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const credits_service_1 = require("./credits.service");
const dto_1 = require("./dto");
let CreditsController = class CreditsController {
    creditsService;
    constructor(creditsService) {
        this.creditsService = creditsService;
    }
    async getBalance(req) {
        const userId = req.user.userId;
        return this.creditsService.getBalance(userId);
    }
    async getTransactions(req, limit, offset) {
        const userId = req.user.userId;
        return this.creditsService.getTransactionHistory(userId, limit ? parseInt(limit.toString(), 10) : 20, offset ? parseInt(offset.toString(), 10) : 0);
    }
    async getCreditCosts() {
        return {
            costs: this.creditsService.getAllCreditCosts(),
        };
    }
    async adminAddCredits(body) {
        const user = await this.creditsService['prisma'].user.findUnique({
            where: { email: body.email },
            select: { id: true },
        });
        if (!user) {
            throw new Error('User not found');
        }
        const result = await this.creditsService.addCredits(user.id, body.amount, 'admin_adjust', body.reason);
        return {
            success: true,
            userId: user.id,
            newBalance: result.newBalance,
            transactionId: result.transactionId,
        };
    }
};
exports.CreditsController = CreditsController;
__decorate([
    (0, common_1.Get)('balance'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get user credit balance' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Credit balance retrieved', type: dto_1.CreditBalanceDto }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CreditsController.prototype, "getBalance", null);
__decorate([
    (0, common_1.Get)('transactions'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get user transaction history' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number, example: 20 }),
    (0, swagger_1.ApiQuery)({ name: 'offset', required: false, type: Number, example: 0 }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Transaction history retrieved', type: dto_1.CreditHistoryResponseDto }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number]),
    __metadata("design:returntype", Promise)
], CreditsController.prototype, "getTransactions", null);
__decorate([
    (0, common_1.Get)('costs'),
    (0, swagger_1.ApiOperation)({ summary: 'Get credit costs for all models' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Credit costs retrieved' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CreditsController.prototype, "getCreditCosts", null);
__decorate([
    (0, common_1.Post)('admin/add'),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Add credits to user' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Credits added successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CreditsController.prototype, "adminAddCredits", null);
exports.CreditsController = CreditsController = __decorate([
    (0, swagger_1.ApiTags)('Credits'),
    (0, common_1.Controller)('credits'),
    __metadata("design:paramtypes", [credits_service_1.CreditsService])
], CreditsController);
//# sourceMappingURL=credits.controller.js.map