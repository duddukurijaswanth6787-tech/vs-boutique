import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import {
  CreditWalletDto,
  DebitWalletDto,
  WalletTransactionQueryDto,
} from './wallet.types';
import { JwtAuthGuard, CurrentUser } from '@domains/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@domains/auth/guards/roles.guard';
import { ResponseBuilder } from '@common/responses/response.builder';
import type { JwtPayload } from '@domains/auth/services/jwt.service';

@ApiTags('Wallet')
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get own wallet' })
  async getWallet(@CurrentUser() user: JwtPayload) {
    const wallet = await this.walletService.getOrCreateWallet(user.sub);
    return ResponseBuilder.success({
      id: wallet.id,
      customerId: wallet.customerId,
      balance: Number(wallet.balance),
      currency: wallet.currency,
      isActive: wallet.isActive,
      createdAt: wallet.createdAt,
    });
  }

  @Get('transactions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get transaction history' })
  async getTransactions(
    @CurrentUser() user: JwtPayload,
    @Query() query: WalletTransactionQueryDto,
  ) {
    return ResponseBuilder.success(
      await this.walletService.getTransactions(user.sub, query),
    );
  }

  @Post('credit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Credit wallet' })
  async credit(@Body() dto: CreditWalletDto, @CurrentUser() user: JwtPayload) {
    return ResponseBuilder.success(
      await this.walletService.credit(user.sub, dto),
      'Wallet credited',
    );
  }

  @Post('debit')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Debit wallet' })
  async debit(@Body() dto: DebitWalletDto, @CurrentUser() user: JwtPayload) {
    return ResponseBuilder.success(
      await this.walletService.debit(user.sub, dto),
      'Wallet debited',
    );
  }

  @Get('admin/customer/:customerId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get wallet details of any customer (Admin only)' })
  async getWalletAdmin(@Param('customerId') customerId: string) {
    const wallet =
      await this.walletService.getOrCreateWalletByCustomerId(customerId);
    return ResponseBuilder.success({
      id: wallet.id,
      customerId: wallet.customerId,
      balance: Number(wallet.balance),
      currency: wallet.currency,
      isActive: wallet.isActive,
      createdAt: wallet.createdAt,
    });
  }

  @Get('admin/customer/:customerId/transactions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get wallet transactions of any customer (Admin only)',
  })
  async getTransactionsAdmin(
    @Param('customerId') customerId: string,
    @Query() query: WalletTransactionQueryDto,
  ) {
    return ResponseBuilder.success(
      await this.walletService.getTransactionsByCustomerIdAdmin(
        customerId,
        query,
      ),
    );
  }

  @Post('admin/customer/:customerId/credit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Credit wallet of any customer (Admin only)' })
  async creditAdmin(
    @Param('customerId') customerId: string,
    @Body() dto: CreditWalletDto,
    @CurrentUser() admin: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.walletService.creditByCustomerIdAdmin(
        customerId,
        dto,
        admin.sub,
      ),
      'Wallet credited by Admin',
    );
  }

  @Post('admin/customer/:customerId/debit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Debit wallet of any customer (Admin only)' })
  async debitAdmin(
    @Param('customerId') customerId: string,
    @Body() dto: DebitWalletDto,
    @CurrentUser() admin: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.walletService.debitByCustomerIdAdmin(
        customerId,
        dto,
        admin.sub,
      ),
      'Wallet debited by Admin',
    );
  }
}
