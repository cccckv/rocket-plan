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
exports.VideosController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const videos_service_1 = require("./videos.service");
const dto_1 = require("./dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let VideosController = class VideosController {
    videosService;
    constructor(videosService) {
        this.videosService = videosService;
    }
    async createVideoTask(req, dto) {
        return this.videosService.createVideoTask(req.user.userId, dto);
    }
    async getTask(req, taskId) {
        return this.videosService.getTaskById(taskId, req.user.userId);
    }
    async pollTask(req, taskId) {
        return this.videosService.pollTaskStatus(taskId);
    }
    async getTasks(req, limit, offset) {
        return this.videosService.getUserTasks(req.user.userId, limit, offset);
    }
    async deleteTask(req, taskId) {
        return this.videosService.deleteTask(taskId, req.user.userId);
    }
};
exports.VideosController = VideosController;
__decorate([
    (0, common_1.Post)('generate'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({
        summary: '创建 AI 视频生成任务',
        description: '支持文生视频（T2V）、图生视频（I2V）、视频编辑（V2V）',
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: '任务创建成功',
        type: dto_1.VideoTaskResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: '请求参数错误' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: '未授权' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.CreateVideoTaskDto]),
    __metadata("design:returntype", Promise)
], VideosController.prototype, "createVideoTask", null);
__decorate([
    (0, common_1.Get)('tasks/:id'),
    (0, swagger_1.ApiOperation)({
        summary: '获取视频任务详情',
        description: '查询指定任务的详细信息',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '任务详情',
        type: dto_1.VideoTaskResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '任务不存在' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], VideosController.prototype, "getTask", null);
__decorate([
    (0, common_1.Post)('tasks/:id/poll'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: '轮询任务状态',
        description: '主动查询 AI 生成任务的最新状态',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '任务最新状态',
        type: dto_1.VideoTaskResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '任务不存在' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], VideosController.prototype, "pollTask", null);
__decorate([
    (0, common_1.Get)('tasks'),
    (0, swagger_1.ApiOperation)({
        summary: '获取用户的视频任务列表',
        description: '分页查询当前用户的所有视频生成任务',
    }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number, example: 20 }),
    (0, swagger_1.ApiQuery)({ name: 'offset', required: false, type: Number, example: 0 }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '任务列表',
        schema: {
            type: 'object',
            properties: {
                tasks: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/VideoTaskResponseDto' },
                },
                total: { type: 'number' },
                limit: { type: 'number' },
                offset: { type: 'number' },
            },
        },
    }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(20), common_1.ParseIntPipe)),
    __param(2, (0, common_1.Query)('offset', new common_1.DefaultValuePipe(0), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number]),
    __metadata("design:returntype", Promise)
], VideosController.prototype, "getTasks", null);
__decorate([
    (0, common_1.Delete)('tasks/:id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: '删除视频任务',
        description: '删除指定的视频生成任务及其关联的本地文件',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '删除成功' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '任务不存在' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], VideosController.prototype, "deleteTask", null);
exports.VideosController = VideosController = __decorate([
    (0, swagger_1.ApiTags)('AI Video Generation'),
    (0, common_1.Controller)('api/videos'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [videos_service_1.VideosService])
], VideosController);
//# sourceMappingURL=videos.controller.js.map