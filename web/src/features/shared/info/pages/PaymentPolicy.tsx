import React, { useState, useEffect } from 'react';
import PremiumLegalPage from '../../../../core/components/shared/PremiumLegalPage';
import axios from 'axios';

export default function PaymentPolicy() {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('Payment Policy');
  const [lastUpdated, setLastUpdated] = useState('July 9, 2026');
  const [loading, setLoading] = useState(true);

  const defaultHtml = `
    <h2>1. Accepted Payment Methods</h2>
    <p>We support multiple secure payment gateways (including Razorpay) to accept payments via:</p>
    <ul>
      <li><strong>UPI:</strong> Google Pay, PhonePe, Paytm, BHIM</li>
      <li><strong>Cards:</strong> Visa, MasterCard, RuPay, Maestro Credit & Debit Cards</li>
      <li><strong>Net Banking:</strong> Supported across all major Indian banks</li>
      <li><strong>Wallets:</strong> Amazon Pay, Mobikwik, PhonePe Wallet</li>
      <li><strong>Cash on Delivery (COD):</strong> Available on orders below ₹10,000 where serviceable.</li>
    </ul>

    <h2>2. Payment Security</h2>
    <p>All online transactions are encrypted using 256-bit SSL (Secure Sockets Layer) technology. We comply with Payment Card Industry Data Security Standards (PCI-DSS). Your payment credentials are never stored on our servers.</p>

    <h2>3. Failed Transactions</h2>
    <p>In case of a failed transaction where money was debited but the order was not confirmed, the amount is automatically refunded by your banking partner within 3-5 business days.</p>

    <h2>4. Invoice Generation & GST</h2>
    <p>Every confirmed order generates an official tax invoice containing standard GST details. The invoice will be dispatched with the package and sent to your registered email address.</p>
  `;

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        const backendUrl = (window as any).VITE_API_URL || (import.meta as any).env?.VITE_API_URL || '';
        const res = await axios.get(`${backendUrl}/api/v1/cms/policies/payment`);
        if (res.data && res.data.success && res.data.data) {
          setTitle(res.data.data.title);
          setContent(res.data.data.content);
          setLastUpdated(new Date(res.data.data.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
        }
      } catch (err) {
        console.warn('Failed to load payment policy from backend, using fallback:', err);
        setContent(defaultHtml);
      } finally {
        setLoading(false);
      }
    };
    fetchPolicy();
  }, []);

  return (
    <PremiumLegalPage
      title={title}
      lastUpdated={lastUpdated}
      seoTitle="Payment Methods & Security Policy | VS Boutique"
      seoDescription="Accepted payments (UPI, Cards, Netbanking, COD), online transaction security protocols, SSL encryption and failed transaction refunds at VS Boutique."
    >
      <div dangerouslySetInnerHTML={{ __html: content || defaultHtml }} />
    </PremiumLegalPage>
  );
}
