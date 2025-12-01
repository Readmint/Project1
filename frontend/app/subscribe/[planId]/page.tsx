'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  duration: string;
}

// API base URL - use environment variable or default
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function SubscribePage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '9999999999' // Default phone number for PayU
  });

  useEffect(() => {
    // Fetch all subscription plans from Express backend
    const fetchPlans = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/subscriptions/plans`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.status === 'success') {
          const fetchedPlans = data.data.plans.map((p: any) => ({
            ...p,
            price_monthly: Number(p.price_monthly) || 0,
            price_yearly: Number(p.price_yearly) || 0
          }));
          
          setPlans(fetchedPlans);
          
          // Find the selected plan
          const selectedPlan = fetchedPlans.find(
            (p: SubscriptionPlan) => p.id === params.planId
          );
          
          if (selectedPlan) {
            setPlan(selectedPlan);
          } else {
            // If plan not found, try to find by name
            const planByName = fetchedPlans.find(
              (p: SubscriptionPlan) => p.name.toLowerCase().includes((params.planId as string)?.toLowerCase() || '')
            );
            
            if (planByName) {
              setPlan(planByName);
            } else {
              toast.error('Plan not found');
              router.push('/');
            }
          }
        }
      } catch (error) {
        console.error('Error fetching plans:', error);
        toast.error('Failed to load subscription plans. Please try again later.');
        
        // Fallback to hardcoded plans if API fails
        const fallbackPlans = getFallbackPlans();
        setPlans(fallbackPlans);
        
        const selectedPlan = fallbackPlans.find(
          (p: SubscriptionPlan) => p.id === params.planId
        ) || fallbackPlans[0];
        
        setPlan(selectedPlan);
      }
    };

    fetchPlans();
  }, [params.planId, router]);

  const getFallbackPlans = (): SubscriptionPlan[] => {
    return [
      {
        id: 'free',
        name: 'Free Plan',
        description: 'Perfect for casual readers',
        price_monthly: 0,
        price_yearly: 0,
        features: [
          'Access to free issues',
          'Limited article views',
          'Basic bookmarking',
          'Community access'
        ],
        duration: 'monthly'
      },
      {
        id: 'basic',
        name: 'Basic Plan',
        description: 'For regular readers',
        price_monthly: 100,
        price_yearly: 1000,
        features: [
          'All Free features',
          '5 premium issues per month',
          'Unlimited bookmarks',
          'Download for offline reading',
          'Ad-free experience',
          'Email support'
        ],
        duration: 'monthly'
      },
      {
        id: 'premium',
        name: 'Premium Plan',
        description: 'For passionate readers',
        price_monthly: 200,
        price_yearly: 2000,
        features: [
          'All Basic features',
          'Unlimited premium issues',
          'Early access to new releases',
          'Exclusive author content',
          'Priority support',
          'Certificate of achievements',
          'Monthly webinars'
        ],
        duration: 'monthly'
      }
    ];
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePayment = async () => {
  if (!plan) return;

  // Validate form
  if (!formData.name || !formData.email) {
    toast.error('Please fill in your name and email');
    return;
  }

  setLoading(true);
  
  try {
    // Create PayU payment order - call Express backend
    const requestData = {
      planId: plan.id,
      amount: plan.price_monthly,
      userId: 'guest',
      userEmail: formData.email,
      userPhone: formData.phone || '9999999999',
      firstName: formData.name,
      lastName: ''
    };

    console.log('🔄 Creating PayU order with data:', requestData);

    const response = await fetch(`${API_BASE_URL}/api/subscriptions/payu/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData)
    });

    console.log('📥 Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ HTTP error:', errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('📦 Backend response:', data);

    if (data.status === 'success') {
      const paymentData = data.data;
      
      // DEBUG: Check if key and hash are present
      console.log('🔍 PayU Response Data:', paymentData);
      
      if (!paymentData.key) {
        console.error('❌ ERROR: Key is missing in payment data!');
        toast.error('Payment configuration error. Missing merchant key.');
        setLoading(false);
        return;
      }

      if (!paymentData.hash) {
        console.error('❌ ERROR: Hash is missing in payment data!');
        toast.error('Payment configuration error. Missing hash.');
        setLoading(false);
        return;
      }
      
      // Check if hash is JSON object or string
      let hashValue = paymentData.hash;
      try {
        // Try to parse hash as JSON
        const hashObj = JSON.parse(paymentData.hash);
        console.log('✅ Hash is JSON object:', hashObj);
        // Use v1 hash for form submission
        hashValue = hashObj.v1;
      } catch (e) {
        console.log('⚠️ Hash is not JSON, using as string:', paymentData.hash.substring(0, 30) + '...');
      }
      
      // PayU configuration
      const payuBaseUrl = process.env.NEXT_PUBLIC_PAYU_MODE === 'production' 
        ? 'https://secure.payu.in'
        : 'https://test.payu.in';
      
      console.log('🌐 PayU Base URL:', payuBaseUrl);
      
      // Create form and submit to PayU
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = `${payuBaseUrl}/_payment`;

      // REQUIRED: List of ALL mandatory PayU parameters
      const mandatoryParams = [
        'key', 'txnid', 'amount', 'productinfo', 'firstname', 'email', 
        'phone', 'surl', 'furl', 'hash', 'service_provider',
        'udf1', 'udf2', 'udf3', 'udf4', 'udf5'
      ];
      
      console.log('📋 Checking mandatory parameters:');
      
      // Add all payment parameters to form
      Object.keys(paymentData).forEach((key: string) => {
        let value = paymentData[key as keyof typeof paymentData];
        
        // Use v1 hash for the hash field
        if (key === 'hash' && typeof value === 'string') {
          try {
            const hashObj = JSON.parse(value);
            value = hashObj.v1;
          } catch (e) {
            // Already a string, use as is
          }
        }
        
        console.log(`  ${key}: ${value ? '✓ Present' : '✗ Missing'}`);
        
        if (value !== undefined && value !== null && value !== '') {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = String(value);
          form.appendChild(input);
        }
      });

      // Check if all mandatory parameters are present
      const missingParams = mandatoryParams.filter(param => {
        let value = paymentData[param];
        
        // Special handling for hash
        if (param === 'hash' && typeof value === 'string') {
          try {
            const hashObj = JSON.parse(value);
            value = hashObj.v1;
          } catch (e) {
            // Already a string
          }
        }
        
        return value === undefined || value === null || value === '';
      });
      
      if (missingParams.length > 0) {
        console.error('❌ Missing parameters:', missingParams);
        toast.error(`Missing payment parameters: ${missingParams.join(', ')}`);
        setLoading(false);
        return;
      }

      console.log('✅ All mandatory parameters present!');

      // Show form data before submitting
      console.log('📄 Form parameters to submit:');
      Array.from(form.elements).forEach((element: any) => {
        if (element.name) {
          console.log(`  ${element.name}: ${element.value}`);
        }
      });

      document.body.appendChild(form);
      
      console.log('🚀 Submitting to PayU...');
      form.submit();
      
      // Clean up after submission
      setTimeout(() => {
        if (form.parentNode) {
          document.body.removeChild(form);
        }
      }, 1000);
    } else {
      console.error('❌ Backend error:', data.message);
      toast.error(data.message || 'Failed to create payment order');
      setLoading(false);
    }
  } catch (error: any) {
    console.error('❌ Payment initialization error:', error);
    toast.error('Failed to initialize payment. Please try again.');
    setLoading(false);
  }
};

  const renderFeatures = (features: string[]) => {
    if (!features || !Array.isArray(features)) return null;
    
    return features.map((feature: string, index: number) => (
      <li key={index} className="flex items-start py-1">
        <span className="text-green-500 mr-2 mt-1">✓</span>
        <span>{feature}</span>
      </li>
    ));
  };

  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading plan details...</p>
        </div>
      </div>
    );
  }

  // Format price safely
  const formatPrice = (price: number) => {
    return typeof price === 'number' ? price.toFixed(2) : '0.00';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">Complete Your Subscription</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Plan Details Card */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-4">{plan.name}</h2>
            <p className="text-gray-600 mb-6">{plan.description}</p>
            
            <div className="mb-6">
              <div className="text-3xl font-bold text-indigo-600">
                ₹{formatPrice(plan.price_monthly)}
                <span className="text-lg font-normal text-gray-500">/month</span>
              </div>
              {plan.price_yearly > 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  Or ₹{formatPrice(plan.price_yearly)}/year (Save {Math.round((1 - (plan.price_yearly / (plan.price_monthly * 12))) * 100)}%)
                </p>
              )}
            </div>
            
            <div className="mb-8">
              <h3 className="font-semibold text-lg mb-3">Features:</h3>
              <ul className="space-y-1 text-gray-700">
                {renderFeatures(plan.features)}
              </ul>
            </div>
          </div>

          {/* Payment Card */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6">Payment Details</h2>
            
            {/* User Information Form */}
            <div className="mb-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter your full name"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter your email"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter your phone number"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Required by PayU for payment processing
                </p>
              </div>
            </div>

            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Plan:</span>
                <span className="font-semibold">{plan.name}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Billing Cycle:</span>
                <span className="font-semibold capitalize">{plan.duration}</span>
              </div>
              <div className="flex justify-between items-center text-lg font-bold pt-4 border-t">
                <span>Total Amount:</span>
                <span className="text-indigo-600">₹{formatPrice(plan.price_monthly)}</span>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-4">
                You will be redirected to PayU's secure payment gateway to complete your transaction.
              </p>
              <div className="text-xs text-gray-500 space-y-1">
                <p>• All payments are encrypted and secure</p>
                <p>• Test Mode: Use PayU sandbox credentials</p>
                <p>• Test Card: 5123 4567 8901 2346 | CVV: 123 | Expiry: Any future date</p>
                <p>• Your subscription starts immediately after payment</p>
              </div>
            </div>

            <Button
              onClick={handlePayment}
              disabled={loading || !formData.name || !formData.email || !formData.phone}
              className="w-full py-6 text-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></span>
                  Processing...
                </>
              ) : (
                `Pay ₹${formatPrice(plan.price_monthly)} Now`
              )}
            </Button>

            <div className="mt-6 text-center">
              <button
                onClick={() => router.back()}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                ← Back to plans
              </button>
            </div>
          </div>
        </div>

        {/* Other Plans */}
        {plans.length > 1 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6 text-center">Other Plans</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans
                .filter((p) => p.id !== plan.id)
                .map((otherPlan) => (
                  <div
                    key={otherPlan.id}
                    className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
                  >
                    <h3 className="font-bold text-lg mb-2">{otherPlan.name}</h3>
                    <p className="text-gray-600 text-sm mb-3">{otherPlan.description}</p>
                    <div className="text-xl font-bold text-indigo-600 mb-4">
                      ₹{formatPrice(otherPlan.price_monthly)}/month
                    </div>
                    <Button
                      onClick={() => router.push(`/subscribe/${otherPlan.id}`)}
                      variant="outline"
                      className="w-full"
                    >
                      View Details
                    </Button>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}