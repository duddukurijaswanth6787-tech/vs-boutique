import LegalPage from '@core/components/shared/LegalPage';

const CustomerTerms = () => (
  <LegalPage title="Terms &amp; Conditions" lastUpdated="June 24, 2026">
    <h2>1. Acceptance of Terms</h2>
    <p>By accessing or using VS Boutique (vsboutique.shop), you agree to be bound by these Terms and Conditions. If you do not agree, please do not use our services.</p>

    <h2>2. Services Description</h2>
    <p>VS Boutique is a platform connecting customers with premium tailoring boutiques. We facilitate order placement, measurement submission, design selection, appointment booking, and secure payment processing.</p>

    <h2>3. User Accounts</h2>
    <ul>
      <li>You must provide accurate and complete information when creating an account.</li>
      <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
      <li>You must be at least 18 years old to use our services.</li>
      <li>We reserve the right to suspend or terminate accounts that violate our terms.</li>
    </ul>

    <h2>4. Orders &amp; Payments</h2>
    <ul>
      <li>All orders are processed through our secure checkout system.</li>
      <li>Prices are quoted in Indian Rupees (INR) and inclusive of applicable taxes.</li>
      <li>Advance payment is required to confirm orders. Final pricing may be confirmed by the boutique.</li>
      <li>Payments are processed securely through Razorpay.</li>
    </ul>

    <h2>5. Cancellations &amp; Refunds</h2>
    <p>Orders can be cancelled before the boutique starts processing. Refund eligibility depends on the stage of order processing. Please refer to our Refund Policy for detailed information.</p>

    <h2>6. Intellectual Property</h2>
    <p>All designs, images, and content on this platform are the property of VS Boutique or its partner boutiques. Unauthorized reproduction or distribution is prohibited.</p>

    <h2>7. Limitation of Liability</h2>
    <p>VS Boutique acts as an intermediary platform. We are not liable for the quality of tailoring services provided by partner boutiques. Any disputes regarding work quality will be mediated through our support system.</p>

    <h2>8. Contact</h2>
    <p>For questions about these terms, contact us at support@vsboutique.shop.</p>
  </LegalPage>
);

export default CustomerTerms;
