import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SupportService } from './support.service';
import {
  CreateContactMessageDto,
  CreateSupportTicketDto,
  CreateSupportReplyDto,
  UpdateTicketStatusDto,
  ContactQueryDto,
  TicketQueryDto,
} from './support.types';
import { JwtAuthGuard, CurrentUser } from '@domains/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@domains/auth/guards/roles.guard';
import { ResponseBuilder } from '@common/responses/response.builder';
import type { JwtPayload } from '@domains/auth/services/jwt.service';

@ApiTags('Support')
@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post('contact')
  @ApiOperation({ summary: 'Create contact message (public)' })
  async createContact(@Body() dto: CreateContactMessageDto) {
    return ResponseBuilder.created(
      await this.supportService.createContact(dto),
      'Contact message submitted',
    );
  }

  @Get('contacts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List contact messages (admin)' })
  async findContacts(@Query() query: ContactQueryDto) {
    return ResponseBuilder.success(
      await this.supportService.findContacts(query),
    );
  }

  @Patch('contacts/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update contact status (admin)' })
  async updateContactStatus(
    @Param('id') id: string,
    @Body() dto: UpdateTicketStatusDto,
  ) {
    return ResponseBuilder.success(
      await this.supportService.updateContactStatus(
        id,
        dto.status ?? 'NEW',
        dto.assignedTo,
      ),
      'Contact status updated',
    );
  }

  @Get('tickets')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List tickets (admin: all, customer: own)' })
  async findTickets(
    @Query() query: TicketQueryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    if (
      !user.roles?.includes('super_admin') &&
      !user.roles?.includes('admin')
    ) {
      query.customerId = user.sub;
    }
    return ResponseBuilder.success(
      await this.supportService.findTickets(query),
    );
  }

  @Get('tickets/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get ticket by ID' })
  async findTicketById(@Param('id') id: string) {
    return ResponseBuilder.success(
      await this.supportService.findTicketById(id),
    );
  }

  @Post('tickets')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create support ticket' })
  async createTicket(
    @Body() dto: CreateSupportTicketDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.created(
      await this.supportService.createTicket(user.sub, dto),
      'Ticket created',
    );
  }

  @Patch('tickets/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update ticket status (admin)' })
  async updateTicketStatus(
    @Param('id') id: string,
    @Body() dto: UpdateTicketStatusDto,
  ) {
    return ResponseBuilder.success(
      await this.supportService.updateTicketStatus(id, dto),
      'Ticket status updated',
    );
  }

  @Post('tickets/:id/replies')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add reply to ticket' })
  async addReply(@Param('id') id: string, @Body() dto: CreateSupportReplyDto) {
    return ResponseBuilder.created(
      await this.supportService.addReply(id, dto),
      'Reply added',
    );
  }
}
