'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DocumentDuplicateIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import MainLayout from '@/components/Layout/MainLayout';
import Button from '@/components/UI/Button';
import { useAppStore } from '@/lib/store';
import { copyToClipboard, formatDate } from '@/lib/utils';
// Removed mock data import - now using real tracking data

export default function ApiDetailsPage() {
  const params = useParams();
  const apiId = params.id as string;
  const [apiUsageData, setApiUsageData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const loadingRef = useRef(false);

  const { apiEndpoints, setApiEndpoints, isHydrated, setHydrated } = useAppStore();
  const apiEndpoint = apiEndpoints.find(endpoint => endpoint.id === apiId);

  const loadData = useCallback(async () => {
    if (loadingRef.current) return; // Prevent multiple concurrent requests
    
    loadingRef.current = true;
    setIsLoading(true);
    try {
      // Load API endpoints from the real API list
      const endpointsResponse = await fetch('/api/tl-apis');
      if (!endpointsResponse.ok) {
        throw new Error(`API list failed: ${endpointsResponse.status}`);
      }
      const endpointsData = await endpointsResponse.json();
      setApiEndpoints(endpointsData.apis);

      // Load real usage data for this specific API from tracking
      if (apiId) {
        try {
          const usageResponse = await fetch(`/api/tracking/stats?endpoint=${encodeURIComponent(apiId)}`);
          if (usageResponse.ok) {
            const usageData = await usageResponse.json();
            // Convert tracking stats to chart format
            const chartData = usageData.dailyUsage?.map((day: any) => ({
              date: day.date,
              requests: day.calls || 0,
              responseTime: day.avgResponseTime || 0
            })) || [];
            setApiUsageData(chartData);
          } else {
            // Fallback to empty data if tracking API fails
            setApiUsageData([]);
          }
        } catch (error) {
          console.error('Error loading usage data:', error);
          setApiUsageData([]);
        }
      }
    } catch (error) {
      console.error('Error loading API data:', error);
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
    }
  }, [apiId, setApiEndpoints]);

  useEffect(() => {
    setMounted(true);
    if (!isHydrated) {
      setHydrated();
    }
  }, [isHydrated, setHydrated]);

  useEffect(() => {
    if (mounted && isHydrated) {
      loadData();
    }
  }, [mounted, isHydrated, loadData]);

  const handleCopyEndpoint = async () => {
    if (apiEndpoint) {
      try {
        await copyToClipboard(apiEndpoint.path);
        console.log('Endpoint copied to clipboard');
      } catch (error) {
        console.error('Failed to copy endpoint:', error);
      }
    }
  };

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return null;
  }

  if (isLoading) {
    return (
      <MainLayout title="Loading API Details...">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading API details...</p>
        </div>
      </MainLayout>
    );
  }

  if (!apiEndpoint) {
    return (
      <MainLayout title="API Not Found">
        <div className="text-center py-8">
          <p className="text-gray-500">API endpoint not found.</p>
          <p className="text-sm text-gray-400 mt-2">ID: {apiId}</p>
        </div>
      </MainLayout>
    );
  }

  const breadcrumbs = [
    { label: 'Top Ledger APIs', href: '/' },
    { label: apiEndpoint.name }
  ];

  return (
    <MainLayout breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        {/* API Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{apiEndpoint.name}</h1>
            <p className="text-gray-600 leading-relaxed mb-4">
              {apiEndpoint.description}
            </p>
            
            {/* API Method and Path */}
            <div className="flex items-center space-x-4 text-sm">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                apiEndpoint.method === 'GET' ? 'bg-green-100 text-green-800' :
                apiEndpoint.method === 'POST' ? 'bg-gray-100 text-gray-800' :
                apiEndpoint.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {apiEndpoint.method}
              </span>
              <code className="bg-gray-100 px-3 py-1 rounded text-gray-800 font-mono">
                {apiEndpoint.path}
              </code>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 ml-6">
            <Button variant="outline" size="sm">
              <DocumentTextIcon className="h-4 w-4 mr-2" />
              Docs
            </Button>
            <Button variant="primary" size="sm" onClick={handleCopyEndpoint}>
              <DocumentDuplicateIcon className="h-4 w-4 mr-2" />
              Copy endpoint
            </Button>
          </div>
        </div>

        {/* Statistics */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Statistics</h2>
          
          <div className="mb-8">
            <h3 className="text-sm font-medium text-gray-500 mb-6">Network Usage</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-600 mb-1">19,000</div>
                <div className="text-sm text-gray-500">Total Requests</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-600 mb-1">19,000</div>
                <div className="text-sm text-gray-500">Avg Req/Sec</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-600 mb-1">19,000</div>
                <div className="text-sm text-gray-500">Cached Requests</div>
              </div>
            </div>
          </div>

          {/* Total requests chart */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-6">Total requests</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={apiUsageData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `Sep ${date.getDate()}, 2024`;
                    }}
                    stroke="#9ca3af"
                    fontSize={12}
                    tick={{ fill: '#9ca3af' }}
                  />
                  <YAxis 
                    stroke="#9ca3af"
                    fontSize={12}
                    tick={{ fill: '#9ca3af' }}
                    tickFormatter={(value) => `${Math.round(value / 100000)}00M`}
                    domain={[0, 800000000]}
                    ticks={[0, 200000000, 400000000, 600000000, 800000000]}
                  />
                  <Tooltip 
                    labelFormatter={(value) => formatDate(value)}
                    formatter={(value: number) => [value.toLocaleString(), 'Requests']}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="requests" 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, stroke: '#8b5cf6', strokeWidth: 2, fill: 'white' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* API Schema Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Request Schema */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Schema</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <pre className="text-sm text-gray-800 overflow-x-auto">
                <code>{JSON.stringify(apiEndpoint.requestSchema, null, 2)}</code>
              </pre>
            </div>
          </div>

          {/* Response Schema */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Response Schema</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <pre className="text-sm text-gray-800 overflow-x-auto">
                <code>{JSON.stringify(apiEndpoint.responseSchema, null, 2)}</code>
              </pre>
            </div>
          </div>
        </div>

        {/* API Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">API Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Endpoint</h4>
              <code className="bg-gray-100 px-3 py-2 rounded text-gray-800 font-mono block">
                {apiEndpoint.path}
              </code>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Method</h4>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                apiEndpoint.method === 'GET' ? 'bg-green-100 text-green-800' :
                apiEndpoint.method === 'POST' ? 'bg-gray-100 text-gray-800' :
                apiEndpoint.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {apiEndpoint.method}
              </span>
            </div>
          </div>
          
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-500 mb-2">Description</h4>
            <p className="text-gray-700">{apiEndpoint.description}</p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 