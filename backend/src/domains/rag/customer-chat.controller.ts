import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ExecutionContext,
  Injectable,
  createParamDecorator,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtService } from '@domains/auth/services/jwt.service';
import { ResponseBuilder } from '@common/responses/response.builder';
import { CustomerChatService } from './customer-chat.service';
import {
  CreateChatSessionDto,
  ChatMessageDto,
  ChatHistoryQueryDto,
  RenameSessionDto,
  SubmitChatFeedbackDto,
} from './customer-chat.types';

// ponytail: optional auth — passes through when no/invalid token so guest sessions work.
// Ownership is enforced per-request in the service via userId/guestId, not here.
@Injectable()
export class OptionalJwtAuthGuard {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        request.user = this.jwtService.verify(authHeader.slice(7));
      } catch {
        // leave request.user undefined → treated as guest
      }
    }
    return true;
  }
}

const ReqUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    return ctx.switchToHttp().getRequest();
  },
);

function userIdOf(request: any): string | undefined {
  return request?.user?.sub ?? request?.user?.userId;
}

@ApiTags('RAG Customer Chat')
@Controller('rag/chat')
@UseGuards(OptionalJwtAuthGuard)
@ApiBearerAuth()
export class CustomerChatController {
  constructor(private readonly chat: CustomerChatService) {}

  @Post('session')
  @ApiOperation({ summary: 'Create or resume a chat session (auth or guest)' })
  async createSession(@Body() dto: CreateChatSessionDto, @ReqUser() req: any) {
    const data = await this.chat.createSession(dto, userIdOf(req));
    return ResponseBuilder.success(data);
  }

  @Post()
  @ApiOperation({
    summary: 'Send a message and receive an AI response with citations',
  })
  async send(@Body() dto: ChatMessageDto, @ReqUser() req: any) {
    const data = await this.chat.sendMessage(dto, userIdOf(req));
    return ResponseBuilder.success(data);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get message history for a session' })
  async history(
    @Query('sessionId') sessionId: string,
    @Query() dto: ChatHistoryQueryDto,
    @ReqUser() req: any,
  ) {
    if (!sessionId) throw new UnauthorizedException('sessionId is required');
    const data = await this.chat.getHistory(sessionId, dto, userIdOf(req));
    return ResponseBuilder.success(data);
  }

  @Patch('session/:id')
  @ApiOperation({ summary: 'Rename a chat session' })
  async rename(
    @Param('id') id: string,
    @Body() dto: RenameSessionDto,
    @ReqUser() req: any,
  ) {
    const data = await this.chat.renameSession(id, dto, userIdOf(req));
    return ResponseBuilder.success(data, 'Session renamed');
  }

  @Delete('session/:id')
  @ApiOperation({ summary: 'Archive a chat session' })
  async archive(@Param('id') id: string, @ReqUser() req: any) {
    await this.chat.archiveSession(id, userIdOf(req));
    return ResponseBuilder.success(null, 'Session archived');
  }

  @Post('session/:id/delete')
  @ApiOperation({ summary: 'Delete a chat session' })
  async remove(@Param('id') id: string, @ReqUser() req: any) {
    await this.chat.deleteSession(id, userIdOf(req));
    return ResponseBuilder.success(null, 'Session deleted');
  }

  @Get('suggestions')
  @ApiOperation({ summary: 'Get suggested questions (no LLM)' })
  async suggestions(
    @Query('sessionId') sessionId: string,
    @ReqUser() req: any,
  ) {
    const data = await this.chat.getSuggestions(sessionId, userIdOf(req));
    return ResponseBuilder.success(data);
  }

  @Post('feedback')
  @ApiOperation({ summary: 'Submit feedback on an assistant message' })
  async feedback(@Body() dto: SubmitChatFeedbackDto, @ReqUser() req: any) {
    const data = await this.chat.submitFeedback(dto, userIdOf(req));
    return ResponseBuilder.success(data, 'Feedback recorded');
  }
}
