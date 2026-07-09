import React, { useState, useEffect } from 'react';
import PremiumLegalPage from '../../../../core/components/shared/PremiumLegalPage';
import axios from 'axios';

export default function ShippingPolicy() {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('Shipping Policy');
  const [lastUpdated, setLastUpdated] = useState('July 9, 2026');
  const [loading, setLoading] = useState(true);

  // Fallback default static markup in case backend is unavailable
  const defaultHtml = `
    <h2>Shipping Coverage</h2>
    <p>We provide PAN India delivery to over 26,000 serviceable pincodes across the country. We partner only with premium courier services (Blue Dart, Delhivery, and DTDC) to ensure the safest transit of your bespoke ethnic garments.</p>
    
    <h2>Order Processing</h2>
    <p>Every outfit is hand-crafted and custom-tailored. Standard ready-to-ship orders are processed within 24 to 48 business hours. Bespoke orders requiring custom stitching will proceed as per the timeline selected during the master tailor consultation.</p>
    
    <h2>Delivery Timelines</h2>
    <ul>
      <li><strong>Metro Cities:</strong> 2 to 5 business days</li>
      <li><strong>Other Cities & Towns:</strong> 4 to 8 business days</li>
      <li><strong>Remote Areas:</strong> 5 to 10 business days</li>
    </ul>

    <h2>Shipping Charges</h2>
    <p>We offer <strong>FREE shipping on orders above ₹999</strong>. For orders below this value, a nominal flat shipping fee of <strong>₹99</strong> will be applied at checkout.</p>
    
    <h2>Tracking your Order</h2>
    <p>Once your order is shipped, tracking details are sent instantly via Email, SMS, and WhatsApp. You will receive active tracking links to monitor shipment movement in real-time.</p>

    <h2>Failed Delivery Attempts</h2>
    <p>Our courier partners will attempt delivery up to 3 times. If unanswered, the package is returned to our boutique center. A re-attempt can be scheduled by contacting our support team.</p>

    <h2>Damaged Packages</h2>
    <p>If you receive a package that appears damaged, opened, or tampered with, please record an unboxing video and refuse to accept the delivery. Immediately notify us at support@vsboutique.shop or call us with your Order ID.</p>
  `;

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        const backendUrl = (window as any).VITE_API_URL || (import.meta as any).env?.VITE_API_URL || '';
        const res = await axios.get(`${backendUrl}/api/v1/cms/policies/shipping`);
        if (res.data && res.data.success && res.data.data) {
          setTitle(res.data.data.title);
          setContent(res.data.data.content);
          setLastUpdated(new Date(res.data.data.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
        }
      } catch (err) {
        console.warn('Failed to load shipping policy from backend, using fallback:', err);
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
      seoTitle="Shipping & Delivery Policy | VS Boutique"
      seoDescription="PAN India delivery options, serviceable pincodes, courier partners, order processing times, delivery timelines and shipping charges at VS Boutique."
    >
      <div dangerouslySetInnerHTML={{ __html: content || defaultHtml }} />
    </PremiumLegalPage>
  );
}
