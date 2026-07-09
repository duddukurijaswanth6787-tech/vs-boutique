import React, { useState, useEffect } from 'react';
import PremiumLegalPage from '../../../../core/components/shared/PremiumLegalPage';
import axios from 'axios';

export default function PrivacyPolicy() {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('Privacy Policy');
  const [lastUpdated, setLastUpdated] = useState('July 9, 2026');
  const [loading, setLoading] = useState(true);

  const defaultHtml = `
    <h2>1. Information We Collect</h2>
    <p>We collect personal information required to deliver custom tailoring services. This includes your name, email, phone number, physical measurements, delivery address, and payment preferences.</p>

    <h2>2. How We Use Information</h2>
    <p>We use your data to: process orders, personalize stitching profiles, send shipping alerts via SMS/WhatsApp, and coordinate appointments with master tailors.</p>

    <h2>3. DPDP Act & GDPR Compliance</h2>
    <p>In compliance with the Indian Digital Personal Data Protection (DPDP) Act and GDPR, we respect your rights:</p>
    <ul>
      <li><strong>Consent:</strong> We collect information solely with your explicit consent.</li>
      <li><strong>Right to Deletion:</strong> You can request deletion of your account and measurements at any time.</li>
      <li><strong>Data Portability:</strong> You can download a copy of your measurements from your profile dashboard.</li>
    </ul>

    <h2>4. Cookies & Analytics</h2>
    <p>We use secure cookies to keep you logged in, save your shopping cart, and track site performance analytics. No credit card or sensitive authentication details are stored in cookies.</p>

    <h2>5. Contact Information</h2>
    <p>For data privacy queries or erasure requests, contact our Data Protection Officer at privacy@vsboutique.shop.</p>
  `;

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        const backendUrl = (window as any).VITE_API_URL || (import.meta as any).env?.VITE_API_URL || '';
        const res = await axios.get(`${backendUrl}/api/v1/cms/policies/privacy`);
        if (res.data && res.data.success && res.data.data) {
          setTitle(res.data.data.title);
          setContent(res.data.data.content);
          setLastUpdated(new Date(res.data.data.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
        }
      } catch (err) {
        console.warn('Failed to load privacy policy from backend, using fallback:', err);
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
      seoTitle="Privacy Policy | VS Boutique"
      seoDescription="Our privacy policy is fully compliant with GDPR and the Indian DPDP Act. Read how we protect your personal measurements and payment data."
    >
      <div dangerouslySetInnerHTML={{ __html: content || defaultHtml }} />
    </PremiumLegalPage>
  );
}
