import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BusinessException, PaymentException } from '@common/exceptions';
import { AuditService } from '@domains/audit/audit.service';
import { PrismaService } from '@database/prisma.service';
import { OrderWorkflowService } from '@domains/order/order-workflow.service';
import { PaymentRepository } from './payment.repository';
import {
  CreatePaymentDto,
  PaymentQueryDto,
  PaymentResponse,
} from './payment.types';
import type { JwtPayload } from '@domains/auth/services/jwt.service';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';

const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['AUTHORIZED', 'FAILED', 'CAPTURED'],
  AUTHORIZED: ['CAPTURED', 'CANCELLED'],
  CAPTURED: ['REFUNDED'],
};

@Injectable()
export class PaymentService {
  private razorpay: Razorpay;

  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly auditService: AuditService,
    private readonly orderWorkflowService: OrderWorkflowService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.razorpay = new Razorpay({
      key_id:
        this.configService.get<string>('app.razorpay.keyId') || 'mock_key',
      key_secret:
        this.configService.get<string>('app.razorpay.keySecret') ||
        'mock_secret',
    });
  }

  private isRazorpayEnabled(): boolean {
    const enabled = this.configService.get<boolean>(
      'app.razorpay.enabled',
      true,
    );
    const keyId = this.configService.get<string>('app.razorpay.keyId');
    const keySecret = this.configService.get<string>('app.razorpay.keySecret');
    return (
      enabled && !!keyId && !!keySecret && keyId !== 'mock_key' && keyId !== ''
    );
  }

  private toResponse(p: any, includeTransactions = false): PaymentResponse {
    return {
      id: p.id,
      orderId: p.orderId,
      paymentNumber: p.paymentNumber,
      method: p.method,
      provider: p.provider,
      status: p.status,
      amount: Number(p.amount),
      currency: p.currency,
      transactionId: p.transactionId ?? undefined,
      transactions:
        includeTransactions && p.transactions
          ? p.transactions.map((t: any) => ({
              id: t.id,
              type: t.type,
              status: t.status,
              amount: Number(t.amount),
              providerRefId: t.providerRefId ?? undefined,
              createdAt: t.createdAt,
            }))
          : undefined,
      createdAt: p.createdAt,
    };
  }

  async findAll(query: PaymentQueryDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const result = await this.paymentRepository.findAll({
      orderId: query.orderId,
      status: query.status,
      page,
      limit,
    });
    return {
      data: result.data.map((p) => this.toResponse(p)),
      meta: result.meta,
    };
  }

  async findById(id: string, user?: JwtPayload) {
    const payment = await this.paymentRepository.findById(id);
    if (!payment)
      throw new BusinessException('Payment not found', 'PAYMENT_001');
    this.assertOwnsPayment(payment, user);
    return this.toResponse(payment, true);
  }

  async findByOrderId(orderId: string, user?: JwtPayload) {
    const payments = await this.paymentRepository.findByOrderId(orderId);
    for (const p of payments) this.assertOwnsPayment(p, user);
    return payments.map((p) => this.toResponse(p, true));
  }

  // ponytail: customers may only read payments for their own orders; admins see all
  private assertOwnsPayment(payment: any, user?: JwtPayload) {
    if (!user) return;
    const isAdmin = user.roles?.some((r: string) =>
      ['super_admin', 'admin'].includes(r),
    );
    if (isAdmin) return;
    if (payment.order?.customerId && payment.order.customerId !== user.sub) {
      throw new BusinessException('Access denied', 'PAYMENT_007');
    }
  }

  async create(userId: string, dto: CreatePaymentDto) {
    const paymentNumber = await this.paymentRepository.generatePaymentNumber();

    // Check if order exists
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
    });
    if (!order) {
      throw new BusinessException('Order not found', 'ORDER_001');
    }

    // Reconcile requested amount against the authoritative order total.
    const orderTotal = Number(order.grandTotal);
    const requested = Number(dto.amount);
    if (Math.round(requested * 100) !== Math.round(orderTotal * 100)) {
      throw new BusinessException(
        'Payment amount does not match order total',
        'PAYMENT_003',
      );
    }

    let providerOrderId = `rzp_mock_${paymentNumber}`;

    if (this.isRazorpayEnabled()) {
      try {
        const razorpayOrder = await this.razorpay.orders.create({
          amount: Math.round(dto.amount * 100), // in paise
          currency: dto.currency || 'INR',
          receipt: paymentNumber,
        });
        providerOrderId = razorpayOrder.id;
      } catch (err: any) {
        throw new BusinessException(
          `Razorpay order creation failed: ${err.message || err}`,
          'PAYMENT_006',
        );
      }
    }

    const payment = await this.paymentRepository.create({
      order: { connect: { id: dto.orderId } },
      paymentNumber,
      method: dto.method,
      provider: dto.provider,
      amount: dto.amount,
      currency: dto.currency ?? 'INR',
      providerOrderId,
      createdBy: userId,
    });

    await this.auditService.log({
      action: 'PAYMENT_CREATED',
      module: 'payment',
      resource: 'Payment',
      resourceId: payment.id,
      userId,
    });

    return this.toResponse(payment, true);
  }

  async verifyPayment(
    id: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
    userId: string,
  ) {
    const payment = await this.paymentRepository.findById(id);
    if (!payment) {
      throw new BusinessException('Payment not found', 'PAYMENT_001');
    }
    if (payment.status === 'CAPTURED') {
      return this.toResponse(payment, true);
    }

    // Reconcile against the authoritative order total before marking captured.
    const linkedOrder = await this.prisma.order.findUnique({
      where: { id: payment.orderId },
    });
    if (linkedOrder) {
      const orderTotal = Math.round(Number(linkedOrder.grandTotal) * 100);
      const paidAmount = Math.round(Number(payment.amount) * 100);
      if (orderTotal !== paidAmount) {
        await this.paymentRepository.update(id, {
          status: 'FAILED',
          metadata: {
            razorpayPaymentId,
            razorpaySignature,
            error: 'Amount mismatch with order total',
          },
        });
        throw new BusinessException(
          'Payment amount does not match order total',
          'PAYMENT_003',
        );
      }
    }

    const keySecret =
      this.configService.get<string>('app.razorpay.keySecret') || '';
    const orderId = payment.providerOrderId;
    if (!orderId) {
      throw new BusinessException(
        'No provider order ID found on payment record',
        'PAYMENT_004',
      );
    }

    if (this.isRazorpayEnabled()) {
      const text = `${orderId}|${razorpayPaymentId}`;
      const generated = crypto
        .createHmac('sha256', keySecret)
        .update(text)
        .digest('hex');

      const genBuf = Buffer.from(generated);
      const sigBuf = Buffer.from(razorpaySignature);
      const isValid =
        genBuf.length === sigBuf.length &&
        crypto.timingSafeEqual(genBuf, sigBuf);

      if (!isValid) {
        await this.paymentRepository.update(id, {
          status: 'FAILED',
          providerPaymentId: razorpayPaymentId,
          metadata: {
            razorpayPaymentId,
            razorpaySignature,
            error: 'Signature mismatch',
          },
        });
        await this.paymentRepository.createTransaction({
          payment: { connect: { id } },
          type: 'FAILED',
          status: 'FAILED',
          amount: payment.amount,
          providerRefId: razorpayPaymentId,
        });
        throw new BusinessException(
          'Payment signature verification failed',
          'PAYMENT_005',
        );
      }
    }

    // Single atomic capture: flip payment, record tx, transition order, deduct stock.
    // Idempotency re-check under lock prevents a concurrent webhook from double-deducting.
    const updated = await this.prisma.$transaction(async (tx) => {
      const locked = await tx.payment.findUnique({ where: { id } });
      if (!locked || locked.status === 'CAPTURED') {
        return locked;
      }

      const captured = await tx.payment.update({
        where: { id },
        data: {
          status: 'CAPTURED',
          providerPaymentId: razorpayPaymentId,
          metadata: { razorpayPaymentId, razorpaySignature },
        },
      });

      await tx.paymentTransaction.create({
        data: {
          paymentId: id,
          type: 'CAPTURED',
          status: 'SUCCESS',
          amount: payment.amount,
          providerRefId: razorpayPaymentId,
        },
      });

      // Only deduct if the order hasn't already been confirmed (idempotency).
      const order = await tx.order.findUnique({
        where: { id: payment.orderId },
        select: { status: true },
      });
      if (order && order.status !== 'CONFIRMED') {
        await this.orderWorkflowService.transition(
          payment.orderId,
          'CONFIRMED',
          userId,
          'Payment verified successfully',
        );
        await this.orderWorkflowService.deductInventory(payment.orderId, tx);
      }

      return captured;
    });

    await this.auditService.log({
      action: 'PAYMENT_CAPTURED',
      module: 'payment',
      resource: 'Payment',
      resourceId: id,
      userId,
    });

    return this.toResponse(updated, true);
  }

  async handleWebhook(rawBody: string, signature: string) {
    const webhookSecret =
      this.configService.get<string>('app.razorpay.webhookSecret') || '';

    if (this.isRazorpayEnabled() && webhookSecret) {
      const generated = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      const genBuf = Buffer.from(generated);
      const sigBuf = Buffer.from(signature);
      const isValid =
        genBuf.length === sigBuf.length &&
        crypto.timingSafeEqual(genBuf, sigBuf);

      if (!isValid) {
        throw new BusinessException(
          'Webhook signature verification failed',
          'PAYMENT_WEBHOOK_001',
        );
      }
    }

    let event: any;
    try {
      event = JSON.parse(rawBody);
    } catch {
      throw new PaymentException(
        'Webhook payload is not valid JSON',
        'PAYMENT_WEBHOOK_INVALID_BODY',
      );
    }
    const payload = event.payload;

    if (event.event === 'payment.captured') {
      const paymentEntity = payload.payment.entity;
      const providerOrderId = paymentEntity.order_id;
      const providerPaymentId = paymentEntity.id;

      const payments = await this.prisma.payment.findMany({
        where: { providerOrderId },
      });
      if (payments.length === 0) {
        return { status: 'ignored', reason: 'Order not found' };
      }

      const payment = payments[0];
      if (payment.status === 'CAPTURED') {
        return { status: 'ignored', reason: 'Already captured' };
      }

      await this.prisma.$transaction(async (tx) => {
        const locked = await tx.payment.findUnique({
          where: { id: payment.id },
        });
        if (!locked || locked.status === 'CAPTURED') return;

        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: 'CAPTURED',
            providerPaymentId,
            metadata: paymentEntity,
          },
        });

        await tx.paymentTransaction.create({
          data: {
            paymentId: payment.id,
            type: 'CAPTURED',
            status: 'SUCCESS',
            amount: payment.amount,
            providerRefId: providerPaymentId,
          },
        });

        const order = await tx.order.findUnique({
          where: { id: payment.orderId },
          select: { status: true },
        });
        if (order && order.status !== 'CONFIRMED') {
          await this.orderWorkflowService.transition(
            payment.orderId,
            'CONFIRMED',
            payment.createdBy || 'SYSTEM',
            'Payment captured via webhook',
          );
          await this.orderWorkflowService.deductInventory(payment.orderId, tx);
        }
      });

      await this.auditService.log({
        action: 'PAYMENT_CAPTURED_WEBHOOK',
        module: 'payment',
        resource: 'Payment',
        resourceId: payment.id,
        userId: 'SYSTEM',
      });

      return { status: 'processed' };
    }

    if (event.event === 'payment.failed') {
      const paymentEntity = payload.payment.entity;
      const providerOrderId = paymentEntity.order_id;
      const providerPaymentId = paymentEntity.id;

      const payments = await this.prisma.payment.findMany({
        where: { providerOrderId },
      });
      if (payments.length > 0) {
        const payment = payments[0];
        if (payment.status === 'PENDING') {
          await this.paymentRepository.update(payment.id, {
            status: 'FAILED',
            providerPaymentId,
            metadata: paymentEntity,
          });

          await this.paymentRepository.createTransaction({
            payment: { connect: { id: payment.id } },
            type: 'FAILED',
            status: 'FAILED',
            amount: payment.amount,
            providerRefId: providerPaymentId,
          });

          await this.auditService.log({
            action: 'PAYMENT_FAILED_WEBHOOK',
            module: 'payment',
            resource: 'Payment',
            resourceId: payment.id,
            userId: 'SYSTEM',
          });
        }
      }
      return { status: 'processed' };
    }

    return { status: 'ignored', event: event.event };
  }

  async updateStatus(id: string, status: string, userId: string) {
    const payment = await this.paymentRepository.findById(id);
    if (!payment)
      throw new BusinessException('Payment not found', 'PAYMENT_001');

    const allowed = VALID_TRANSITIONS[payment.status];
    if (!allowed?.includes(status)) {
      throw new BusinessException(
        `Cannot transition from ${payment.status} to ${status}`,
        'PAYMENT_002',
      );
    }

    const updated = await this.paymentRepository.update(id, {
      status,
      updatedBy: userId,
    });
    await this.paymentRepository.createTransaction({
      payment: { connect: { id } },
      type: status,
      status: 'SUCCESS',
      amount: payment.amount,
    });

    const auditActions: Record<string, string> = {
      AUTHORIZED: 'PAYMENT_AUTHORIZED',
      CAPTURED: 'PAYMENT_CAPTURED',
      FAILED: 'PAYMENT_FAILED',
    };
    const auditAction = auditActions[status];
    if (auditAction) {
      await this.auditService.log({
        action: auditAction,
        module: 'payment',
        resource: 'Payment',
        resourceId: id,
        userId,
      });
    }

    return this.toResponse(updated, true);
  }
}
