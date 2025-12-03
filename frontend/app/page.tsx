'use client';

import HeroCarousel from "@/components/home/HeroCarousel";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import AuthorSection from "@/components/home/AuthorSection";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

interface FeaturedArticle {
  id: number;
  title: string;
  author: string;
  category: string;
  excerpt: string;
  image: string;
  date: string;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  duration: string;
}

export default function HomePage() {
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const router = useRouter();

  const featuredArticles: FeaturedArticle[] = [
    {
      id: 1,
      title: "The Future of Web Design",
      author: "Sarah Chen",
      category: "Design",
      excerpt:
        "Exploring emerging trends in web design and how they shape the digital landscape.",
      image: "/images/article1.jpg",
      date: "Mar 15, 2024",
    },
    {
      id: 2,
      title: "Building Scalable Applications",
      author: "James Wilson",
      category: "Technology",
      excerpt: "Best practices for designing systems that grow with your needs.",
      image: "/images/article2.jpg",
      date: "Mar 12, 2024",
    },
    {
      id: 3,
      title: "Creative Direction in 2024",
      author: "Emma Rodriguez",
      category: "Creative",
      excerpt:
        "How modern brands are redefining creativity and visual storytelling.",
      image: "/images/article3.jpg",
      date: "Mar 10, 2024",
    },
  ];

  // Fetch subscription plans from backend
  useEffect(() => {
    fetchSubscriptionPlans();
  }, []);

  const fetchSubscriptionPlans = async (): Promise<void> => {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/subscriptions/plans`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.status === 'success') {
        // Ensure all prices are numbers
        const formattedPlans = data.data.plans.map((plan: any) => ({
          ...plan,
          price_monthly: Number(plan.price_monthly) || 0,
          price_yearly: Number(plan.price_yearly) || 0,
          features: Array.isArray(plan.features) ? plan.features : []
        }));
        setSubscriptionPlans(formattedPlans);
      } else {
        setSubscriptionPlans(getDefaultPlans());
      }
    } catch (error) {
      console.error('Failed to fetch subscription plans:', error);
      setSubscriptionPlans(getDefaultPlans());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultPlans = (): SubscriptionPlan[] => {
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

  // Helper function to safely format prices
  const formatPrice = (price: number | string | undefined): string => {
    if (price === undefined || price === null) return '0.00';
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return isNaN(numPrice) ? '0.00' : numPrice.toFixed(2);
  };

  const handlePlanSelection = async (plan: SubscriptionPlan) => {
    setIsProcessing(plan.id);
    
    try {
      if (plan.price_monthly === 0) {
        // Free plan - redirect to signup
        router.push(`/signup?plan=free`);
      } else {
        // Paid plan - redirect to subscribe page
        router.push(`/subscribe/${plan.id}`);
      }
    } catch (error) {
      console.error('Plan selection error:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsProcessing(null);
    }
  };

  const renderFeatures = (features: string[] | undefined) => {
    if (!features || !Array.isArray(features)) return null;
    
    return features.map((feature: string, index: number) => (
      <li key={index} className="flex items-start">
        <span className="text-green-500 mr-2 mt-1">✓</span>
        <span>{feature}</span>
      </li>
    ));
  };

  const calculateSavings = (plan: SubscriptionPlan): number => {
    const monthlyPrice = typeof plan.price_monthly === 'string' ? parseFloat(plan.price_monthly) : plan.price_monthly;
    const yearlyPrice = typeof plan.price_yearly === 'string' ? parseFloat(plan.price_yearly) : plan.price_yearly;
    
    if (!monthlyPrice || !yearlyPrice || monthlyPrice === 0 || yearlyPrice === 0) return 0;
    
    const monthlyTotal = monthlyPrice * 12;
    if (monthlyTotal === 0) return 0;
    
    const savings = ((monthlyTotal - yearlyPrice) / monthlyTotal) * 100;
    return Math.round(savings);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 overflow-y-auto">
      
      {/* HERO CAROUSEL */}
      <HeroCarousel />

      {/* FEATURED ISSUES */}
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-gray-50 dark:bg-slate-800">
        <div className="mb-12 text-center">
          <h4 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Featured Issues
          </h4>
          <p className="text-slate-600 dark:text-slate-300 text-lg">
            Explore our latest and most popular magazine issues
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredArticles.map((article) => (
            <Link key={article.id} href={`/issues/${article.id}`}>
              <article className="rounded-xl overflow-hidden hover:shadow-lg dark:hover:shadow-indigo-900/20 transition-shadow duration-300 flex flex-col h-full bg-slate-50 dark:bg-slate-800 cursor-pointer">
                <Image
                  src={article.image}
                  width={600}
                  height={400}
                  alt={article.title}
                  className="w-full h-48 object-cover"
                />

                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/40 px-3 py-1 rounded-full">
                      {article.category}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {article.date}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                    {article.title}
                  </h3>

                  <p className="text-slate-600 dark:text-slate-300 text-sm mb-4 flex-grow">
                    {article.excerpt}
                  </p>

                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    By {article.author}
                  </p>
                </div>
              </article>
            </Link>
          ))}
        </div>

        {/* View All Issues Button */}
        <div className="mt-12 text-center">
          <Link href="/issues">
            <Button
              size="lg"
              className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-800 text-white font-semibold px-8"
            >
              View All Issues
            </Button>
          </Link>
        </div>
      </div>

      {/* MEMBERSHIP PLANS */}
      <div className="text-indigo-600 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Choose Your Plan
          </h2>
          <h3 className="text-2xl sm:text-3xl font-semibold mb-2">
            Membership Plans
          </h3>
          <p className="text-slate-600 dark:text-slate-300 text-lg">
            Choose the plan that best suits your reading needs
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {subscriptionPlans.map((plan, index) => (
              <div
                key={plan.id}
                className={`
                  bg-white dark:bg-slate-800 text-slate-900 dark:text-white 
                  rounded-2xl shadow-lg p-8 flex flex-col
                  border-2 border-transparent
                  hover:border-indigo-500 hover:shadow-xl
                  transition-all duration-300 hover:scale-[1.02]
                  ${index === subscriptionPlans.length - 1 ? 'relative' : ''}
                `}
              >
                {/* Popular badge for premium plan */}
                {index === subscriptionPlans.length - 1 && plan.price_monthly > 0 && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                      MOST POPULAR
                    </span>
                  </div>
                )}

                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <p className="text-xl font-semibold">
                    ₹{formatPrice(plan.price_monthly)}/month
                  </p>
                  {plan.price_yearly > 0 && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      ₹{formatPrice(plan.price_yearly)}/year (Save {calculateSavings(plan)}%)
                    </p>
                  )}
                </div>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  {plan.description}
                </p>
                <ul className="space-y-2 flex-grow text-slate-700 dark:text-slate-400 mb-6">
                  {renderFeatures(plan.features)}
                </ul>
                <Button
                  onClick={() => handlePlanSelection(plan)}
                  disabled={!!isProcessing}
                  className={`
                    mt-6 ${isProcessing ? 'opacity-70 cursor-not-allowed' : ''}
                    ${plan.price_monthly === 0 
                      ? 'bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800'
                      : 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-800'
                    } text-white
                  `}
                >
                  {isProcessing === plan.id ? (
                    <>
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                      Processing...
                    </>
                  ) : plan.price_monthly === 0 ? (
                    'Get Free Plan'
                  ) : (
                    `Subscribe Now - ₹${formatPrice(plan.price_monthly)}/month`
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Payment Info */}
        <div className="mt-12 text-center">
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            <span className="font-semibold">Note:</span> Secure payments via PayU. 7-day free trial available.
          </p>
        </div>
      </div>

      <AuthorSection />

      {/* FINAL CTA SECTION */}
      <section className="bg-indigo-600 text-white py-20 mt-20">
        <div className="max-w-5xl mx-auto px-4 text-center">

          <h2 className="text-4xl font-bold mb-4">Ready to Start Reading?</h2>
          <p className="text-lg opacity-90 mb-8">
            Join thousands of readers and get access to premium content today
          </p>

          <div className="flex justify-center gap-6">

            <Button 
              className="bg-white text-indigo-600 hover:bg-slate-100"
              onClick={() => router.push('/signup')}
            >
              Get Started for Free
            </Button>

            <Button 
              className="bg-white text-indigo-600 hover:bg-slate-100"
              onClick={() => router.push('/issues')}
            >
              Browse Issues
            </Button>

          </div>

          <div className="mt-8 text-sm opacity-80">
            <p>No credit card required for free plan • Cancel anytime • No hidden fees</p>
          </div>

        </div>
      </section>

    </div>
  );
}