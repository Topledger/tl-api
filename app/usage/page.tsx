'use client';

import { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, ChartBarIcon, ClockIcon, CurrencyDollarIcon, BoltIcon } from '@heroicons/react/24/outline';
import MainLayout from '@/components/Layout/MainLayout';
import Button from '@/components/UI/Button';
import Dropdown from '@/components/UI/Dropdown';
import ChartContainer from '@/components/Charts/ChartContainer';
import { formatDate } from '@/lib/utils';

interface ApiLog {
  id: string;
  timestamp: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime?: number;
  userAgent?: string;
  ipAddress?: string;
  errorMessage?: string;
  user: { name: string; email: string };
  apiKey: { name: string };
}

interface ApiStats {
  totalCalls: number;
  successRate: number;
  topEndpoints: { endpoint: string; count: number }[];
  dailyUsage: { date: string; hits: number; avg_response_time: number }[];
  monthlyStats?: {
    totalCalls: number;
    totalCredits: number;
    avgCallsPerDay: number;
    avgCreditsPerDay: number;
    avgResponseTime: number;
  };
}

export default function TrackingPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApiKey, setSelectedApiKey] = useState('');
  const [selectedEndpoint, setSelectedEndpoint] = useState('');
  const [selectedDateRange, setSelectedDateRange] = useState('7d');
  const [isLoading, setIsLoading] = useState(true);
  const [apiLogs, setApiLogs] = useState<ApiLog[]>([]);
  const [apiStats, setApiStats] = useState<ApiStats | null>(null);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    loadData();
  }, [currentPage, selectedApiKey, selectedEndpoint, selectedDateRange]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Load API keys
      const keysResponse = await fetch('/api/keys');
      if (keysResponse.ok) {
        const keysData = await keysResponse.json();
        setApiKeys(Array.isArray(keysData) ? keysData : []);
      }

      // Prepare query parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString()
      });

      if (selectedApiKey) params.append('apiKeyId', selectedApiKey);
      if (selectedEndpoint) params.append('endpoint', selectedEndpoint);
      
      // Add date range
      const endDate = new Date();
      // Set endDate to end of today to include all of today's calls
      endDate.setHours(23, 59, 59, 999);
      
      const startDate = new Date();
      switch (selectedDateRange) {
        case '1d':
          startDate.setDate(endDate.getDate() - 1);
          startDate.setHours(0, 0, 0, 0);
          break;
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          startDate.setHours(0, 0, 0, 0);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          startDate.setHours(0, 0, 0, 0);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          startDate.setHours(0, 0, 0, 0);
          break;
      }
      
      if (selectedDateRange !== 'all') {
        params.append('startDate', startDate.toISOString());
        params.append('endDate', endDate.toISOString());
      }

      // Load API logs
      const logsResponse = await fetch(`/api/tracking/logs?${params}`);
      if (logsResponse.ok) {
        const logsData = await logsResponse.json();
        setApiLogs(logsData.logs || []);
        setTotalPages(logsData.totalPages || 1);
      }

      // Load statistics
      const statsParams = new URLSearchParams();
      if (selectedApiKey) statsParams.append('apiKeyId', selectedApiKey);
      if (selectedDateRange !== 'all') {
        statsParams.append('startDate', startDate.toISOString());
        statsParams.append('endDate', endDate.toISOString());
      }

      const statsResponse = await fetch(`/api/tracking/stats?${statsParams}`);
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setApiStats(statsData);
      }
    } catch (error) {
      console.error('Error loading tracking data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter logs based on search term
  const filteredLogs = apiLogs.filter(log => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      log.endpoint.toLowerCase().includes(searchLower) ||
      log.method.toLowerCase().includes(searchLower) ||
      log.user.name.toLowerCase().includes(searchLower) ||
      log.apiKey.name.toLowerCase().includes(searchLower) ||
      (log.errorMessage && log.errorMessage.toLowerCase().includes(searchLower))
    );
  });

  // Prepare dropdown options
  const apiKeyOptions = [
    { value: '', label: 'All API Keys' },
    ...(Array.isArray(apiKeys) ? apiKeys.map(key => ({ value: key.id, label: key.name })) : [])
  ];

  const dateRangeOptions = [
    { value: '1d', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
    { value: 'all', label: 'All Time' }
  ];

  const getStatusBadge = (statusCode: number) => {
    if (statusCode >= 200 && statusCode < 300) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">{statusCode}</span>;
    } else if (statusCode >= 400 && statusCode < 500) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">{statusCode}</span>;
    } else {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">{statusCode}</span>;
    }
  };

  return (
    <MainLayout title="API Usage Tracking">
      <div className="space-y-6">
        {/* Statistics Cards */}
        {apiStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">API Calls This Month</dt>
                    <dd className="text-lg font-medium text-gray-900">{apiStats.monthlyStats?.totalCalls?.toLocaleString() || apiStats.totalCalls.toLocaleString()}</dd>
                  </dl>
                </div>
              </div>
            </div>

           {/* <div className="bg-white rounded-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CurrencyDollarIcon className="h-8 w-8 text-amber-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Credits Consumed This Month</dt>
                    <dd className="text-lg font-medium text-gray-900">{apiStats.monthlyStats?.totalCredits?.toLocaleString() || apiStats.totalCalls.toLocaleString()}</dd>
                  </dl>
                </div>
              </div>
            </div> */}

            <div className="bg-white rounded-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Avg API Calls/Day</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {apiStats.monthlyStats?.avgCallsPerDay?.toFixed(0) || Math.round(apiStats.totalCalls / 30)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            {/* <div className="bg-white rounded-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-8 w-8 text-orange-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Avg Credits/Day</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {apiStats.monthlyStats?.avgCreditsPerDay?.toFixed(0) || Math.round(apiStats.totalCalls / 30)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div> */}

            <div className="bg-white rounded-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BoltIcon className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Avg Response Time</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {apiStats.monthlyStats?.avgResponseTime?.toFixed(0) || '--'}ms
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Usage Charts */}
        <ChartContainer apiKeys={apiKeys} />

        {/* API Logs Table */}
        <div className="bg-white rounded-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">API Call Logs</h3>
            <p className="mt-1 text-sm text-gray-500">
              Showing {filteredLogs.length} of {apiLogs.length} logs
            </p>
          </div>
          
          {/* Search and Filters Section */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              {/* Search Bar */}
              <div className="relative flex-1 lg:max-w-none">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by endpoint, method, user, or error..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full text-sm rounded-sm border border-gray-200 py-2 focus:outline-none"
                />
              </div>
              
              {/* Dropdowns Container */}
              <div className="flex flex-wrap gap-4 lg:flex-nowrap lg:ml-auto lg:flex-shrink-0">
                <Dropdown
                  options={apiKeyOptions}
                  value={selectedApiKey}
                  onChange={(value) => {
                    setSelectedApiKey(value);
                    setCurrentPage(1);
                  }}
                  placeholder="All API Keys"
                  className="w-full sm:w-[200px] lg:w-[200px]"
                />
                
                <Dropdown
                  options={dateRangeOptions}
                  value={selectedDateRange}
                  onChange={(value) => {
                    setSelectedDateRange(value);
                    setCurrentPage(1);
                  }}
                  placeholder="Date Range"
                  className="w-full sm:w-[200px] lg:w-[200px]"
                />

                <input
                  type="text"
                  placeholder="Filter by endpoint..."
                  value={selectedEndpoint}
                  onChange={(e) => {
                    setSelectedEndpoint(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 text-sm rounded-sm border border-gray-200 focus:outline-none w-full sm:w-[200px] lg:w-[200px]"
                />
              </div>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
              <p className="mt-2 text-gray-500">Loading tracking data...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No API logs found matching your filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Endpoint
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Response Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      API Key
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(log.timestamp)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        <span title={log.endpoint}>{log.endpoint}</span>
                        {log.errorMessage && (
                          <div className="text-xs text-red-600 truncate" title={log.errorMessage}>
                            {log.errorMessage}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {log.method}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getStatusBadge(log.statusCode)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.responseTime ? `${log.responseTime}ms` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{log.user.name}</div>
                          <div className="text-gray-500">{log.user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.apiKey.name}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
