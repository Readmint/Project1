import Image from "next/image";
import { Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 py-16 mt-20 border-t border-slate-200 dark:border-slate-700">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">

        {/* Column 1 */}
        <div>
          <Image
            src="/icons/mindradix_logo.jpg"
            alt="MindRadix Logo"
            width={48}
            height={48}
            className="mb-4 rounded-lg"
          />

          <h3 className="text-xl font-semibold mb-2">MindRadix</h3>
          <p>Your premier platform for digital publishing and content discovery.</p>
        </div>

        {/* Column 2 */}
        <div>
          <h4 className="text-lg font-semibold mb-4">Quick Links</h4>

          <ul className="space-y-2">
            <li><a href="/about" className="hover:text-indigo-600">About Us</a></li>
            <li><a href="/issues" className="hover:text-indigo-600">Browse Issues</a></li>
            <li><a href="/submit" className="hover:text-indigo-600">Submit Article</a></li>
            <li><a href="/pricing" className="hover:text-indigo-600">Pricing</a></li>
          </ul>
        </div>

        {/* Column 3 */}
        <div>
          <h4 className="text-lg font-semibold mb-4">Resources</h4>

          <ul className="space-y-2">

            <li><a href="/grievance-redressal" className="hover:text-indigo-600">Grievance Redressal Policy</a></li>
            <li><a href="/plagiarism-ethics" className="hover:text-indigo-600">Plagiarism & Ethics Policy</a></li>
            <li><a href="/intellectual-property" className="hover:text-indigo-600">Intellectual Property Policy</a></li>
            <li><a href="/privacy" className="hover:text-indigo-600">Privacy Policy</a></li>
            <li><a href="/refund-policy" className="hover:text-indigo-600">Refund Policy</a></li>
            <li><a href="/shipping-delivery" className="hover:text-indigo-600">Shipping & Delivery Policy</a></li>
            <li><a href="/terms" className="hover:text-indigo-600">Terms of Service</a></li>
          </ul>
        </div>

        {/* Column 4 */}
        <div>
          <h4 className="text-lg font-semibold mb-4">Contact</h4>

          <ul className="space-y-3">

            <li className="flex items-center gap-3">
              <Mail className="w-5 h-5" />
              support@MindRadix.in
            </li>

            <li className="flex items-center gap-3">
              <Phone className="w-5 h-5" />
              +91 98765 43210
            </li>

            <li className="flex items-center gap-3">
              <MapPin className="w-5 h-5" />
              Rajasthan, India
            </li>

          </ul>
        </div>

      </div>

      {/* Bottom Line */}
      <div className="text-center text-sm mt-12 text-slate-500 dark:text-slate-400">
        © 2025 MindRadix. All rights reserved.
      </div>
    </footer>
  );
}
