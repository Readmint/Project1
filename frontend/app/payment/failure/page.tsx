'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function PaymentFailurePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Failed</h2>
        <p className="text-gray-600 mb-6">
          We couldn't process your payment. This could be due to insufficient funds,
          incorrect card details, or a temporary issue with the payment gateway.
        </p>
        <div className="space-y-3">
          <Link href="/" className="block">
            <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
              Try Again
            </Button>
          </Link>
          <Link href="/contact" className="block">
            <Button variant="outline" className="w-full">
              Contact Support
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}