import LegalPage from '@core/components/shared/LegalPage';

const CustomerPrivacy = () => (
  <LegalPage title="Privacy Policy" lastUpdated="June 24, 2026">
    <h2>1. Information We Collect</h2>
    <p>We collect information you provide directly: name, phone number, email address, shipping address, and measurement details required for tailoring services.</p>
    <p>We automatically collect certain information when you use our platform: device information, IP address, browsing behavior, and transaction history.</p>

    <h2>2. How We Use Your Information</h2>
    <ul>
      <li>To process and fulfill your orders, including tailoring and delivery services.</li>
      <li>To communicate with you about orders, appointments, and customer support.</li>
      <li>To improve our services, personalize your experience, and send relevant recommendations.</li>
      <li>To process payments securely through Razorpay.</li>
    </ul>

    <h2>3. Data Security</h2>
    <p>We implement industry-standard security measures including SSL encryption, secure token-based authentication, and encrypted payment processing. Your payment details are handled directly by Razorpay and never stored on our servers.</p>

    <h2>4. Data Sharing</h2>
    <p>We share your information only with: the boutique fulfilling your order, Razorpay for payment processing, and delivery partners for shipping. We never sell your personal data to third parties.</p>

    <h2>5. Your Rights</h2>
    <p>You have the right to access, correct, or delete your personal data at any time through your profile settings. You can opt out of marketing communications at any time.</p>

    <h2>6. Contact Us</h2>
    <p>For privacy-related inquiries, please contact us at support@vsboutique.shop or through our Contact page.</p>
  </LegalPage>
);

export default CustomerPrivacy;
