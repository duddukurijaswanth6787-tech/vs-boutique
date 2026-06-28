const Razorpay = require('razorpay');
const crypto = require('crypto');
const paymentsRepository = require('../repositories/payments.repository');
const { logAction } = require('../../../services/auditService');
const { validateSubscriptionLimit } = require('../../../services/subscriptionService');
const prisma = require('../../../utils/prisma');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder',
});

class PaymentsService {
  parseDecimalVal(val) {
    if (val === null || val === undefined || val === '') return 0.00;
    if (typeof val === 'number') return val;
    const parsed = parseFloat(val.toString().replace(/[^0-9.]/g, ''));
    return isNaN(parsed) ? 0.00 : parsed;
  }

  mapPaymentResponse(payment) {
    if (!payment) return null;
    return {
      ...payment,
      id: payment.id,
      _id: payment.id,
      amount: Number(payment.amount),
      commissionAmount: Number(payment.commissionAmount),
      netAmount: Number(payment.netAmount),
      orderId: payment.order 
        ? { 
            ...payment.order, 
            id: payment.order.id, 
            _id: payment.order.id,
            price: Number(payment.order.price),
            advancePaid: Number(payment.order.advancePaid),
            remainingAmount: Number(payment.order.remainingAmount)
          }
        : payment.orderId,
      boutiqueId: payment.boutique 
        ? { ...payment.boutique, id: payment.boutique.id, _id: payment.boutique.id }
        : payment.boutiqueId,
      customerId: payment.customerId
    };
  }

  async getPlatformSettings() {
    let settings = await paymentsRepository.findPlatformSettings();
    if (!settings) {
      settings = await paymentsRepository.createPlatformSettings({
        globalCommissionRate: 10.00,
        categoryCommissions: {}
      });
    }
    return settings;
  }

  async getCommissionRate(boutiqueId, category) {
    const boutique = await paymentsRepository.findBoutiqueUnique(boutiqueId);
    const platformSettings = await this.getPlatformSettings();
    const globalRate = platformSettings ? Number(platformSettings.globalCommissionRate) : 10.00;
    const categoryCommissions = platformSettings ? platformSettings.categoryCommissions : {};

    const boutiqueRate = boutique ? Number(boutique.commissionRate) : 10.00;

    if (boutiqueRate !== 10.00) {
      return boutiqueRate;
    }

    if (category && categoryCommissions[category] !== undefined && categoryCommissions[category] !== null) {
      return Number(categoryCommissions[category]);
    }

    return globalRate;
  }

  async capturePayment({ paymentId, razorpay_payment_id, razorpay_signature, method }) {
    const payment = await paymentsRepository.findPaymentUnique(paymentId);
    if (!payment || payment.status === 'captured') {
      return payment;
    }

    const order = payment.orderId ? await paymentsRepository.findOrderUnique(payment.orderId) : null;
    const category = order ? order.category : null;
    const rate = await this.getCommissionRate(payment.boutiqueId, category);
    const commission = (Number(payment.amount) * rate) / 100;
    const netAmount = Number(payment.amount) - commission;

    return await prisma.$transaction(async (tx) => {
      const updatedPayment = await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: 'captured',
          razorpay_payment_id,
          razorpay_signature,
          method: method || payment.method,
          commissionAmount: this.parseDecimalVal(commission),
          netAmount: this.parseDecimalVal(netAmount)
        }
      });

      await tx.boutique.update({
        where: { id: payment.boutiqueId },
        data: {
          walletBalance: { increment: this.parseDecimalVal(netAmount) }
        }
      });

      if (payment.orderId) {
        const orderRecord = await tx.order.findUnique({
          where: { id: payment.orderId },
          include: { orderHistories: true }
        });
        if (orderRecord) {
          const alreadyPaidNote = orderRecord.orderHistories.find(h => h.note && h.note.includes(razorpay_payment_id || ''));
          if (!alreadyPaidNote) {
            const newAdvance = Number(orderRecord.advancePaid) + Number(payment.amount);
            const newPaymentStatus = newAdvance >= Number(orderRecord.price) ? 'captured' : 'pending';

            await tx.order.update({
              where: { id: payment.orderId },
              data: {
                advancePaid: this.parseDecimalVal(newAdvance),
                remainingAmount: this.parseDecimalVal(Number(orderRecord.price) - newAdvance),
                paymentStatus: newPaymentStatus,
                orderHistories: {
                  create: {
                    status: orderRecord.orderStatus,
                    note: `Payment of ₹${payment.amount} verified. Status: ${newPaymentStatus.toUpperCase()}. ID: ${razorpay_payment_id || 'N/A'}`
                  }
                }
              }
            });
          }
        }
      }

      return updatedPayment;
    });
  }

  async createPaymentOrder(userId, amount, currency = 'INR', receipt, orderId, boutiqueId) {
    if (!amount || amount <= 0) throw { status: 400, message: 'Invalid amount' };
    if (!orderId || !boutiqueId) throw { status: 400, message: 'Order ID and Boutique ID are required' };

    await validateSubscriptionLimit(boutiqueId, 'update');

    const order = await paymentsRepository.findOrderUnique(orderId);
    if (!order) throw { status: 404, message: 'Order not found' };

    const options = {
      amount: Math.round(amount * 100),
      currency,
      receipt: receipt || `rcpt_${order.orderId}_${Date.now()}`,
    };

    const rzpOrder = await razorpay.orders.create(options);

    await paymentsRepository.createPayment({
      orderId,
      boutiqueId,
      amount: this.parseDecimalVal(amount),
      razorpay_order_id: rzpOrder.id,
      receipt: options.receipt,
      status: 'pending',
      customerId: userId
    });

    return rzpOrder;
  }

  async getSettlements() {
    const settlements = await paymentsRepository.findPayments({ status: 'captured' }, {
      boutique: { select: { name: true } }
    }, { createdAt: 'desc' });

    return settlements.map(p => this.mapPaymentResponse(p));
  }

  async getReports() {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const stats = await prisma.$queryRaw`
      SELECT 
        COALESCE(SUM(CASE WHEN status = 'captured' THEN amount ELSE 0 END), 0)::float as "totalRevenue",
        COALESCE(SUM(CASE WHEN status = 'captured' AND created_at >= ${startOfToday} THEN amount ELSE 0 END), 0)::float as "todayRevenue",
        COALESCE(SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END), 0)::int as "pendingPayments",
        COALESCE(SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END), 0)::int as "failedPayments",
        COUNT(*)::int as "totalTransactions"
      FROM payments;
    `;

    return stats[0] || {
      totalRevenue: 0,
      todayRevenue: 0,
      pendingPayments: 0,
      failedPayments: 0,
      totalTransactions: 0
    };
  }

  async getPaymentById(id) {
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        order: true,
        boutique: true
      }
    });
    if (!payment) throw { status: 404, message: 'Payment not found' };
    return this.mapPaymentResponse(payment);
  }

  async verifyPayment(userId, razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId) {
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder')
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature === expectedSign) {
      const payment = await paymentsRepository.findPaymentFirst({ razorpay_order_id });

      if (payment && payment.status === 'captured') {
        return { message: "Payment already verified", status: 'captured' };
      }

      if (payment) {
        await this.capturePayment({
          paymentId: payment.id,
          razorpay_payment_id,
          razorpay_signature,
          method: 'card'
        });
      }

      await logAction('PAYMENT_VERIFIED', 'Order', orderId, userId, { 
        orderId, 
        razorpay_payment_id, 
        amount: payment?.amount ? Number(payment.amount) : 0 
      });

      return { message: "Payment verified successfully" };
    } else {
      await paymentsRepository.updatePaymentMany({ razorpay_order_id }, { status: 'failed' });
      throw { status: 400, message: "Invalid signature sent!" };
    }
  }

  async processWebhook(event, payload) {
    if (event === 'payment.captured') {
      const razorpay_order_id = payload.order_id;
      const payment = await paymentsRepository.findPaymentFirst({ razorpay_order_id });

      if (payment && payment.status !== 'captured') {
        await this.capturePayment({
          paymentId: payment.id,
          razorpay_payment_id: payload.id,
          razorpay_signature: '',
          method: payload.method || ''
        });
      }
    }
  }

  async processRefund(userId, paymentId, amount, reason) {
    const payment = await paymentsRepository.findPaymentUnique(paymentId);
    if (!payment || payment.status !== 'captured') {
      throw { status: 400, message: 'Invalid payment for refund' };
    }

    const refundNetAmount = Number(payment.netAmount) * (Number(amount) / Number(payment.amount));

    const updatedPayment = await prisma.$transaction(async (tx) => {
      const p = await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: 'refunded',
          refundReason: reason,
          refundId: `ref_${Date.now()}`
        }
      });

      await tx.boutique.update({
        where: { id: payment.boutiqueId },
        data: {
          walletBalance: { decrement: this.parseDecimalVal(refundNetAmount) }
        }
      });

      const order = await tx.order.findUnique({
        where: { id: payment.orderId }
      });
      if (order) {
        const newAdvance = Number(order.advancePaid) - Number(amount);
        const newPaymentStatus = newAdvance >= Number(order.price) ? 'captured' : 'pending';

        await tx.order.update({
          where: { id: payment.orderId },
          data: {
            advancePaid: this.parseDecimalVal(newAdvance),
            remainingAmount: this.parseDecimalVal(Number(order.price) - newAdvance),
            paymentStatus: newPaymentStatus,
            orderHistories: {
              create: {
                status: order.orderStatus,
                note: `Refund of ₹${amount} processed. Reason: ${reason}`
              }
            }
          }
        });
      }

      return p;
    });

    await logAction('PAYMENT_REFUNDED', 'Order', payment.orderId, userId, { paymentId, amount, reason });

    return this.mapPaymentResponse(updatedPayment);
  }

  async processPayout(userId, paymentIds) {
    await paymentsRepository.updatePaymentMany({
      id: { in: paymentIds },
      status: 'captured',
      payoutStatus: 'pending'
    }, {
      payoutStatus: 'completed',
      payoutId: `payout_${Date.now()}`
    });

    await logAction('PAYOUT_COMPLETED', 'Payment', paymentIds[0] || 'UNKNOWN', userId, { paymentIds });
  }

  async getPayments({ status, boutiqueId, search, startDate, endDate }) {
    let where = {};

    if (status) where.status = status;
    if (boutiqueId) where.boutiqueId = boutiqueId;
    if (search) {
      where.OR = [
        { razorpay_order_id: { contains: search, mode: 'insensitive' } },
        { razorpay_payment_id: { contains: search, mode: 'insensitive' } },
        { receipt: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const payments = await paymentsRepository.findPayments(where, {
      order: { select: { id: true, orderId: true, customerName: true } },
      boutique: { select: { id: true, name: true } }
    }, { createdAt: 'desc' });

    return payments.map(p => this.mapPaymentResponse(p));
  }

  // ── Payouts business logic ──
  async getCommissionSettings() {
    return this.getPlatformSettings();
  }

  async updateCommissionSettings(userId, globalCommissionRate, categoryCommissions) {
    const settings = await this.getPlatformSettings();

    const updatedSettings = await paymentsRepository.updatePlatformSettings(settings.id, {
      globalCommissionRate: this.parseDecimalVal(globalCommissionRate),
      categoryCommissions: categoryCommissions || {}
    });

    await logAction('UPDATE_COMMISSION_SETTINGS', 'PlatformSetting', settings.id, userId, {
      before: settings,
      after: updatedSettings
    });

    return updatedSettings;
  }

  async setBoutiqueCommission(userId, boutiqueId, commissionRate) {
    const boutique = await paymentsRepository.findBoutiqueUnique(boutiqueId);
    if (!boutique) throw { status: 404, message: 'Boutique not found' };

    const updatedBoutique = await paymentsRepository.updateBoutique(boutiqueId, {
      commissionRate: this.parseDecimalVal(commissionRate)
    });

    await logAction('UPDATE_BOUTIQUE_COMMISSION', 'Boutique', boutiqueId, userId, {
      before: boutique.commissionRate,
      after: updatedBoutique.commissionRate
    });

    return updatedBoutique;
  }

  async getPayoutsAdmin(status, boutiqueId) {
    let where = {};
    if (status) where.status = status;
    if (boutiqueId) where.boutiqueId = boutiqueId;

    return paymentsRepository.findPayouts(where, {
      boutique: { select: { name: true, ownerName: true } }
    });
  }

  async getPayoutsOwner(assignedBoutiqueId) {
    if (!assignedBoutiqueId) throw { status: 400, message: 'Owner has no assigned boutique' };

    const payouts = await paymentsRepository.findPayouts({ boutiqueId: assignedBoutiqueId });
    const boutique = await paymentsRepository.findBoutiqueUnique(assignedBoutiqueId);

    return {
      wallet: {
        walletBalance: Number(boutique.walletBalance),
        pendingPayout: Number(boutique.pendingPayout),
        totalPaidOut: Number(boutique.totalPaidOut)
      },
      data: payouts
    };
  }

  async generatePayoutAdmin(userId, boutiqueId, amount) {
    if (!boutiqueId || !amount || amount <= 0) {
      throw { status: 400, message: 'Boutique ID and valid amount are required' };
    }

    const boutique = await paymentsRepository.findBoutiqueUnique(boutiqueId);
    if (!boutique) throw { status: 404, message: 'Boutique not found' };

    const payoutAmount = this.parseDecimalVal(amount);
    if (Number(boutique.walletBalance) < Number(payoutAmount)) {
      throw { status: 400, message: 'Insufficient boutique wallet balance for this payout' };
    }

    const pendingPayments = await paymentsRepository.findPayments({
      boutiqueId,
      status: 'captured',
      payoutStatus: 'pending'
    });

    const paymentIds = pendingPayments.map(p => p.id);

    const payout = await prisma.$transaction(async (tx) => {
      await tx.boutique.update({
        where: { id: boutiqueId },
        data: {
          walletBalance: { decrement: payoutAmount },
          pendingPayout: { increment: payoutAmount }
        }
      });

      const p = await tx.payout.create({
        data: {
          boutiqueId,
          amount: payoutAmount,
          status: 'PENDING'
        }
      });

      if (paymentIds.length > 0) {
        await tx.payment.updateMany({
          where: { id: { in: paymentIds } },
          data: {
            payoutId: p.id,
            payoutStatus: 'scheduled'
          }
        });
      }

      return p;
    });

    await logAction('GENERATE_PAYOUT', 'Payout', payout.id, userId, {
      amount: Number(payoutAmount),
      boutiqueId
    });

    return payout;
  }

  async updatePayoutStatusAdmin(userId, id, status, referenceCode, note) {
    if (!['APPROVED', 'RELEASED', 'FAILED'].includes(status)) {
      throw { status: 400, message: 'Invalid payout status. Use APPROVED, RELEASED, or FAILED' };
    }

    const payout = await paymentsRepository.findPayoutUnique(id);
    if (!payout) throw { status: 404, message: 'Payout not found' };

    if (payout.status === 'RELEASED') {
      throw { status: 400, message: 'This payout has already been released' };
    }

    const payoutAmount = this.parseDecimalVal(payout.amount);

    const result = await prisma.$transaction(async (tx) => {
      let updatedPayout;

      if (status === 'RELEASED') {
        if (!referenceCode) {
          throw new Error('Reference code is required to release payout');
        }

        await tx.boutique.update({
          where: { id: payout.boutiqueId },
          data: {
            pendingPayout: { decrement: payoutAmount },
            totalPaidOut: { increment: payoutAmount }
          }
        });

        await tx.payment.updateMany({
          where: { payoutId: id },
          data: { payoutStatus: 'completed' }
        });

        updatedPayout = await tx.payout.update({
          where: { id },
          data: {
            status: 'RELEASED',
            referenceCode,
            payoutDate: new Date()
          }
        });

      } else if (status === 'FAILED') {
        await tx.boutique.update({
          where: { id: payout.boutiqueId },
          data: {
            pendingPayout: { decrement: payoutAmount },
            walletBalance: { increment: payoutAmount }
          }
        });

        await tx.payment.updateMany({
          where: { payoutId: id },
          data: {
            payoutId: null,
            payoutStatus: 'pending'
          }
        });

        updatedPayout = await tx.payout.update({
          where: { id },
          data: {
            status: 'FAILED',
            errorMsg: note || 'Payout transfer failed'
          }
        });

      } else {
        updatedPayout = await tx.payout.update({
          where: { id },
          data: { status: 'APPROVED' }
        });
      }

      return updatedPayout;
    });

    await logAction('UPDATE_PAYOUT_STATUS', 'Payout', id, userId, {
      before: payout.status,
      after: status,
      referenceCode
    });

    return result;
  }
}

module.exports = new PaymentsService();
