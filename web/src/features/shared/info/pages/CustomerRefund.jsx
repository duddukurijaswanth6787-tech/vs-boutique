import LegalPage from '@core/components/shared/LegalPage';

const CustomerRefund = () => (
  <LegalPage title="Refund Policy" lastUpdated="June 24, 2026">
    <h2>1. Refund Eligibility</h2>
    <ul>
      <li>Orders cancelled before the boutique starts processing: Full refund of advance payment.</li>
      <li>Orders cancelled after processing has started: Partial refund at boutique discretion.</li>
      <li>Orders where work is complete: No refund applicable.</li>
      <li>Defective or incorrect work: Full refund after verification through our support ticket system.</li>
    </ul>

    <h2>2. Refund Process</h2>
    <ul>
      <li>Submit a refund request through our Contact page or support ticket system.</li>
      <li>Our team will review your request within 2-3 business days.</li>
      <li>Approved refunds will be processed within 5-7 business days.</li>
      <li>Refunds are credited to the original payment method via Razorpay.</li>
    </ul>

    <h2>3. Non-Refundable Items</h2>
    <p>Custom-made garments that have been completed according to agreed specifications. Rush orders once processing has begun. Measurement submission errors by the customer.</p>

    <h2>4. Dispute Resolution</h2>
    <p>If you are unsatisfied with a resolution, please raise a support ticket through our platform. We commit to resolving all disputes within 7 business days.</p>
  </LegalPage>
);

export default CustomerRefund;
