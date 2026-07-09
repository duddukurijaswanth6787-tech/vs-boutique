import React, { useState, useEffect } from 'react';
import PremiumLegalPage from '../../../../core/components/shared/PremiumLegalPage';
import axios from 'axios';

export default function TermsAndConditions() {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('Terms & Conditions');
  const [lastUpdated, setLastUpdated] = useState('July 9, 2026');
  const [loading, setLoading] = useState(true);

  const defaultHtml = `
    <h2>1. Introduction</h2>
    <p>Welcome to VS Boutique. These Terms and Conditions govern your use of our platform, mobile application, custom tailoring bookings, and commerce orders. By placing an order, you agree to comply with these terms.</p>

    <h2>2. User Account Eligibility</h2>
    <p>You must be at least 18 years old or accessing the site under parent supervision. To order bespoke tailoring, you agree to provide authentic and accurate measurements. We hold no liability for errors caused by inaccurate measurements provided by the user.</p>

    <h2>3. Orders & Tailoring Agreements</h2>
    <p>Once a tailoring booking is made and a master tailor is assigned, cancellations are allowed within 12 hours. Post fabric-cutting or commencement of work, no cancellations are permitted.</p>

    <h2>4. Pricing & Payments</h2>
    <p>All prices listed are in Indian Rupees (INR) and are inclusive of GST. Payment must be made in full using secured UPI, Cards, Net Banking, or COD where applicable.</p>

    <h2>5. Intellectual Property</h2>
    <p>All custom designs, collection catalogs, website graphics, layouts, and logos are the intellectual property of VS Boutique. Any unauthorized reproduction, reuse, or commercial use is strictly prohibited.</p>

    <h2>6. Governing Law</h2>
    <p>These Terms and Conditions are governed by the laws of India. Any disputes arising from transactions on this platform shall be subject to the exclusive jurisdiction of the courts in Hyderabad, Telangana.</p>
  `;

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        const backendUrl = (window as any).VITE_API_URL || (import.meta as any).env?.VITE_API_URL || '';
        const res = await axios.get(`${backendUrl}/api/v1/cms/policies/terms`);
        if (res.data && res.data.success && res.data.data) {
          setTitle(res.data.data.title);
          setContent(res.data.data.content);
          setLastUpdated(new Date(res.data.data.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
        }
      } catch (err) {
        console.warn('Failed to load terms from backend, using fallback:', err);
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
      seoTitle="Terms & Conditions | VS Boutique"
      seoDescription="Official Terms & Conditions of VS Boutique e-commerce platform. Review legal rules, user account guidelines, payment terms, and tailoring contracts."
    >
      <div dangerouslySetInnerHTML={{ __html: content || defaultHtml }} />
    </PremiumLegalPage>
  );
}
