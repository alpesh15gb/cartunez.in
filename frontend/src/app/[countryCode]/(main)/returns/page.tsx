import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Returns & Exchange Policy",
  description: "Cartunez return and exchange policy. 7-day easy returns, warranty information, and refund process for car accessories.",
}

export default function ReturnsPage() {
  return (
    <div className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        <h1 className="text-3xl sm:text-4xl font-display font-black uppercase text-gray-900 mb-8">
          Returns &amp; Exchange Policy
        </h1>
        <div className="prose prose-sm sm:prose max-w-none text-gray-600 space-y-6">
          <h2 className="text-xl font-display font-bold text-gray-900 uppercase tracking-wide">1. Overview</h2>
          <p>
            At Cartunez, customer satisfaction is our top priority. Our Return &amp; Exchange Policy is designed to be transparent and customer-friendly. Please read this policy carefully before making a purchase.
          </p>

          <h2 className="text-xl font-display font-bold text-gray-900 uppercase tracking-wide">2. Return Window</h2>
          <p>
            You may return most products within <strong>7 days</strong> of delivery for a full refund or exchange, provided the item is unused, uninstalled, and in its original packaging with all accessories and documentation.
          </p>

          <h2 className="text-xl font-display font-bold text-gray-900 uppercase tracking-wide">3. Eligibility Criteria</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Product must be in original condition — unused, uninstalled, and undamaged.</li>
            <li>All original packaging, manuals, cables, and accessories must be intact.</li>
            <li>Custom or made-to-order items (e.g., custom-fit floor mats, custom steering wheels) are non-returnable unless defective.</li>
            <li>Electronics (Android stereos, LED lights, etc.) must not have been installed or modified.</li>
            <li>Software products, gift cards, and promotional items are non-returnable.</li>
          </ul>

          <h2 className="text-xl font-display font-bold text-gray-900 uppercase tracking-wide">4. How to Initiate a Return</h2>
          <ol className="list-decimal pl-6 space-y-2">
            <li>Email us at <strong>support@cartunez.in</strong> within 7 days of delivery with your order number and reason for return.</li>
            <li>Our team will review your request and provide a Return Merchandise Authorization (RMA) number within 24-48 hours.</li>
            <li>Pack the item securely in its original packaging, including all accessories.</li>
            <li>Ship the item to the address provided in the RMA email. You are responsible for return shipping costs unless the item is defective or incorrect.</li>
          </ol>

          <h2 className="text-xl font-display font-bold text-gray-900 uppercase tracking-wide">5. Refund Processing</h2>
          <p>
            Once we receive and inspect the returned item, we will process your refund within <strong>5-7 business days</strong>. Refunds are credited to the original payment method. For COD orders, we will request your bank details for a bank transfer.
          </p>

          <h2 className="text-xl font-display font-bold text-gray-900 uppercase tracking-wide">6. Exchanges</h2>
          <p>
            If you received a defective, damaged, or incorrect item, we will arrange a free replacement. Please contact us at <strong>support@cartunez.in</strong> with photographic evidence for a quick resolution.
          </p>

          <h2 className="text-xl font-display font-bold text-gray-900 uppercase tracking-wide">7. Warranty</h2>
          <p>
            All products sold by Cartunez come with a manufacturer&apos;s warranty against manufacturing defects. Warranty periods vary by product category (typically 6 months to 2 years). For warranty claims, please contact our support team with your order details.
          </p>

          <h2 className="text-xl font-display font-bold text-gray-900 uppercase tracking-wide">8. Cancellation Policy</h2>
          <p>
            Orders can be cancelled within <strong>24 hours</strong> of placement at no charge. After 24 hours, if the order has been processed or shipped, cancellation may not be possible. Please contact us immediately at <strong>support@cartunez.in</strong> for cancellation requests.
          </p>

          <h2 className="text-xl font-display font-bold text-gray-900 uppercase tracking-wide">9. Contact Us</h2>
          <p>
            For any questions regarding this policy, please reach out to us:
          </p>
          <p>
            Email: <strong>support@cartunez.in</strong><br />
            Phone: <strong>+91-XXXXXXXXXX</strong><br />
            Address: Cartunez, Hyderabad, India
          </p>
        </div>
      </div>
    </div>
  )
}
