import { Injectable } from '@nestjs/common';

@Injectable()
export class RagIntentService {
  routeIntent(message: string): string {
    const text = message.toLowerCase().trim();

    // 1. ORDER_TRACKING / ORDER_STATUS
    if (
      (text.includes('order') ||
        text.includes('track') ||
        text.includes('where is')) &&
      (/ord-\d+/i.test(text) ||
        text.includes('status') ||
        text.includes('timeline'))
    ) {
      return 'ORDER_TRACKING';
    }

    // 2. REFUND_STATUS / REFUND_POLICY
    if (
      text.includes('refund') ||
      text.includes('money back') ||
      text.includes('reimburse')
    ) {
      if (
        text.includes('status') ||
        text.includes('when') ||
        text.includes('receive')
      ) {
        return 'REFUND_STATUS';
      }
      return 'REFUND_POLICY';
    }

    // 3. RETURN_POLICY / RETURN_STATUS
    if (
      text.includes('return') ||
      text.includes('exchange') ||
      text.includes('replace')
    ) {
      if (
        text.includes('status') ||
        text.includes('where is') ||
        text.includes('approved')
      ) {
        return 'RETURN_STATUS';
      }
      return 'RETURN_POLICY';
    }

    // 4. PRODUCT_SEARCH / PRODUCT_AVAILABILITY
    if (
      text.includes('buy') ||
      text.includes('find') ||
      text.includes('dress') ||
      text.includes('kurti') ||
      text.includes('saree') ||
      text.includes('stock') ||
      text.includes('available') ||
      text.includes('size') ||
      text.includes('color')
    ) {
      if (
        text.includes('stock') ||
        text.includes('available') ||
        text.includes('left')
      ) {
        return 'PRODUCT_AVAILABILITY';
      }
      return 'PRODUCT_SEARCH';
    }

    // 5. FASHION_ADVICE
    if (
      text.includes('wear') ||
      text.includes('styling') ||
      text.includes('trends') ||
      text.includes('wedding') ||
      text.includes('occasion') ||
      text.includes('match')
    ) {
      return 'FASHION_ADVICE';
    }

    // 6. SHIPPING_POLICY
    if (
      text.includes('ship') ||
      text.includes('delivery time') ||
      text.includes('courier')
    ) {
      return 'SHIPPING_POLICY';
    }

    // 7. PAYMENT_HELP
    if (
      text.includes('pay') ||
      text.includes('razorpay') ||
      text.includes('card') ||
      text.includes('upi') ||
      text.includes('wallet')
    ) {
      return 'PAYMENT_HELP';
    }

    // 8. FAQ
    if (
      text.includes('faq') ||
      text.includes('question') ||
      text.includes('how do i') ||
      text.includes('policy')
    ) {
      return 'FAQ';
    }

    return 'UNKNOWN';
  }
}
