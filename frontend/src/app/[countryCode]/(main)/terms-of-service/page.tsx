import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Cartunez terms of service and conditions of use. Please read our terms carefully before using our website or purchasing products.",
}

export default function TermsOfServicePage() {
  return (
    <div className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        <h1 className="text-3xl sm:text-4xl font-display font-black uppercase text-gray-900 mb-8">
          Terms of Service
        </h1>
        <div className="prose prose-sm sm:prose max-w-none text-gray-600 space-y-6">
          <p className="text-sm text-gray-500">Last updated: July 2025</p>

          <h2 className="text-xl font-display font-bold text-gray-900 uppercase tracking-wide">1. Acceptance of Terms</h2>
          <p>
            By accessing or using the Cartunez website (cartunez.in) and purchasing our products, you agree to be bound by these Terms of Service. If you do not agree, please do not use our website or services.
          </p>

          <h2 className="text-xl font-display font-bold text-gray-900 uppercase tracking-wide">2. Definitions</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>&quot;Cartunez&quot;</strong>, <strong>&quot;we&quot;</strong>, <strong>&quot;us&quot;</strong>, <strong>&quot;our&quot;</strong> refers to Cartunez brand and its operators.</li>
            <li><strong>&quot;User&quot;</strong>, <strong>&quot;you&quot;</strong>, <strong>&quot;your&quot;</strong> refers to the individual or entity using our website or purchasing products.</li>
            <li><strong>&quot;Products&quot;</strong> refers to all automotive accessories, parts, and services offered on our website.</li>
          </ul>

          <h2 className="text-xl font-display font-bold text-gray-900 uppercase tracking-wide">3. Account Registration</h2>
          <p>
            You may need to create an account to access certain features. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account. You must provide accurate, current, and complete information.
          </p>

          <h2 className="text-xl font-display font-bold text-gray-900 uppercase tracking-wide">4. Product Information &amp; Pricing</h2>
          <p>
            We strive to display accurate product descriptions, images, and pricing. However, we do not guarantee that all information is error-free. We reserve the right to correct any errors, inaccuracies, or omissions and to change or update information at any time without prior notice.
          </p>

          <h2 className="text-xl font-display font-bold text-gray-900 uppercase tracking-wide">5. Orders &amp; Payment</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>All orders are subject to availability and acceptance.</li>
            <li>We reserve the right to refuse or cancel any order at our discretion.</li>
            <li>Prices are in Indian Rupees (INR) inclusive of applicable taxes unless stated otherwise.</li>
            <li>Payment must be received in full before order processing begins.</li>
            <li>We accept various payment methods as displayed at checkout.</li>
          </ul>

          <h2 className="text-xl font-display font-bold text-gray-900 uppercase tracking-wide">6. Shipping &amp; Delivery</h2>
          <p>
            Shipping times are estimates and not guaranteed. We are not liable for delays caused by courier partners, customs clearance, or force majeure events. Risk of loss passes to you upon delivery to the carrier.
          </p>

          <h2 className="text-xl font-display font-bold text-gray-900 uppercase tracking-wide">7. Returns &amp; Refunds</h2>
          <p>
            Our Return &amp; Exchange Policy is incorporated into these Terms by reference. Please refer to our <a href="/returns" className="text-brand hover:underline">Returns Policy</a> for detailed information.
          </p>

          <h2 className="text-xl font-display font-bold text-gray-900 uppercase tracking-wide">8. Intellectual Property</h2>
          <p>
            All content on cartunez.in — including text, graphics, logos, images, product designs, and software — is the property of Cartunez or its licensors and is protected by Indian and international intellectual property laws. Unauthorized use, reproduction, or distribution is strictly prohibited.
          </p>

          <h2 className="text-xl font-display font-bold text-gray-900 uppercase tracking-wide">9. Limitation of Liability</h2>
          <p>
            Cartunez shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of our website or products. Our total liability shall not exceed the amount paid by you for the product in question.
          </p>

          <h2 className="text-xl font-display font-bold text-gray-900 uppercase tracking-wide">10. Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts of Hyderabad, Telangana.
          </p>

          <h2 className="text-xl font-display font-bold text-gray-900 uppercase tracking-wide">11. Changes to Terms</h2>
          <p>
            We reserve the right to update these Terms at any time. Changes will be posted on this page with an updated revision date. Continued use of our website after changes constitutes acceptance of the new Terms.
          </p>

          <h2 className="text-xl font-display font-bold text-gray-900 uppercase tracking-wide">12. Contact</h2>
          <p>
            For questions about these Terms, please contact us at <strong>support@cartunez.in</strong>.
          </p>
        </div>
      </div>
    </div>
  )
}
