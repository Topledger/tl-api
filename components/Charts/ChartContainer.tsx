'use client';

import React, { useState, useEffect } from 'react';
import { ChartBarIcon, ClockIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import UsageChart from './UsageChart';
import Dropdown from '@/components/UI/Dropdown';
import Button from '@/components/UI/Button';

interface ChartData {
  timeSeriesData: any[];
  apiKeyData: any[];
  creditsTimeSeriesData: any[];
  totalLogs: number;
  dateRange: {
    start: string;
    end: string;
  };
}

interface ChartContainerProps {
  apiKeys: any[];
}

export default function ChartContainer({ apiKeys }: ChartContainerProps) {
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedApiKey, setSelectedApiKey] = useState('');
  const [timeRange, setTimeRange] = useState('daily');
  // Dynamic days back based on time range
  const getDaysBack = (range: string) => {
    switch (range) {
      case 'daily': return 30;
      case 'weekly': return 84; // 12 weeks
      case 'monthly': return 365; // 12 months
      case 'quarterly': return 730; // 8 quarters (2 years)
      default: return 30;
    }
  };
  const [chartType, setChartType] = useState<'timeSeries' | 'apiKeys'>('timeSeries');
  const [metric, setMetric] = useState<'hits' | 'credits' | 'responseTime'>('hits');

  useEffect(() => {
    loadChartData();
  }, [selectedApiKey, timeRange, metric]);

  const loadChartData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        timeRange,
        daysBack: getDaysBack(timeRange).toString()
      });

      if (selectedApiKey) {
        params.append('apiKeyId', selectedApiKey);
      }

      const response = await fetch(`/api/tracking/chart-data?${params}`);
      if (response.ok) {
        const data = await response.json();
        setChartData(data);
      }
    } catch (error) {
      console.error('Error loading chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Dropdown options
  const apiKeyOptions = [
    { value: '', label: 'All API Keys' },
    ...(Array.isArray(apiKeys) ? apiKeys.map(key => ({ 
      value: key.id, 
      label: key.name 
    })) : [])
  ];

  const timeRangeOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' }
  ];

  const metricOptions = [
    { value: 'hits', label: 'API Hits' },
    { value: 'credits', label: 'Credits Consumed' },
    { value: 'responseTime', label: 'Response Time' }
  ];

  return (
    <div className="space-y-6">
      {/* Chart Display - Following API Logs Table Design */}
      <div className="bg-white rounded-sm border border-gray-200 overflow-hidden">
        {/* Header Section - Matching API Logs Table */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Usage Analytics</h3>
          <p className="mt-1 text-sm text-gray-500">
            {chartData ? `Showing ${chartData.totalLogs.toLocaleString()} total API calls` : 'API usage visualization'}
          </p>
        </div>

        {/* Filters Section - Always Visible */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-wrap gap-3 items-center">
              <Dropdown
                options={apiKeyOptions}
                value={selectedApiKey}
                onChange={setSelectedApiKey}
                placeholder="All API Keys"
                className="w-[200px]"
              />
              
              <Dropdown
                options={timeRangeOptions}
                value={timeRange}
                onChange={setTimeRange}
                placeholder="Time Range"
                className="w-[140px]"
              />
              
              <Dropdown
                options={metricOptions}
                value={metric}
                onChange={(value) => setMetric(value as any)}
                placeholder="Metric"
                className="w-[180px]"
              />

              <Button
                variant={chartType === 'timeSeries' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setChartType('timeSeries')}
                disabled={loading}
              >
                Time Series
              </Button>
              <Button
                variant={chartType === 'apiKeys' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setChartType('apiKeys')}
                disabled={loading}
              >
                By API Key
              </Button>
          </div>
        </div>

        {/* Chart Area - Only this part shows loading */}
        <div className="px-6 py-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                <p className="mt-2 text-gray-500">Loading chart data...</p>
              </div>
            ) : chartData ? (
              <UsageChart
                data={chartData.timeSeriesData}
                apiKeyData={chartData.apiKeyData}
                width="100%"
                height={400}
                chartType={chartType}
                metric={metric}
                timeRange={timeRange}
              />
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No data available for the selected filters.</p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
