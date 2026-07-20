import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AiChatService } from './ai-chat.service';
import {
  CreateConversationDto,
  SendMessageDto,
  ConversationQueryDto,
  AddFeedbackDto,
} from './ai-chat.types';
import { JwtAuthGuard, CurrentUser } from '@domains/auth/guards/jwt-auth.guard';
import { ResponseBuilder } from '@common/responses/response.builder';
import type { JwtPayload } from '@domains/auth/services/jwt.service';

@ApiTags('AI Chat')
@Controller('ai/chat')
export class AiChatController {
  constructor(private readonly aiChatService: AiChatService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List own conversations' })
  async findAll(
    @Query() query: ConversationQueryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.aiChatService.findAll(user.sub, query),
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get conversation by ID' })
  async findById(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return ResponseBuilder.success(
      await this.aiChatService.findById(id, user.sub),
    );
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create conversation' })
  async create(
    @Body() dto: CreateConversationDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.created(
      await this.aiChatService.create(user.sub, dto),
      'Conversation created',
    );
  }

  @Post(':id/messages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send message' })
  async sendMessage(
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.created(
      await this.aiChatService.sendMessage(id, user.sub, dto),
      'Message sent',
    );
  }

  @Get(':id/messages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get messages' })
  async getMessages(
    @Param('id') id: string,
    @Query('page') page: number,
    @Query('limit') limit: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.aiChatService.getMessages(id, user.sub, page, limit),
    );
  }

  @Post(':id/feedback')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add feedback' })
  async addFeedback(
    @Param('id') id: string,
    @Body() dto: AddFeedbackDto,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.aiChatService.addFeedback(user.sub, { ...dto, referenceId: id });
    return ResponseBuilder.created(null, 'Feedback submitted');
  }
}
