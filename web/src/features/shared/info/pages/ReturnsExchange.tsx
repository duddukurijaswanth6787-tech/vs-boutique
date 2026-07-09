import React, { useState, useEffect } from 'react';
import PremiumLegalPage from '../../../../core/components/shared/PremiumLegalPage';
import axios from 'axios';

export default function ReturnsExchange() {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('Returns & Exchange Policy');
  const [lastUpdated, setLastUpdated] = useState('July 9, 2026');
  const [loading, setLoading] = useState(true);

  const defaultHtml = `
    <h2>Eligibility Criteria</h2>
    <p>Since VS Boutique specializes in custom tailoring, measurements are locked to your specifications. However, we stand behind the quality of our craftsmanship:</p>
    <ul>
      <li><strong>Return Window:</strong> Returns for quality errors or wrong items must be requested within 7 days of delivery.</li>
      <li><strong>Exchange Window:</strong> Alteration or sizing exchanges are accepted within 7 days of delivery.</li>
      <li><strong>Non-Returnable Items:</strong> Custom design outfits, fabrics altered after dispatch, or worn/washed garments cannot be returned.</li>
    </ul>

    <h2>Return Conditions</h2>
    <p>Items must be unused, unwashed, unaltered, and returned in their original packaging with all tags attached.</p>

    <h2>Refund Timeline</h2>
    <p>Upon receiving your return package, our quality check team will inspect the item within 48 hours. Approved refunds are credited to the original payment source within 7-10 business days. For Cash on Delivery orders, we will request your bank details to complete the transfer.</p>

    <h2>Return and Exchange Process</h2>
    <ol>
      <li>Go to the Support Center or your Profile Orders dashboard.</li>
      <li>Click on 'Request Return/Exchange' and choose the reason.</li>
      <li>Upload a clear photo if the item is damaged or sizing is wrong.</li>
      <li>We will arrange a free reverse pickup from your registered shipping address within 24-48 hours.</li>
    </ol>
    
    <h2>Wrong or Damaged Products</h2>
    <p>If you receive an incorrect size or damaged product, we offer a 100% free replacement. Standard return policies apply, and replacement shipments are prioritized at no extra cost.</p>
  `;

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        const backendUrl = (window as any).VITE_API_URL || (import.meta as any).env?.VITE_API_URL || '';
        const res = await axios.get(`${backendUrl}/api/v1/cms/policies/returns`);
        if (res.data && res.data.success && res.data.data) {
          setTitle(res.data.data.title);
          setContent(res.data.data.content);
          setLastUpdated(new Date(res.data.data.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
        }
      } catch (err) {
        console.warn('Failed to load returns policy from backend, using fallback:', err);
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
      seoTitle="Returns & Exchange Policy | VS Boutique"
      seoDescription="Find out about return eligibility, exchange windows, refund processing times, and pick-up scheduling at VS Boutique."
    >
      <div dangerouslySetInnerHTML={{ __html: content || defaultHtml }} />
    </PremiumLegalPage>
  );
}
