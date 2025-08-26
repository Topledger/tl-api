'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import MainLayout from '@/components/Layout/MainLayout';
import Button from '@/components/UI/Button';
import { useAppStore } from '@/lib/store';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function UsagePage() {
  const [isLoading, setIsLoading] = useState(true);
  const { user, usageData, billingHistory, setUser, setUsageData, setBillingHistory } = useAppStore();

  useEffect(() => {
    loadUsageData();
  }, []);

  const loadUsageData = async () => {
    try {
      const response = await fetch('/api/usage');
      if (!response.ok) {
        throw new Error(`Usage API failed: ${response.status}`);
      }
      const data = await response.json();
      // Map the new data structure to the expected format
      const mappedUser: any = {
        id: 'user_lokesh_tiwari',
        email: 'lokesh.tiwari@gmail.com',
        plan: 'Basic',
        credits: {
          used: data.totalUsage,
          remaining: data.remainingCredits,
          total: data.totalUsage + data.remainingCredits
        },
        billingCycle: {
          start: '2024-12-01',
          end: '2024-12-31'
        }
      };
      setUser(mappedUser);
      setUsageData(data.dailyUsage || []);
      
      // Load billing data separately
      const billingResponse = await fetch('/api/billing');
      if (billingResponse.ok) {
        const billingData = await billingResponse.json();
        setBillingHistory(billingData.billingHistory || []);
      }
    } catch (error) {
      console.error('Error loading usage data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadInvoice = (invoiceUrl: string) => {
    // Simulate invoice download
    console.log('Downloading invoice:', invoiceUrl);
    window.open(invoiceUrl, '_blank');
  };

  if (isLoading) {
    return (
      <MainLayout title="Usage & Billing History">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading usage data...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Usage and Billing History">
      <div className="space-y-6">
        {/* Credits Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">{user?.credits.used.toLocaleString()}</h3>
            <p className="text-sm text-gray-500">Credits Used</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">{user?.credits.remaining.toLocaleString()}</h3>
            <p className="text-sm text-gray-500">Remaining Credits</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {user?.billingCycle.start} → {user?.billingCycle.end}
            </h3>
            <p className="text-sm text-gray-500">Billing Cycle</p>
          </div>
        </div>

        {/* Usage Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">Usage Chart</h3>
            <select className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
              <option>All APIs</option>
              <option>Authentication API</option>
              <option>Payment API</option>
              <option>User API</option>
            </select>
          </div>
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={usageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getMonth() + 1}/${date.getDate()}`;
                  }}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => formatDate(value)}
                  formatter={(value: number) => [value.toLocaleString(), 'Requests']}
                />
                <Bar dataKey="requests" fill="#3B82F6" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>



        {/* Billing History */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Billing History</h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date (UTC)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {billingHistory.map((bill) => (
                  <tr key={bill.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(bill.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(bill.amount, bill.currency)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadInvoice(bill.invoiceUrl || '')}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 