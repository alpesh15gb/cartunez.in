import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Cartunez privacy policy explains how we collect, use, and protect your personal information when you use our website and services.",
}

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        <h1 className="text-3xl sm:text-4xl font-display font-black uppercase text-gray-900 mb-8">
          Privacy Policy
        </h1>
        <div className="prose prose-sm sm:prose max-w-none text-gray-600 space-y-6">
          <p className="text-sm text-gray-500">Last updated: July 2025</p>

          <h2 className="text-xl font-display font-bold text-gray-900 uppercase tracking-wide">1. Introduction</h2>
          <p>
            Cartunez (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information when you visit our website cartunez.in or purchase our products.
          </p>

          <h2 className="text-xl font-display font-bold text-gray-900 uppercase tracking-wide">2. Information We Collect</h2>
          <h3 className="text-base font-bold text-gray-900 mt-4">Personal Information</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>Name, email address, phone number</li>
            <li>Shipping and billing addresses</li>
            <li>Payment information (processed securely by our payment partners)</li>
            <li>Vehicle make, model, and year (for compatibility checks)</li>
          </ul>
          <h3 className="text-base font-bold text-gray-900 mt-4">Non-Personal Information</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>Browser type and version</li>
            <li>Device information (OS, screen resolution)</li>
            <li>IP address and location data</li>
            <li>Pages visited, time spent, and referral sources</li>
            <li>Cookies and similar tracking technologies</li>
          </ul>

          <h2 className="text-xl font-display font-bold text-gray-900 uppercase tracking-wide">3. How We Use Your Information</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Process and fulfill your orders</li>
            <li>Communicate with you about orders, products, and services</li>
            <li>Improve our website, products, and customer experience</li>
            <li>Send you marketing communications (with your consent)</li>
            <li>Detect and prevent fraud or unauthorized activity</li>
            <li>Comply with legal obligations</li>
          </ul>

          <h2 className="text-xl font-display font-bold text-gray-900 uppercase tracking-wide">4. Information Sharing</h2>
          <p>
            We do not sell your personal information. We may share your data with:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Trusted service providers (payment processors, shipping partners, analytics providers) who are contractually bound to protect your data</li>
            <li>Law enforcement or regulatory bodies when required by law</li>
            <li>Business partners in the event of a merger, acquisition, or sale of assets</li>
          </ul>

          <h2 className="text-xl font-display font-bold text-gray-900 uppercase tracking-wide">5. Data Security</h2>
          <p>
            We implement industry-standard security measures including SSL/TLS encryption, secure payment gateways, and regular security audits to protect your personal information. However, no method of transmission over the Internet is 100% secure.
          </p>

          <h2 className="text-xl font-display font-bold text-gray-900 uppercase tracking-wide">6. Cookies</h2>
          <p>
            Our website uses cookies and similar technologies to enhance your browsing experience, analyze site traffic, and serve targeted advertisements. You can control cookie preferences through your browser settings. Essential cookies are necessary for the website to function.
          </p>

          <h2 className="text-xl font-display font-bold text-gray-900 uppercase tracking-wide">7. Your Rights</h2>
          <p>You have the right to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Access the personal data we hold about you</li>
            <li>Request correction or deletion of your data</li>
            <li>Withdraw consent for marketing communications</li>
            <li>Request a copy of your data in a portable format</li>
            <li>Lodge a complaint with the relevant data protection authority</li>
          </ul>
          <p>To exercise these rights, contact us at <strong>support@cartunez.in</strong>.</p>

          <h2 className="text-xl font-display font-bold text-gray-900 uppercase tracking-wide">8. Third-Party Links</h2>
          <p>
            Our website may contain links to third-party websites. We are not responsible for the privacy practices or content of these external sites. We encourage you to review their privacy policies before providing any personal information.
          </p>

          <h2 className="text-xl font-display font-bold text-gray-900 uppercase tracking-wide">9. Children&apos;s Privacy</h2>
          <p>
            Our services are not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If we become aware of such collection, we will take steps to delete the information promptly.
          </p>

          <h2 className="text-xl font-display font-bold text-gray-900 uppercase tracking-wide">10. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated effective date. We encourage you to review this policy periodically.
          </p>

          <h2 className="text-xl font-display font-bold text-gray-900 uppercase tracking-wide">11. Contact Us</h2>
          <p>
            If you have any questions, concerns, or requests regarding this Privacy Policy, please contact us:
          </p>
          <p>
            Email: <strong>support@cartunez.in</strong><br />
            Address: Cartunez, Hyderabad, India
          </p>
        </div>
      </div>
    </div>
  )
}
