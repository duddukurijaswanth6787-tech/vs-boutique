import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class WalletRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByCustomerId(customerId: string) {
    return this.prisma.wallet.findUnique({ where: { customerId } });
  }

  async create(customerId: string) {
    return this.prisma.wallet.create({
      data: { customer: { connect: { id: customerId } } },
    });
  }

  async updateBalance(
    walletId: string,
    amount: number,
    type: string,
    description?: string,
    referenceType?: string,
    referenceId?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.update({
        where: { id: walletId },
        data: { balance: { increment: amount } },
      });
      const transaction = await tx.walletTransaction.create({
        data: {
          wallet: { connect: { id: walletId } },
          type,
          amount,
          balanceAfter: wallet.balance,
          description,
          referenceType,
          referenceId,
        },
      });
      return { wallet, transaction };
    });
  }

  async getTransactions(
    walletId: string,
    params: { type?: string; page: number; limit: number },
  ) {
    const { type, page, limit } = params;
    const skip = (page - 1) * limit;
    const where: Prisma.WalletTransactionWhereInput = { walletId };
    if (type) where.type = type;

    const [data, total] = await Promise.all([
      this.prisma.walletTransaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.walletTransaction.count({ where }),
    ]);
    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        hasNext: page < Math.ceil(total / limit),
        hasPrevious: page > 1,
      },
    };
  }

  async getBalance(walletId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { id: walletId },
      select: { balance: true },
    });
    return wallet?.balance;
  }
}
