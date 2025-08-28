'use client';

import React, { useMemo, useRef, useEffect, useState } from 'react';
import { formatDate } from '@/lib/utils';
import { AreaClosed, Bar } from '@visx/shape';
import { Group } from '@visx/group';
import { scaleTime, scaleLinear, scaleBand } from '@visx/scale';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { GridRows, GridColumns } from '@visx/grid';
import { LinearGradient } from '@visx/gradient';
import { curveMonotoneX } from '@visx/curve';
import { localPoint } from '@visx/event';

interface TimeSeriesDataPoint {
  date: string;
  hits: number;
  credits: number;
  avgResponseTime: number;
  successfulCalls: number;
}

interface ApiKeyDataPoint {
  name: string;
  hits: number;
  credits: number;
  avgResponseTime: number;
  successRate: number;
}

interface UsageChartProps {
  data: TimeSeriesDataPoint[];
  apiKeyData: ApiKeyDataPoint[];
  width: number | string;
  height: number;
  chartType: 'timeSeries' | 'apiKeys';
  metric: 'hits' | 'credits' | 'responseTime';
  timeRange: string;
}

// Accessors
const getDate = (d: TimeSeriesDataPoint) => new Date(d.date);
const getHits = (d: TimeSeriesDataPoint) => d.hits;
const getCredits = (d: TimeSeriesDataPoint) => d.credits;
const getResponseTime = (d: TimeSeriesDataPoint) => d.avgResponseTime;

const getApiKeyName = (d: ApiKeyDataPoint) => d.name;
const getApiKeyHits = (d: ApiKeyDataPoint) => d.hits;
const getApiKeyCredits = (d: ApiKeyDataPoint) => d.credits;
const getApiKeyResponseTime = (d: ApiKeyDataPoint) => d.avgResponseTime;

// Tooltip interfaces
interface TooltipData {
  date?: string;
  name?: string;
  hits: number;
  credits: number;
  avgResponseTime: number;
  successfulCalls?: number;
}

interface TooltipPosition {
  x: number;
  y: number;
}

export default function UsageChart({
  data,
  apiKeyData,
  width,
  height,
  chartType,
  metric,
  timeRange
}: UsageChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(1000);
  const [tooltipData, setTooltipData] = useState<TooltipData | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition | null>(null);
  const margin = { top: 20, right: 0, bottom: 60, left: 60 }; // Remove right margin
  
  // Update container width on resize
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Handle dynamic width
  const actualWidth = typeof width === 'string' ? containerWidth : width;
  const innerWidth = actualWidth - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Function to format dates based on the date string format and time range
  const formatChartDate = (dateString: string) => {
    // Handle different date formats from backend
    if (dateString.includes('Q')) {
      // Quarterly format: "2025-Q1"
      return dateString;
    } else if (dateString.match(/^\d{4}-\d{2}$/)) {
      // Monthly format: "2025-08"
      const [year, month] = dateString.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(date);
    } else {
      // Daily/weekly format: "2025-08-28"
      try {
        if (timeRange === 'weekly') {
          // For weekly, show "Week of [Monday's date]"
          const date = new Date(dateString);
          // Ensure we're showing Monday's date (the dateString should already be Monday from backend)
          return `Week of ${formatDate(dateString)}`;
        }
        return formatDate(dateString);
      } catch {
        return dateString;
      }
    }
  };

  // Time series chart
  const timeSeriesScales = useMemo(() => {
    if (chartType !== 'timeSeries' || !data.length) return null;

    const xScale = scaleBand({
      range: [0, innerWidth],
      domain: data.map((d, i) => d.date),
      padding: 0.3
    });

    let yScale;
    let accessor;
    
    switch (metric) {
      case 'credits':
        accessor = getCredits;
        break;
      case 'responseTime':
        accessor = getResponseTime;
        break;
      default:
        accessor = getHits;
    }

    const maxY = Math.max(...data.map(accessor));
    
    yScale = scaleLinear({
      range: [innerHeight, 0],
      domain: [0, maxY * 1.1],
      nice: true
    });

    return { xScale, yScale, accessor };
  }, [data, innerWidth, innerHeight, chartType, metric]);

  // API keys bar chart
  const apiKeyScales = useMemo(() => {
    if (chartType !== 'apiKeys' || !apiKeyData.length) return null;

    const xScale = scaleBand({
      range: [0, innerWidth],
      domain: apiKeyData.map(getApiKeyName),
      padding: 0.3
    });

    let yScale;
    let accessor;
    
    switch (metric) {
      case 'credits':
        accessor = getApiKeyCredits;
        break;
      case 'responseTime':
        accessor = getApiKeyResponseTime;
        break;
      default:
        accessor = getApiKeyHits;
    }

    const maxY = Math.max(...apiKeyData.map(accessor));
    
    yScale = scaleLinear({
      range: [innerHeight, 0],
      domain: [0, maxY * 1.1],
      nice: true
    });

    return { xScale, yScale, accessor };
  }, [apiKeyData, innerWidth, innerHeight, chartType, metric]);

  const getChartColor = () => {
    switch (metric) {
      case 'credits':
        return '#f59e0b'; // amber
      case 'responseTime':
        return '#8b5cf6'; // purple
      default:
        return '#3b82f6'; // blue
    }
  };

  const getYAxisLabel = () => {
    switch (metric) {
      case 'credits':
        return 'Credits Consumed';
      case 'responseTime':
        return 'Avg Response Time (ms)';
      default:
        return 'API Hits';
    }
  };

  // Tooltip handlers
  const handleMouseMove = (event: React.MouseEvent, data: TooltipData) => {
    const point = localPoint(event);
    if (point) {
      setTooltipPosition({ x: point.x, y: point.y });
      setTooltipData(data);
    }
  };

  const handleMouseLeave = () => {
    setTooltipData(null);
    setTooltipPosition(null);
  };

  // Format values for tooltip
  const formatValue = (value: number, type: 'hits' | 'credits' | 'responseTime') => {
    if (type === 'responseTime') {
      return `${value.toFixed(2)}ms`;
    }
    return value.toLocaleString();
  };

  // Get metric label and value for tooltip
  const getMetricInfo = (data: TooltipData) => {
    switch (metric) {
      case 'credits':
        return {
          label: 'Credits Consumed',
          value: formatValue(data.credits, 'credits')
        };
      case 'responseTime':
        return {
          label: 'Avg Response Time',
          value: formatValue(data.avgResponseTime, 'responseTime')
        };
      default:
        return {
          label: 'API Hits',
          value: formatValue(data.hits, 'hits')
        };
    }
  };

  if (chartType === 'timeSeries' && timeSeriesScales) {
    const { xScale, yScale, accessor } = timeSeriesScales;
    const color = getChartColor();

    return (
      <div ref={containerRef} className="relative w-full">
        <svg width={actualWidth} height={height}>
          <Group left={margin.left} top={margin.top}>
            <GridRows
              scale={yScale}
              width={innerWidth}
              strokeDasharray="2,2"
              stroke="#e5e7eb"
              strokeOpacity={0.8}
            />
            {data.map((d) => {
              const barWidth = xScale.bandwidth();
              const barHeight = innerHeight - (yScale(accessor(d)) ?? 0);
              const barX = xScale(d.date) ?? 0;
              const barY = yScale(accessor(d)) ?? 0;
              
              return (
                <Bar
                  key={`bar-${d.date}`}
                  x={barX}
                  y={barY}
                  width={barWidth}
                  height={barHeight}
                  fill={color}
                  opacity={0.8}
                  className="hover:opacity-100 transition-opacity cursor-pointer"
                  onMouseMove={(event) => handleMouseMove(event, {
                    date: d.date,
                    hits: d.hits,
                    credits: d.credits,
                    avgResponseTime: d.avgResponseTime,
                    successfulCalls: d.successfulCalls
                  })}
                  onMouseLeave={handleMouseLeave}
                />
              );
            })}
            <AxisBottom
              top={innerHeight}
              scale={xScale}
              stroke="#6b7280"
              tickStroke="#6b7280"
              tickFormat={formatChartDate}
              tickLabelProps={{
                fill: '#6b7280',
                fontSize: 12,
                textAnchor: 'middle',
                angle: data.length > 7 ? -45 : 0,
                dx: data.length > 7 ? -4 : 0,
                dy: data.length > 7 ? 4 : 0
              }}
            />
            <AxisLeft
              scale={yScale}
              stroke="#6b7280"
              tickStroke="#6b7280"
              tickLabelProps={{
                fill: '#6b7280',
                fontSize: 12,
                textAnchor: 'end',
                dx: -4
              }}
              label={getYAxisLabel()}
              labelProps={{
                fill: '#6b7280',
                fontSize: 14,
                textAnchor: 'middle'
              }}
            />
          </Group>
        </svg>
        
        {/* Tooltip */}
        {tooltipData && tooltipPosition && (
          <div
            className="absolute pointer-events-none z-10 bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm"
            style={{
              left: tooltipPosition.x + 10,
              top: tooltipPosition.y - 10,
              transform: tooltipPosition.x > actualWidth / 2 ? 'translateX(-100%)' : 'translateX(0)'
            }}
          >
            <div className="font-medium text-gray-900 mb-2">
              {tooltipData.date ? formatChartDate(tooltipData.date) : tooltipData.name}
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-600">{getMetricInfo(tooltipData).label}:</span>
              <span className="font-medium">{getMetricInfo(tooltipData).value}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (chartType === 'apiKeys' && apiKeyScales) {
    const { xScale, yScale, accessor } = apiKeyScales;
    const color = getChartColor();

    return (
      <div ref={containerRef} className="relative w-full">
        <svg width={actualWidth} height={height}>
          <Group left={margin.left} top={margin.top}>
            <GridRows
              scale={yScale}
              width={innerWidth}
              strokeDasharray="2,2"
              stroke="#e5e7eb"
              strokeOpacity={0.8}
            />
            {apiKeyData.map((d) => {
              const barWidth = xScale.bandwidth();
              const barHeight = innerHeight - (yScale(accessor(d)) ?? 0);
              const barX = xScale(getApiKeyName(d)) ?? 0;
              const barY = yScale(accessor(d)) ?? 0;
              
              return (
                <Bar
                  key={`bar-${getApiKeyName(d)}`}
                  x={barX}
                  y={barY}
                  width={barWidth}
                  height={barHeight}
                  fill={color}
                  opacity={0.8}
                  className="hover:opacity-100 transition-opacity cursor-pointer"
                  onMouseMove={(event) => handleMouseMove(event, {
                    name: d.name,
                    hits: d.hits,
                    credits: d.credits,
                    avgResponseTime: d.avgResponseTime
                  })}
                  onMouseLeave={handleMouseLeave}
                />
              );
            })}
            <AxisBottom
              top={innerHeight}
              scale={xScale}
              stroke="#6b7280"
              tickStroke="#6b7280"
              tickLabelProps={{
                fill: '#6b7280',
                fontSize: 12,
                textAnchor: 'middle',
                angle: -45,
                dx: -4,
                dy: 4
              }}
            />
            <AxisLeft
              scale={yScale}
              stroke="#6b7280"
              tickStroke="#6b7280"
              tickLabelProps={{
                fill: '#6b7280',
                fontSize: 12,
                textAnchor: 'end',
                dx: -4
              }}
              label={getYAxisLabel()}
              labelProps={{
                fill: '#6b7280',
                fontSize: 14,
                textAnchor: 'middle'
              }}
            />
          </Group>
        </svg>
        
        {/* Tooltip */}
        {tooltipData && tooltipPosition && (
          <div
            className="absolute pointer-events-none z-10 bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm"
            style={{
              left: tooltipPosition.x + 10,
              top: tooltipPosition.y - 10,
              transform: tooltipPosition.x > actualWidth / 2 ? 'translateX(-100%)' : 'translateX(0)'
            }}
          >
            <div className="font-medium text-gray-900 mb-2">
              {tooltipData.date ? formatChartDate(tooltipData.date) : tooltipData.name}
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-600">{getMetricInfo(tooltipData).label}:</span>
              <span className="font-medium">{getMetricInfo(tooltipData).value}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex items-center justify-center h-full text-gray-500 w-full">
      No data available for the selected filters
    </div>
  );
}
