import React from 'react';
import LegalPageScreen from '../src/screens/LegalPageScreen';

const sections = [
  {
    heading: '1. Information We Collect',
    content: [
      { body: 'We collect information you provide directly: name, phone number, email address, shipping address, and measurement details required for tailoring services.' },
      { body: 'We automatically collect certain information when you use our platform: device information, IP address, browsing behavior, and transaction history.' }
    ]
  },
  {
    heading: '2. How We Use Your Information',
    content: [
      { body: 'To process and fulfill your orders, including tailoring and delivery services.' },
      { body: 'To communicate with you about orders, appointments, and customer support.' },
      { body: 'To improve our services, personalize your experience, and send relevant recommendations.' },
      { body: 'To process payments securely through Razorpay.' }
    ]
  },
  {
    heading: '3. Data Security',
    content: 'We implement industry-standard security measures including SSL encryption, secure token-based authentication, and encrypted payment processing. Your payment details are handled directly by Razorpay and never stored on our servers.'
  },
  {
    heading: '4. Data Sharing',
    content: 'We share your information only with: the boutique fulfilling your order, Razorpay for payment processing, and delivery partners for shipping. We never sell your personal data to third parties.'
  },
  {
    heading: '5. Your Rights',
    content: 'You have the right to access, correct, or delete your personal data at any time through your profile settings. You can opt out of marketing communications at any time.'
  },
  {
    heading: '6. Contact Us',
    content: 'For privacy-related inquiries, please contact us at support@vsboutique.shop or through our Contact page.'
  }
];

export default function PrivacyPolicy() {
  return (
    <LegalPageScreen
      title="Privacy Policy"
      lastUpdated="June 24, 2026"
      sections={sections}
    />
  );
}