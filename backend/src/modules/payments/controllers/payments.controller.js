const crypto = require('crypto');
const paymentsService = require('../services/payments.service');

class PaymentsController {
  async createPaymentOrder(req, res) {
    try {
      const { amount, currency, receipt, orderId, boutiqueId } = req.body;
      const rzpOrder = await paymentsService.createPaymentOrder(req.user.id, amount, currency, receipt, orderId, boutiqueId);
      res.json(rzpOrder);
    } catch (err) {
      console.error('Razorpay Order Creation Error:', err);
      const status = err.status || 500;
      res.status(status).json({ message: err.message || 'Failed to create payment order' });
    }
  }

  async getSettlements(req, res) {
    try {
      const settlements = await paymentsService.getSettlements();
      res.json(settlements);
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getReports(req, res) {
    try {
      const report = await paymentsService.getReports();
      res.json(report);
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getPaymentById(req, res) {
    try {
      const payment = await paymentsService.getPaymentById(req.params.id);
      res.json(payment);
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async verifyPayment(req, res) {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;
      const result = await paymentsService.verifyPayment(
        req.user.id,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        orderId
      );
      res.status(200).json(result);
    } catch (err) {
      console.error('Payment Verification Error:', err);
      res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
    }
  }

  async webhook(req, res) {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
      return res.status(500).send('Webhook secret not configured');
    }
    const signature = req.headers['x-razorpay-signature'];

    try {
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(req.body))
        .digest('hex');

      if (signature !== expectedSignature) {
        return res.status(400).send('Invalid signature');
      }

      const event = req.body.event;
      const payload = req.body.payload.payment.entity;

      console.log(`[PAYMENT WEBHOOK] Event: ${event} | Payment ID: ${payload.id}`);
      await paymentsService.processWebhook(event, payload);

      res.json({ status: 'ok' });
    } catch (err) {
      console.error('Webhook Error:', err);
      res.status(500).send('Webhook failed');
    }
  }

  async refund(req, res) {
    try {
      const { paymentId, amount, reason } = req.body;
      const result = await paymentsService.processRefund(req.user.id, paymentId, amount, reason);
      res.json({ message: 'Refund processed successfully', payment: result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async payout(req, res) {
    try {
      const { paymentIds } = req.body;
      await paymentsService.processPayout(req.user.id, paymentIds);
      res.json({ message: 'Payouts marked as completed' });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getPayments(req, res) {
    try {
      const { status, boutiqueId, search, startDate, endDate } = req.query;
      const payments = await paymentsService.getPayments({ status, boutiqueId, search, startDate, endDate });
      res.json(payments);
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  // ── Payouts Controllers ──
  async getCommissionSettings(req, res) {
    try {
      const settings = await paymentsService.getCommissionSettings();
      res.json({ success: true, data: settings });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async updateCommissionSettings(req, res) {
    try {
      const { globalCommissionRate, categoryCommissions } = req.body;
      const updated = await paymentsService.updateCommissionSettings(req.user.id, globalCommissionRate, categoryCommissions);
      res.json({ success: true, data: updated });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async setBoutiqueCommission(req, res) {
    try {
      const { id } = req.params;
      const { commissionRate } = req.body;
      const updated = await paymentsService.setBoutiqueCommission(req.user.id, id, commissionRate);
      res.json({ success: true, data: updated });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getPayoutsAdmin(req, res) {
    try {
      const { status, boutiqueId } = req.query;
      const payouts = await paymentsService.getPayoutsAdmin(status, boutiqueId);
      res.json({ success: true, data: payouts });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async getPayoutsOwner(req, res) {
    try {
      const boutiqueId = req.user.assignedBoutiqueId;
      const result = await paymentsService.getPayoutsOwner(boutiqueId);
      res.json(result);
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async generatePayoutAdmin(req, res) {
    try {
      const { boutiqueId, amount } = req.body;
      const payout = await paymentsService.generatePayoutAdmin(req.user.id, boutiqueId, amount);
      res.status(201).json({ success: true, data: payout });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }

  async updatePayoutStatusAdmin(req, res) {
    try {
      const { id } = req.params;
      const { status, referenceCode, note } = req.body;
      const result = await paymentsService.updatePayoutStatusAdmin(req.user.id, id, status, referenceCode, note);
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message });
    }
  }
}

module.exports = new PaymentsController();
