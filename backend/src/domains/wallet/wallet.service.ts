import { Injectable } from '@nestjs/common';
import { BusinessException } from '@common/exceptions';
import { AuditService } from '@domains/audit/audit.service';
import { CustomerProfileRepository } from '@domains/customer-profile/customer-profile.repository';
import { WalletRepository } from './wallet.repository';
import {
  CreditWalletDto,
  DebitWalletDto,
  WalletTransactionQueryDto,
} from './wallet.types';

@Injectable()
export class WalletService {
  constructor(
    private readonly walletRepository: WalletRepository,
    private readonly profileRepository: CustomerProfileRepository,
    private readonly auditService: AuditService,
  ) {}

  async getOrCreateWallet(userId: string) {
    const profile = await this.profileRepository.findByUserId(userId);
    if (!profile)
      throw new BusinessException('Customer profile not found', 'WALLET_001');

    let wallet = await this.walletRepository.findByCustomerId(profile.id);
    if (!wallet) {
      wallet = await this.walletRepository.create(profile.id);
    }
    return wallet;
  }

  async getBalance(userId: string) {
    const wallet = await this.getOrCreateWallet(userId);
    return { balance: Number(wallet.balance), currency: wallet.currency };
  }

  async credit(userId: string, dto: CreditWalletDto) {
    const wallet = await this.getOrCreateWallet(userId);
    const { wallet: updated, transaction } =
      await this.walletRepository.updateBalance(
        wallet.id,
        dto.amount,
        'CREDIT',
        dto.description,
        dto.referenceType,
        dto.referenceId,
      );

    await this.auditService.log({
      action: 'WALLET_CREDIT',
      module: 'wallet',
      resource: 'Wallet',
      resourceId: wallet.id,
      userId,
    });

    return {
      balance: Number(updated.balance),
      transaction: {
        id: transaction.id,
        type: transaction.type,
        amount: Number(transaction.amount),
        balanceAfter: Number(transaction.balanceAfter),
        description: transaction.description ?? undefined,
        referenceType: transaction.referenceType ?? undefined,
        referenceId: transaction.referenceId ?? undefined,
        createdAt: transaction.createdAt,
      },
    };
  }

  async debit(userId: string, dto: DebitWalletDto) {
    const wallet = await this.getOrCreateWallet(userId);
    if (Number(wallet.balance) < dto.amount) {
      throw new BusinessException('Insufficient wallet balance', 'WALLET_002');
    }

    const { wallet: updated, transaction } =
      await this.walletRepository.updateBalance(
        wallet.id,
        -dto.amount,
        'DEBIT',
        dto.description,
        dto.referenceType,
        dto.referenceId,
      );

    await this.auditService.log({
      action: 'WALLET_DEBIT',
      module: 'wallet',
      resource: 'Wallet',
      resourceId: wallet.id,
      userId,
    });

    return {
      balance: Number(updated.balance),
      transaction: {
        id: transaction.id,
        type: transaction.type,
        amount: Number(transaction.amount),
        balanceAfter: Number(transaction.balanceAfter),
        description: transaction.description ?? undefined,
        referenceType: transaction.referenceType ?? undefined,
        referenceId: transaction.referenceId ?? undefined,
        createdAt: transaction.createdAt,
      },
    };
  }

  async getTransactions(userId: string, query: WalletTransactionQueryDto) {
    const wallet = await this.getOrCreateWallet(userId);
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const result = await this.walletRepository.getTransactions(wallet.id, {
      type: query.type,
      page,
      limit,
    });
    return {
      data: result.data.map((t) => ({
        id: t.id,
        type: t.type,
        amount: Number(t.amount),
        balanceAfter: Number(t.balanceAfter),
        referenceType: t.referenceType ?? undefined,
        referenceId: t.referenceId ?? undefined,
        description: t.description ?? undefined,
        createdAt: t.createdAt,
      })),
      meta: result.meta,
    };
  }

  async getOrCreateWalletByCustomerId(customerId: string) {
    let wallet = await this.walletRepository.findByCustomerId(customerId);
    if (!wallet) {
      wallet = await this.walletRepository.create(customerId);
    }
    return wallet;
  }

  async getTransactionsByCustomerIdAdmin(
    customerId: string,
    query: WalletTransactionQueryDto,
  ) {
    const wallet = await this.getOrCreateWalletByCustomerId(customerId);
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const result = await this.walletRepository.getTransactions(wallet.id, {
      type: query.type,
      page,
      limit,
    });
    return {
      data: result.data.map((t) => ({
        id: t.id,
        type: t.type,
        amount: Number(t.amount),
        balanceAfter: Number(t.balanceAfter),
        referenceType: t.referenceType ?? undefined,
        referenceId: t.referenceId ?? undefined,
        description: t.description ?? undefined,
        createdAt: t.createdAt,
      })),
      meta: result.meta,
    };
  }

  async creditByCustomerIdAdmin(
    customerId: string,
    dto: CreditWalletDto,
    adminUserId: string,
  ) {
    const wallet = await this.getOrCreateWalletByCustomerId(customerId);
    const { wallet: updated, transaction } =
      await this.walletRepository.updateBalance(
        wallet.id,
        dto.amount,
        'CREDIT',
        dto.description,
        dto.referenceType,
        dto.referenceId,
      );

    await this.auditService.log({
      action: 'WALLET_CREDIT_ADMIN',
      module: 'wallet',
      resource: 'Wallet',
      resourceId: wallet.id,
      userId: adminUserId,
    });

    return {
      balance: Number(updated.balance),
      transaction: {
        id: transaction.id,
        type: transaction.type,
        amount: Number(transaction.amount),
        balanceAfter: Number(transaction.balanceAfter),
        description: transaction.description ?? undefined,
        createdAt: transaction.createdAt,
      },
    };
  }

  async debitByCustomerIdAdmin(
    customerId: string,
    dto: DebitWalletDto,
    adminUserId: string,
  ) {
    const wallet = await this.getOrCreateWalletByCustomerId(customerId);
    if (Number(wallet.balance) < dto.amount) {
      throw new BusinessException('Insufficient wallet balance', 'WALLET_002');
    }

    const { wallet: updated, transaction } =
      await this.walletRepository.updateBalance(
        wallet.id,
        -dto.amount,
        'DEBIT',
        dto.description,
        dto.referenceType,
        dto.referenceId,
      );

    await this.auditService.log({
      action: 'WALLET_DEBIT_ADMIN',
      module: 'wallet',
      resource: 'Wallet',
      resourceId: wallet.id,
      userId: adminUserId,
    });

    return {
      balance: Number(updated.balance),
      transaction: {
        id: transaction.id,
        type: transaction.type,
        amount: Number(transaction.amount),
        balanceAfter: Number(transaction.balanceAfter),
        description: transaction.description ?? undefined,
        createdAt: transaction.createdAt,
      },
    };
  }
}
