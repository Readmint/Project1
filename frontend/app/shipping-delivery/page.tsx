import React from 'react';

export const metadata = {
    title: "Shipping & Delivery Policy - MindRadix",
    description: "MindRadix Shipping & Delivery Policy for digital services and physical products.",
};

export default function ShippingDeliveryPolicy() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 rounded-lg shadow-sm p-8 md:p-12">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">MindRadix – Shipping & Delivery Policy</h1>
                <p className="text-slate-500 dark:text-slate-400 mb-8 italic">Last Updated: 23‑12‑2025</p>

                <div className="space-y-8 text-slate-700 dark:text-slate-300">
                    <p>
                        This Shipping & Delivery Policy outlines the terms and conditions for the delivery of digital services and physical products (books/magazines) offered by Meadow Edutech Private Limited (“MindRadix”, “We”, “Us”).
                    </p>

                    <section>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">1. Delivery of Digital Content</h2>
                        <p className="mb-2">Since MindRadix is primarily a digital publication platform, many of our products are delivered electronically.</p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li><strong>E-Magazines & Articles:</strong> Access to digital magazines, journals, or articles is granted instantly upon successful payment. Users can access the content via their registered dashboard.</li>
                            <li><strong>Publication Services:</strong> Reports such as plagiarism checks, editorial reviews, or ISSN assignments are delivered to the user’s registered email address or dashboard within the timeline specified (usually 24-72 hours).</li>
                            <li><strong>Shipping Charges:</strong> There are no shipping or handling charges for any digital services.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">2. Shipping of Physical Products (Books & Printed Magazines)</h2>
                        <p className="mb-2">For users who order physical copies of books, journals, or magazines, the following terms apply:</p>

                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mt-4 mb-2">2.1. Processing Time</h3>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>All orders are processed within 2–3 working days (excluding Sundays and Public Holidays) after payment confirmation.</li>
                            <li>If we are experiencing a high volume of orders or a print-on-demand situation, shipments may be delayed by a few days. We will notify you via email or SMS in such cases.</li>
                        </ul>

                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mt-4 mb-2">2.2. Delivery Timelines</h3>
                        <ul className="list-disc pl-5 space-y-1">
                            <li><strong>Domestic (Within India):</strong> Standard delivery usually takes 5–10 working days depending on the location (Metros are faster, while North-East or rural areas may take longer).</li>
                            <li><strong>International Shipping:</strong> For orders outside India, delivery can take 15–25 working days depending on the country and local customs clearance.</li>
                        </ul>

                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mt-4 mb-2">2.3. Shipping Charges</h3>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Shipping charges are calculated based on the weight of the product and the delivery destination.</li>
                            <li>The total shipping cost will be displayed clearly at the Checkout Page before you make the payment.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">3. Tracking Your Order</h2>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Once your physical order is dispatched, you will receive a Shipping Confirmation Email/SMS containing your Tracking ID (AWB Number) and the link to the courier partner’s website.</li>
                            <li>It may take 24 hours for the tracking information to be updated on the courier’s system.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">4. Delivery Process & Terms</h2>
                        <ul className="list-disc pl-5 space-y-1">
                            <li><strong>Courier Partners:</strong> We use reputed third-party courier services (e.g., Delhivery, BlueDart, India Post) for deliveries.</li>
                            <li><strong>Delivery Attempts:</strong> The courier partner will usually attempt delivery three (3) times. If the receiver is unavailable or the premises are locked, the parcel may be returned to our warehouse (RTO - Return to Origin).</li>
                            <li><strong>Incorrect Address:</strong> MindRadix is not responsible for non-delivery if the address provided by the user is incorrect or incomplete.</li>
                            <li><strong>Re-Shipping Charges:</strong> If a parcel is returned to us due to an incorrect address or the user’s unavailability, the user will be required to pay additional shipping charges for re-sending the parcel.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">5. International Shipping (Customs & Duties)</h2>
                        <p>
                            For international orders, any Customs Duties, Import Taxes, or Handling Fees levied by the destination country are the sole responsibility of the customer/recipient. MindRadix has no control over these charges.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">6. Damage & Loss During Transit</h2>
                        <ul className="list-disc pl-5 space-y-1">
                            <li><strong>Damaged Goods:</strong> If you receive a parcel that is visibly damaged or tampered with, please do not accept the delivery and report it to us immediately.</li>
                            <li><strong>Mandatory Unboxing Video:</strong> As per our Refund Policy, an unboxing video is mandatory to claim any replacement for damaged or wrong products received.</li>
                            <li><strong>Lost Parcels:</strong> If a parcel is lost in transit (confirmed by our courier partner), MindRadix will send a fresh replacement at no extra cost.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">7. Contact Information</h2>
                        <p className="mb-2">For any questions regarding your shipment or delivery status, please contact us:</p>
                        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-md border border-slate-200 dark:border-slate-700">
                            <p><strong>Meadow Edutech Private Limited</strong></p>
                            <p><strong>Email:</strong> <a href="mailto:support@MindRadix.in" className="text-indigo-600 hover:underline">support@MindRadix.in</a></p>
                            <p><strong>Operating Hours:</strong> Mon-Sat (10:00 AM – 6:00 PM IST)</p>
                        </div>
                    </section>

                </div>
            </div>
        </div>
    );
}
