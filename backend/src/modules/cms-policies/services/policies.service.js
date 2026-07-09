const prisma = require('../../../utils/prisma');

class PoliciesService {
  async getSettings() {
    let settings = await prisma.policySettings.findFirst();
    if (!settings) {
      settings = await prisma.policySettings.create({
        data: {
          shippingCharges: 99.00,
          freeShippingLimit: 999.00,
          returnDays: 7,
          exchangeDays: 7,
          refundDays: 7,
          businessHours: '9 AM - 6 PM, Mon-Sat',
          supportEmail: 'support@vsboutique.shop',
          supportPhone: '+91 90001 00020',
          whatsApp: '+91 90001 00020',
          companyAddress: 'Hyderabad, Telangana, India'
        }
      });
    }
    return settings;
  }

  async updateSettings(data) {
    const settings = await this.getSettings();
    return prisma.policySettings.update({
      where: { id: settings.id },
      data: {
        shippingCharges: data.shippingCharges !== undefined ? data.shippingCharges : settings.shippingCharges,
        freeShippingLimit: data.freeShippingLimit !== undefined ? data.freeShippingLimit : settings.freeShippingLimit,
        returnDays: data.returnDays !== undefined ? parseInt(data.returnDays, 10) : settings.returnDays,
        exchangeDays: data.exchangeDays !== undefined ? parseInt(data.exchangeDays, 10) : settings.exchangeDays,
        refundDays: data.refundDays !== undefined ? parseInt(data.refundDays, 10) : settings.refundDays,
        businessHours: data.businessHours !== undefined ? data.businessHours : settings.businessHours,
        supportEmail: data.supportEmail !== undefined ? data.supportEmail : settings.supportEmail,
        supportPhone: data.supportPhone !== undefined ? data.supportPhone : settings.supportPhone,
        whatsApp: data.whatsApp !== undefined ? data.whatsApp : settings.whatsApp,
        companyAddress: data.companyAddress !== undefined ? data.companyAddress : settings.companyAddress
      }
    });
  }

  async getPolicy(key) {
    let policy = await prisma.cmsPolicy.findUnique({ where: { key } });
    if (!policy) {
      // Create default policy content
      const defaults = {
        shipping: {
          title: 'Shipping Policy',
          content: `
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
          `.trim()
        },
        returns: {
          title: 'Returns & Exchange Policy',
          content: `
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
          `.trim()
        },
        terms: {
          title: 'Terms & Conditions',
          content: `
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
          `.trim()
        },
        privacy: {
          title: 'Privacy Policy',
          content: `
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
          `.trim()
        },
        payment: {
          title: 'Payment & Security Policy',
          content: `
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
          `.trim()
        }
      };

      const def = defaults[key] || { title: `${key.toUpperCase()} Policy`, content: `<p>Default policy content for ${key}.</p>` };
      policy = await prisma.cmsPolicy.create({
        data: {
          key,
          title: def.title,
          content: def.content,
          draftContent: def.content,
          status: 'PUBLISHED',
          version: 1,
          history: []
        }
      });
    }
    return policy;
  }

  async updatePolicy(key, { title, content, draftContent, status }) {
    const policy = await this.getPolicy(key);
    const history = Array.isArray(policy.history) ? policy.history : [];
    
    let nextVersion = policy.version;
    let newHistory = [...history];

    if (status === 'PUBLISHED' && content && content !== policy.content) {
      newHistory.push({
        version: policy.version,
        title: policy.title,
        content: policy.content,
        updatedAt: policy.updatedAt.toISOString()
      });
      nextVersion += 1;
    }

    return prisma.cmsPolicy.update({
      where: { key },
      data: {
        title: title !== undefined ? title : policy.title,
        content: status === 'PUBLISHED' && content !== undefined ? content : policy.content,
        draftContent: draftContent !== undefined ? draftContent : policy.draftContent,
        status: status !== undefined ? status : policy.status,
        version: nextVersion,
        history: newHistory
      }
    });
  }

  async getHistory(key) {
    const policy = await this.getPolicy(key);
    return policy.history || [];
  }
}

module.exports = new PoliciesService();
