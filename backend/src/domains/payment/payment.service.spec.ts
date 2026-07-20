/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from './payment.service';
import { PaymentRepository } from './payment.repository';
import { AuditService } from '@domains/audit/audit.service';
import { OrderWorkflowService } from '@domains/order/order-workflow.service';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@database/prisma.service';

import * as crypto from 'crypto';

describe('PaymentService', () => {
  let service: PaymentService;
  let orderWorkflow: OrderWorkflowService;
  let prisma: PrismaService;

  const mockPayment = {
    id: 'pay-uuid-111',
    orderId: 'order-uuid-222',
    paymentNumber: 'PAY00000001',
    method: 'upi',
    provider: 'razorpay',
    status: 'PENDING',
    amount: 1500.0,
    currency: 'INR',
    providerOrderId: 'order_mock_999',
    createdBy: 'user-123',
    createdAt: new Date(),
  };

  const mockRepository = {
    generatePaymentNumber: jest.fn().mockResolvedValue('PAY00000001'),
    create: jest.fn().mockImplementation((data) =>
      Promise.resolve({
        ...mockPayment,
        providerOrderId: data.providerOrderId || mockPayment.providerOrderId,
        status: data.status || mockPayment.status,
      }),
    ),
    findById: jest.fn().mockImplementation((id) => {
      if (id === mockPayment.id) return Promise.resolve(mockPayment);
      return Promise.resolve(null);
    }),
    update: jest.fn().mockImplementation((_id, data) =>
      Promise.resolve({
        ...mockPayment,
        ...data,
      }),
    ),
    createTransaction: jest.fn().mockResolvedValue({ id: 'tx-uuid' }),
  };

  const mockAudit = {
    log: jest.fn().mockResolvedValue(null),
  };

  const mockOrderWorkflow = {
    transition: jest
      .fn()
      .mockResolvedValue({ id: 'order-uuid-222', status: 'CONFIRMED' }),
    deductInventory: jest.fn().mockResolvedValue(null),
  };

  const mockConfig = {
    get: jest.fn().mockImplementation((key, defaultValue) => {
      if (key === 'razorpay.enabled' || key === 'app.razorpay.enabled')
        return true;
      if (key === 'razorpay.keyId' || key === 'app.razorpay.keyId')
        return 'rzp_key_test_123';
      if (key === 'razorpay.keySecret' || key === 'app.razorpay.keySecret')
        return 'testsecret12345';
      if (
        key === 'razorpay.webhookSecret' ||
        key === 'app.razorpay.webhookSecret'
      )
        return 'webhooksecret12345';
      return defaultValue;
    }),
  };

  const mockTx = {
    payment: {
      findUnique: jest.fn().mockResolvedValue(mockPayment),
      update: jest
        .fn()
        .mockResolvedValue({ ...mockPayment, status: 'CAPTURED' }),
    },
    paymentTransaction: {
      create: jest.fn().mockResolvedValue({ id: 'tx-uuid' }),
    },
    order: {
      findUnique: jest.fn().mockResolvedValue({ status: 'PENDING' }),
    },
  };

  const mockPrisma = {
    order: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'order-uuid-222',
        totalAmount: 1500.0,
        grandTotal: 1500.0,
      }),
    },
    payment: {
      findMany: jest.fn().mockResolvedValue([mockPayment]),
    },
    $transaction: jest.fn().mockImplementation(async (cb: any) => cb(mockTx)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: PaymentRepository, useValue: mockRepository },
        { provide: AuditService, useValue: mockAudit },
        { provide: OrderWorkflowService, useValue: mockOrderWorkflow },
        { provide: ConfigService, useValue: mockConfig },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
    orderWorkflow = module.get<OrderWorkflowService>(OrderWorkflowService);
    prisma = module.get<PrismaService>(PrismaService);

    // Mock internal razorpay object
    (service as any).razorpay = {
      orders: {
        create: jest.fn().mockResolvedValue({ id: 'order_mock_999' }),
      },
    };

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a payment with a mock providerOrderId when Razorpay API is skipped or simulated', async () => {
      const result = await service.create('user-123', {
        orderId: 'order-uuid-222',
        method: 'upi',
        provider: 'razorpay',
        amount: 1500.0,
      });

      expect(result).toBeDefined();
      expect(result.status).toBe('PENDING');
      expect(mockRepository.create).toHaveBeenCalled();
    });
  });

  describe('verifyPayment', () => {
    it('should successfully verify valid signatures and transition order and deduct stock', async () => {
      const text = 'order_mock_999|pay_payment_id_999';
      const keySecret = 'testsecret12345';
      const validSignature = crypto
        .createHmac('sha256', keySecret)
        .update(text)
        .digest('hex');

      const verified = await service.verifyPayment(
        mockPayment.id,
        'pay_payment_id_999',
        validSignature,
        'user-123',
      );

      expect(verified).toBeDefined();
      expect(mockTx.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockPayment.id },
          data: expect.objectContaining({ status: 'CAPTURED' }),
        }),
      );
      expect(orderWorkflow.transition).toHaveBeenCalledWith(
        'order-uuid-222',
        'CONFIRMED',
        'user-123',
        'Payment verified successfully',
      );
      expect(orderWorkflow.deductInventory).toHaveBeenCalledWith(
        'order-uuid-222',
        mockTx,
      );
    });
  });

  describe('handleWebhook', () => {
    it('should capture payment and confirm order on payment.captured webhook event', async () => {
      const payload = {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'pay_payment_id_999',
              order_id: 'order_mock_999',
              amount: 150000,
            },
          },
        },
      };

      const rawBody = JSON.stringify(payload);
      const webhookSecret = 'webhooksecret12345';
      const validSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      const result = await service.handleWebhook(rawBody, validSignature);
      expect(result.status).toBe('processed');
      expect(orderWorkflow.transition).toHaveBeenCalledWith(
        'order-uuid-222',
        'CONFIRMED',
        'user-123',
        'Payment captured via webhook',
      );
      expect(orderWorkflow.deductInventory).toHaveBeenCalledWith(
        'order-uuid-222',
        mockTx,
      );
    });

    it('should ignore duplicate webhooks for already captured payments', async () => {
      const capturedPayment = { ...mockPayment, status: 'CAPTURED' };
      jest
        .spyOn(prisma.payment, 'findMany')
        .mockResolvedValueOnce([capturedPayment] as any);

      const payload = {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'pay_payment_id_999',
              order_id: 'order_mock_999',
            },
          },
        },
      };

      const rawBody = JSON.stringify(payload);
      const webhookSecret = 'webhooksecret12345';
      const validSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      const result = await service.handleWebhook(rawBody, validSignature);
      expect(result.status).toBe('ignored');
      expect(result.reason).toBe('Already captured');
    });
  });
});
