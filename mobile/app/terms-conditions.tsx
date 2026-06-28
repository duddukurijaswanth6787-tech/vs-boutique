import React from 'react';
import LegalPageScreen from '../src/screens/LegalPageScreen';

const sections = [
  {
    heading: '1. Acceptance of Terms',
    content: 'By accessing or using VS Boutique (vsboutique.shop), you agree to be bound by these Terms and Conditions. If you do not agree, please do not use our services.'
  },
  {
    heading: '2. Services Description',
    content: 'VS Boutique is a platform connecting customers with premium tailoring boutiques. We facilitate order placement, measurement submission, design selection, appointment booking, and secure payment processing.'
  },
  {
    heading: '3. User Accounts',
    content: [
      { body: 'You must provide accurate and complete information when creating an account.' },
      { body: 'You are responsible for maintaining the confidentiality of your account credentials.' },
      { body: 'You must be at least 18 years old to use our services.' },
      { body: 'We reserve the right to suspend or terminate accounts that violate our terms.' }
    ]
  },
  {
    heading: '4. Orders & Payments',
    content: [
      { body: 'All orders are processed through our secure checkout system.' },
      { body: 'Prices are quoted in Indian Rupees (INR) and inclusive of applicable taxes.' },
      { body: 'Advance payment is required to confirm orders. Final pricing may be confirmed by the boutique.' },
      { body: 'Payments are processed securely through Razorpay.' }
    ]
  },
  {
    heading: '5. Cancellations & Refunds',
    content: 'Orders can be cancelled before the boutique starts processing. Refund eligibility depends on the stage of order processing. Please refer to our Refund Policy for detailed information.'
  },
  {
    heading: '6. Intellectual Property',
    content: 'All designs, images, and content on this platform are the property of VS Boutique or its partner boutiques. Unauthorized reproduction or distribution is prohibited.'
  },
  {
    heading: '7. Limitation of Liability',
    content: 'VS Boutique acts as an intermediary platform. We are not liable for the quality of tailoring services provided by partner boutiques. Any disputes regarding work quality will be mediated through our support system.'
  },
  {
    heading: '8. Contact',
    content: 'For questions about these terms, contact us at support@vsboutique.shop.'
  }
];

export default function TermsConditions() {
  return (
    <LegalPageScreen
      title="Terms & Conditions"
      lastUpdated="June 24, 2026"
      sections={sections}
    />
  );
}