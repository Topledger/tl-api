'use client';

import { useState } from 'react';
import { CheckIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import MainLayout from '@/components/Layout/MainLayout';
import Button from '@/components/UI/Button';
import { useAppStore } from '@/lib/store';

const plans = [
  {
    name: 'Basic',
    price: 0,
    credits: 5000,
    description: 'Ideal for testing',
    features: [
      '5,000 Credits',
      '10 Requests/sec',
      '1 API key',
      'Ideal for testing'
    ],
    popular: false,
    current: true
  },
  {
    name: 'Developers',
    price: 49,
    credits: 10000,
    description: 'Ideal for small projects',
    features: [
      '10,000 Credits',
      '10 Requests/sec',
      '1 API key',
      'Ideal for testing'
    ],
    popular: true,
    current: false
  },
  {
    name: 'Business',
    price: 499,
    credits: 20000,
    description: 'Ideal for mid-size projects',
    features: [
      '20,000 Credits',
      '10 Requests/sec',
      '1 API key',
      'Ideal for testing'
    ],
    popular: false,
    current: false
  },
  {
    name: 'Enterprise',
    price: null,
    credits: null,
    description: 'Ideal for large scale operations',
    features: [
      'Unlimited Credits',
      'Unlimited Requests/sec',
      'Unlimited API keys',
      'Priority Support',
      'Custom Solutions'
    ],
    popular: false,
    current: false,
    isEnterprise: true
  }
];

export default function PlansPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useAppStore();

  const handleUpgrade = async (planName: string, price: number) => {
    setIsProcessing(true);
    try {
      // Here you would integrate with your crypto payment processor
      console.log(`Upgrading to ${planName} plan for $${price}`);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Show success message or redirect
      alert(`Successfully upgraded to ${planName} plan!`);
    } catch (error) {
      console.error('Payment failed:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleScheduleCall = () => {
    // Implement scheduling functionality
    window.open('https://calendly.com/your-calendar', '_blank');
  };

  return (
    <MainLayout title="Pricing">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-lg text-gray-600">
            Scale your API usage with our flexible pricing plans
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative bg-white rounded-lg shadow-sm border-2 p-6 ${
                plan.popular
                  ? 'border-blue-500 ring-1 ring-blue-500'
                  : 'border-gray-200'
              } ${plan.current ? 'bg-gray-50' : ''}`}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Current plan badge */}
              {plan.current && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-green-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                    Current Plan
                  </span>
                </div>
              )}

              <div className="h-full flex flex-col">
                {/* Plan header */}
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {plan.description}
                  </p>
                  
                  {/* Price */}
                  <div className="mb-4">
                    {plan.price === null ? (
                      <div className="text-2xl font-bold text-gray-900">
                        Custom
                      </div>
                    ) : plan.price === 0 ? (
                      <div className="text-2xl font-bold text-gray-900">
                        $0<span className="text-sm font-normal text-gray-600">/mo</span>
                      </div>
                    ) : (
                      <div className="text-2xl font-bold text-gray-900">
                        ${plan.price}<span className="text-sm font-normal text-gray-600">/mo</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Features */}
                <div className="flex-1 mb-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <CheckIcon className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action button */}
                <div className="mt-auto">
                  {plan.current ? (
                    <div className="w-full bg-gray-100 text-gray-500 text-center py-2 px-4 rounded-md text-sm font-medium">
                      Current Plan
                    </div>
                  ) : plan.isEnterprise ? (
                    <Button
                      onClick={handleScheduleCall}
                      className="w-full"
                      variant="outline"
                    >
                      Schedule a call
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleUpgrade(plan.name, plan.price!)}
                      disabled={isProcessing}
                      className="w-full"
                    >
                      {isProcessing ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Processing...
                        </div>
                      ) : (
                        'Upgrade with Crypto'
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Features comparison */}
        <div className="mt-16 bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Compare Plans
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-4 px-4 font-medium text-gray-900">
                    Features
                  </th>
                  {plans.map((plan) => (
                    <th key={plan.name} className="text-center py-4 px-4 font-medium text-gray-900">
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="py-4 px-4 text-gray-700">Monthly Credits</td>
                  {plans.map((plan) => (
                    <td key={plan.name} className="py-4 px-4 text-center">
                      {plan.credits ? plan.credits.toLocaleString() : 'Unlimited'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-4 px-4 text-gray-700">Requests per second</td>
                  {plans.map((plan) => (
                    <td key={plan.name} className="py-4 px-4 text-center">
                      {plan.isEnterprise ? 'Unlimited' : '10'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-4 px-4 text-gray-700">API Keys</td>
                  {plans.map((plan) => (
                    <td key={plan.name} className="py-4 px-4 text-center">
                      {plan.isEnterprise ? 'Unlimited' : '1'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-4 px-4 text-gray-700">Priority Support</td>
                  {plans.map((plan) => (
                    <td key={plan.name} className="py-4 px-4 text-center">
                      {plan.isEnterprise ? (
                        <CheckIcon className="h-5 w-5 text-green-500 mx-auto" />
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-4 px-4 text-gray-700">Custom Solutions</td>
                  {plans.map((plan) => (
                    <td key={plan.name} className="py-4 px-4 text-center">
                      {plan.isEnterprise ? (
                        <CheckIcon className="h-5 w-5 text-green-500 mx-auto" />
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 bg-gray-50 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Frequently Asked Questions
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                What happens if I exceed my credit limit?
              </h3>
              <p className="text-gray-600 text-sm">
                Your API requests will be temporarily paused until the next billing cycle or until you upgrade your plan.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Can I change my plan anytime?
              </h3>
              <p className="text-gray-600 text-sm">
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                What cryptocurrencies do you accept?
              </h3>
              <p className="text-gray-600 text-sm">
                We accept Bitcoin, Ethereum, USDC, and other major cryptocurrencies through our secure payment processor.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Is there a free trial available?
              </h3>
              <p className="text-gray-600 text-sm">
                Yes! Our Basic plan includes 5,000 free credits every month, perfect for testing and small projects.
              </p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
