import LegalPage from '@core/components/shared/LegalPage';

const CustomerShipping = () => (
  <LegalPage title="Shipping Policy" lastUpdated="June 24, 2026">
    <h2>1. Shipping Coverage</h2>
    <p>We currently provide shipping services across India. Delivery timelines vary based on location and boutique processing time.</p>

    <h2>2. Delivery Timeframes</h2>
    <ul>
      <li>Standard tailoring: 7-14 business days after boutique confirmation.</li>
      <li>Express tailoring: 3-5 business days (additional charges apply).</li>
      <li>Shipping time: 2-5 business days depending on location.</li>
    </ul>

    <h2>3. Shipping Charges</h2>
    <ul>
      <li>Free shipping on orders above &₹;999.</li>
      <li>Standard shipping: ₹49 for orders below ₹999.</li>
      <li>Express shipping: ₹99 flat rate.</li>
    </ul>

    <h2>4. Order Tracking</h2>
    <p>Once your order is shipped, you will receive a tracking ID via SMS and email. You can also track your order in real-time through the Order Tracking section in your profile.</p>

    <h2>5. Delivery Issues</h2>
    <p>If your package is delayed or damaged, please contact us within 48 hours of delivery (or expected delivery date) through our support ticket system or Contact page.</p>
  </LegalPage>
);

export default CustomerShipping;
