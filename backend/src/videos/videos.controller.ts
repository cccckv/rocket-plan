import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { VideosService } from './videos.service';
import { CreateVideoTaskDto, VideoTaskResponseDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('AI Video Generation')
@Controller('api/videos')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  @Post('generate')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '创建 AI 视频生成任务',
    description: '支持文生视频（T2V）、图生视频（I2V）、视频编辑（V2V）',
  })
  @ApiResponse({
    status: 201,
    description: '任务创建成功',
    type: VideoTaskResponseDto,
  })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  async createVideoTask(@Request() req: any, @Body() dto: CreateVideoTaskDto) {
    return this.videosService.createVideoTask(req.user.userId, dto);
  }

  @Get('tasks/:id')
  @ApiOperation({
    summary: '获取视频任务详情',
    description: '查询指定任务的详细信息',
  })
  @ApiResponse({
    status: 200,
    description: '任务详情',
    type: VideoTaskResponseDto,
  })
  @ApiResponse({ status: 404, description: '任务不存在' })
  async getTask(@Request() req: any, @Param('id') taskId: string) {
    return this.videosService.getTaskById(taskId, req.user.userId);
  }

  @Post('tasks/:id/poll')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '轮询任务状态',
    description: '主动查询 AI 生成任务的最新状态',
  })
  @ApiResponse({
    status: 200,
    description: '任务最新状态',
    type: VideoTaskResponseDto,
  })
  @ApiResponse({ status: 404, description: '任务不存在' })
  async pollTask(@Request() req: any, @Param('id') taskId: string) {
    return this.videosService.pollTaskStatus(taskId);
  }

  @Get('tasks')
  @ApiOperation({
    summary: '获取用户的视频任务列表',
    description: '分页查询当前用户的所有视频生成任务',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'offset', required: false, type: Number, example: 0 })
  @ApiResponse({
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
  })
  async getTasks(
    @Request() req: any,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ) {
    return this.videosService.getUserTasks(req.user.userId, limit, offset);
  }

  @Delete('tasks/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '删除视频任务',
    description: '删除指定的视频生成任务及其关联的本地文件',
  })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '任务不存在' })
  async deleteTask(@Request() req: any, @Param('id') taskId: string) {
    return this.videosService.deleteTask(taskId, req.user.userId);
  }
}
