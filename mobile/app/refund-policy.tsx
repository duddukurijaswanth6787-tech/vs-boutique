import React from 'react';
import LegalPageScreen from '../src/screens/LegalPageScreen';

const sections = [
  {
    heading: '1. Refund Eligibility',
    content: [
      { body: 'Orders cancelled before the boutique starts processing: Full refund of advance payment.' },
      { body: 'Orders cancelled after processing has started: Partial refund at boutique discretion.' },
      { body: 'Orders where work is complete: No refund applicable.' },
      { body: 'Defective or incorrect work: Full refund after verification through our support ticket system.' }
    ]
  },
  {
    heading: '2. Refund Process',
    content: [
      { body: 'Submit a refund request through our Contact page or support ticket system.' },
      { body: 'Our team will review your request within 2-3 business days.' },
      { body: 'Approved refunds will be processed within 5-7 business days.' },
      { body: 'Refunds are credited to the original payment method via Razorpay.' }
    ]
  },
  {
    heading: '3. Non-Refundable Items',
    content: 'Custom-made garments that have been completed according to agreed specifications. Rush orders once processing has begun. Measurement submission errors by the customer.'
  },
  {
    heading: '4. Dispute Resolution',
    content: 'If you are unsatisfied with a resolution, please raise a support ticket through our platform. We commit to resolving all disputes within 7 business days.'
  }
];

export default function RefundPolicy() {
  return (
    <LegalPageScreen
      title="Refund Policy"
      lastUpdated="June 24, 2026"
      sections={sections}
    />
  );
}