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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreditHistoryResponseDto = exports.CreditBalanceDto = exports.CreditTransactionDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class CreditTransactionDto {
    id;
    userId;
    amount;
    type;
    videoId;
    createdAt;
}
exports.CreditTransactionDto = CreditTransactionDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Transaction ID' }),
    __metadata("design:type", Number)
], CreditTransactionDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'User ID' }),
    __metadata("design:type", Number)
], CreditTransactionDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: -1, description: 'Amount (positive=recharge, negative=consume)' }),
    __metadata("design:type", Number)
], CreditTransactionDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'consume', description: 'Transaction type', enum: ['purchase', 'consume', 'refund', 'admin_adjust'] }),
    __metadata("design:type", String)
], CreditTransactionDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'abc-123-def', description: 'Related video task ID', required: false, nullable: true }),
    __metadata("design:type", Object)
], CreditTransactionDto.prototype, "videoId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-03-29T10:00:00Z', description: 'Transaction timestamp' }),
    __metadata("design:type", Date)
], CreditTransactionDto.prototype, "createdAt", void 0);
class CreditBalanceDto {
    credits;
    tier;
}
exports.CreditBalanceDto = CreditBalanceDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 10, description: 'Current credit balance' }),
    __metadata("design:type", Number)
], CreditBalanceDto.prototype, "credits", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'free', description: 'User tier', enum: ['free', 'basic', 'pro'] }),
    __metadata("design:type", String)
], CreditBalanceDto.prototype, "tier", void 0);
class CreditHistoryResponseDto {
    transactions;
    total;
    limit;
    offset;
}
exports.CreditHistoryResponseDto = CreditHistoryResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [CreditTransactionDto], description: 'Transaction list' }),
    __metadata("design:type", Array)
], CreditHistoryResponseDto.prototype, "transactions", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 25, description: 'Total number of transactions' }),
    __metadata("design:type", Number)
], CreditHistoryResponseDto.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 20, description: 'Page size' }),
    __metadata("design:type", Number)
], CreditHistoryResponseDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Offset' }),
    __metadata("design:type", Number)
], CreditHistoryResponseDto.prototype, "offset", void 0);
//# sourceMappingURL=credit-transaction.dto.js.map