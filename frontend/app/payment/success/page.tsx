'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface PaymentDetails {
  txnid: string;
  amount: number;
  created_at: string;
  status: string;
}

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'pending'>('verifying');
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      const txnid = searchParams.get('txnid');
      const statusParam = searchParams.get('status');

      if (txnid) {
        try {
          // Check payment status from backend
          const response = await fetch(`/api/subscriptions/payment/status/${txnid}`);
          const data = await response.json();

          if (data.status === 'success') {
            setPaymentDetails(data.data);

            if (data.data.status === 'completed') {
              setStatus('success');
            } else {
              setStatus('pending');
            }
          } else {
            setStatus('error');
          }
        } catch (error) {
          console.error('Payment verification error:', error);
          setStatus('error');
        }
      } else if (statusParam === 'success') {
        // If we have status=success but no txnid, still show success
        setStatus('success');
      } else {
        setStatus('error');
      }
    };

    verifyPayment();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        {status === 'verifying' && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Verifying Payment</h2>
            <p className="text-gray-600">Please wait while we verify your payment...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-6">Your subscription has been activated successfully.</p>
            {paymentDetails && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Transaction ID:</span> {paymentDetails.txnid}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Amount:</span> ₹{paymentDetails.amount}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Date:</span> {new Date(paymentDetails.created_at).toLocaleString()}
                </p>
              </div>
            )}
            <div className="space-y-3">
              <Link href="/" className="block">
                <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
                  Go to Home
                </Button>
              </Link>
              <Link href="/issues" className="block">
                <Button variant="outline" className="w-full">
                  Browse Issues
                </Button>
              </Link>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Failed</h2>
            <p className="text-gray-600 mb-6">There was an issue with your payment. Please try again.</p>
            <div className="space-y-3">
              <Link href="/" className="block">
                <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
                  Back to Home
                </Button>
              </Link>
              <Link href="/contact" className="block">
                <Button variant="outline" className="w-full">
                  Contact Support
                </Button>
              </Link>
            </div>
          </>
        )}

        {status === 'pending' && (
          <>
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Processing</h2>
            <p className="text-gray-600 mb-6">Your payment is being processed. Please check back in a few minutes.</p>
            <Link href="/" className="block">
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
                Back to Home
              </Button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600"></div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}