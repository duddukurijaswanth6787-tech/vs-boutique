import React from 'react';
import LegalPageScreen from '../src/screens/LegalPageScreen';

const sections = [
  {
    heading: '1. Shipping Coverage',
    content: 'We currently provide shipping services across India. Delivery timelines vary based on location and boutique processing time.'
  },
  {
    heading: '2. Delivery Timeframes',
    content: [
      { body: 'Standard tailoring: 7-14 business days after boutique confirmation.' },
      { body: 'Express tailoring: 3-5 business days (additional charges apply).' },
      { body: 'Shipping time: 2-5 business days depending on location.' }
    ]
  },
  {
    heading: '3. Shipping Charges',
    content: [
      { body: 'Free shipping on orders above ₹999.' },
      { body: 'Standard shipping: ₹49 for orders below ₹999.' },
      { body: 'Express shipping: ₹99 flat rate.' }
    ]
  },
  {
    heading: '4. Order Tracking',
    content: 'Once your order is shipped, you will receive a tracking ID via SMS and email. You can also track your order in real-time through the Order Tracking section in your profile.'
  },
  {
    heading: '5. Delivery Issues',
    content: 'If your package is delayed or damaged, please contact us within 48 hours of delivery (or expected delivery date) through our support ticket system or Contact page.'
  }
];

export default function ShippingPolicy() {
  return (
    <LegalPageScreen
      title="Shipping Policy"
      lastUpdated="June 24, 2026"
      sections={sections}
    />
  );
}