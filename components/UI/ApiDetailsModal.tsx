import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';
import { DocumentDuplicateIcon, CheckIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { copyToClipboard } from '@/lib/utils';

interface ApiItem {
  id: string;
  title: string;
  subtitle: string;
  path: string;
  wrapperUrl: string;
  menuName: string;
  pageName: string;
  method: string;
  originalUrl: string;
  responseColumns?: Array<{
    name: string;
    type: string;
    description?: string;
    example?: string;
  }>;
  description?: string;
}

interface ApiKey {
  id: string;
  name: string;
  key: string;
}

interface ApiDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  api: ApiItem | null;
  selectedApiKey: ApiKey | null;
}

// Helper function to add line numbers to code
const addLineNumbers = (code: string) => {
  const lines = code.split('\n');
  return lines.map((line, index) => ({
    number: index + 1,
    content: line
  }));
};

// Helper function to shorten URL
const shortenUrl = (url: string) => {
  return url.length > 50 ? url.slice(0, 90) + '...' : url;
};

// Tabs component for usage examples
const UsageExamplesTabs: React.FC<{
  curlExample: string;
  fetchExample: string;
  fullEndpointUrl: string;
}> = ({ curlExample, fetchExample, fullEndpointUrl }) => {
  const [activeTab, setActiveTab] = useState('curl');
  const [copiedTab, setCopiedTab] = useState<string | null>(null);

  const tabs = [
    { id: 'curl', label: 'cURL', content: curlExample },
    { id: 'js', label: 'JavaScript', content: fetchExample },
    { 
      id: 'python', 
      label: 'Python', 
      content: `import requests

response = requests.get('${fullEndpointUrl}')
data = response.json()
print(data)` 
    }
  ];

  const handleCopyCode = async () => {
    const activeTabContent = tabs.find(tab => tab.id === activeTab)?.content;
    if (activeTabContent) {
      await copyToClipboard(activeTabContent);
      setCopiedTab(activeTab);
      setTimeout(() => setCopiedTab(null), 2000);
    }
  };

  return (
    <div className="border border-gray-200 rounded-sm overflow-hidden">
      {/* Tab Headers */}
      <div className="flex border-b border-gray-200 bg-blue-50/50 rounded-sm">
        <div className="flex flex-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-2 py-2 text-xs font-medium transition-all duration-200 relative ${
                activeTab === tab.id
                  ? 'bg-blue-50 text-blue-500 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-blue-50/70'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>
              )}
            </button>
          ))}
        </div>
        <button
          onClick={handleCopyCode}
          className="px-3 py-2 text-xs transition-all duration-200 border-l border-gray-200 bg-blue-50/50 text-gray-500 hover:text-gray-700 hover:bg-blue-50"
          title="Copy code"
        >
          {copiedTab === activeTab ? (
            <CheckIcon className="h-3 w-3" />
          ) : (
            <DocumentDuplicateIcon className="h-3 w-3" />
          )}
        </button>
      </div>
      
      {/* Tab Content */}
      <div className="bg-white overflow-hidden">
        {tabs.map((tab) => {
          const numberedLines = addLineNumbers(tab.content);
          return (
            <div
              key={tab.id}
              className={`${activeTab === tab.id ? 'block' : 'hidden'}`}
            >
              <div className="flex text-sm font-mono">
                {/* Line Numbers */}
                <div className="bg-gray-50 text-gray-500 px-0 py-4 select-none border-r border-gray-200 min-w-[2rem]">
                  {numberedLines.map((line) => (
                    <div key={line.number} className="text-center leading-6">
                      {line.number}
                    </div>
                  ))}
                </div>
                                 {/* Code Content */}
                 <div className={`flex-1 bg-white text-gray-800 px-4 py-4 ${tab.id === 'curl' ? '' : 'overflow-x-auto'}`}>
                   {numberedLines.map((line) => (
                     <div key={line.number} className={`leading-6 ${tab.id === 'curl' ? 'whitespace-pre-wrap break-words' : 'whitespace-pre'}`}>
                       {line.content}
                     </div>
                   ))}
                 </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ApiDetailsModal: React.FC<ApiDetailsModalProps> = ({
  isOpen,
  onClose,
  api,
  selectedApiKey
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedResponse, setCopiedResponse] = useState(false);
  const [sampleResponse, setSampleResponse] = useState<any>(null);
  const [loadingResponse, setLoadingResponse] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const fullEndpointUrl = api && selectedApiKey 
    ? `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001'}${api.wrapperUrl}?api_key=${selectedApiKey.key}`
    : '';

  // Preview URL for demo purposes (doesn't consume credits)
  // For trading APIs (without /api/tl prefix), use docs-preview endpoint
  const previewEndpointUrl = api && selectedApiKey 
    ? api.wrapperUrl.startsWith('/api/tl/')
      ? `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001'}${api.wrapperUrl.replace('/api/tl/', '/api/tl-preview/')}?api_key=${selectedApiKey.key}`
      : `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001'}${api.wrapperUrl.replace('/api/', '/api/docs-preview/')}?api_key=${selectedApiKey.key}`
    : '';

  const curlExample = fullEndpointUrl 
    ? `curl -X GET "${fullEndpointUrl}"`
    : '';

  const fetchExample = fullEndpointUrl 
    ? `fetch('${fullEndpointUrl}')
  .then(response => response.json())
  .then(data => {
    // Handle your data here
    return data;
  })
  .catch(error => console.error('Error:', error));`
    : '';

  const handleCopyEndpoint = async () => {
    if (fullEndpointUrl) {
      await copyToClipboard(fullEndpointUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const fetchSampleResponse = async () => {
    if (!previewEndpointUrl || loadingResponse) return;
    
    setLoadingResponse(true);
    try {
      // Use preview endpoint to avoid consuming credits
      const response = await fetch(previewEndpointUrl);
      const data = await response.json();
      
      // Limit the response size for display
      if (Array.isArray(data)) {
        setSampleResponse(data.slice(0, 3)); // Show first 3 items if array
      } else if (data?.query_result?.data?.rows) {
        setSampleResponse({
          ...data,
          query_result: {
            ...data.query_result,
            data: {
              ...data.query_result.data,
              rows: data.query_result.data.rows.slice(0, 3) // Show first 3 rows
            }
          }
        });
      } else {
        setSampleResponse(data);
      }
    } catch (error) {
      console.error('Error fetching response:', error);
      setSampleResponse({ 
        error: 'Failed to fetch response', 
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoadingResponse(false);
    }
  };

  useEffect(() => {
    if (isOpen && api && selectedApiKey) {
      setSampleResponse(null);
      setCopied(false);
      // Auto-fetch sample response when modal opens
      fetchSampleResponse();
    }
  }, [isOpen, api?.id, selectedApiKey?.id]);

  // Toggle row expansion
  const toggleRowExpansion = (index: number) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  // Only use responseColumns from S3 API data - no fallbacks
  const displayColumns = (api && api.responseColumns && api.responseColumns.length > 0) ? api.responseColumns : null;

  if (!api || !selectedApiKey) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-900">{api.title}</h3>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-sm text-xs font-medium bg-green-100 text-green-800">
              {api.method}
            </span>
          </div>
          {api.subtitle && (
            <p className="text-sm text-gray-600 mt-1">{api.subtitle}</p>
          )}
        </div>
      }
      size="2xl"
    >
      <div className="p-6 space-y-6">

        {/* Endpoint URL */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">API Endpoint</h4>
          <div className="relative">
          <code
      className="block bg-gray-900 text-green-400 p-3 rounded-sm text-sm overflow-hidden whitespace-nowrap"
      title={fullEndpointUrl} // full URL on hover
    >
      {shortenUrl(fullEndpointUrl)}
    </code>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyEndpoint}
              className="absolute top-2 right-2 bg-gray-800 border-gray-600 hover:bg-gray-700"
            >
              {copied ? (
                <>
                  <CheckIcon className="h-4 w-4 mr-1 text-green-400" />
                  <span className="text-green-400">Copied!</span>
                </>
              ) : (
                <>
                  <DocumentDuplicateIcon className="h-4 w-4 mr-1 text-gray-300" />
                  <span className="text-gray-300">Copy</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* API Description */}
        {api.description && (
          <div>
            <h4 className="font-semibold text-gray-900 mb-0">Description</h4>
            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-sm">{api.description}</p>
          </div>
        )}

        {/* Horizontal Line */}
        <hr className="border-gray-200" />

        {/* Response Columns (Left) and Usage Examples + Response (Right) - Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Response Columns - Left Side */}
          {displayColumns && displayColumns.length > 0 && (
            <div>
              <h4 className="font-medium text-sm text-gray-600 mb-2">Response Columns</h4>
              <div className="border border-gray-200 rounded-sm overflow-scroll">
                <div className="divide-y divide-gray-200">
                  {displayColumns.map((column: { name: string; type: string; description?: string; example?: string }, index: number) => (
                    <div key={index} className="bg-white">
                      {/* Accordion Header - Always visible */}
                      <button
                        onClick={() => toggleRowExpansion(index)}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 focus:outline-none focus:bg-gray-50 transition-colors"
                      >
                        <span className="text-gray-600 font-normal text-sm">
                          {column.name}
                        </span>
                        <div className="flex items-center space-x-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-sm text-xs font-medium bg-green-100 text-green-800">
                            {column.type}
                          </span>
                          <ChevronDownIcon 
                            className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${
                              expandedRows.has(index) ? 'rotate-180' : ''
                            }`}
                          />
                        </div>
                      </button>
                      
                      {/* Accordion Content - Shows on expand */}
                      {expandedRows.has(index) && (
                        <div className="px-4 pb-3 text-sm text-gray-700 bg-white">
                          <div className="border-l-2 border-blue-200 pl-3">
                            <p className="font-semibold text-gray-700 mb-1 text-xs">Description:</p>
                            <p className="text-gray-600 text-sm">{column.description || 'No description available'}</p>
                            {column.example && (
                              <>
                                <p className="font-semibold text-gray-700 mt-2 mb-1 text-xs">Example:</p>
                                <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">{column.example}</code>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Usage Examples and Sample Response - Right Side */}
          <div className="space-y-6">
            {/* Usage Examples */}
            <div>
              <h4 className="font-medium text-sm text-gray-600 mb-2">Usage Examples</h4>
              
              <UsageExamplesTabs 
                curlExample={curlExample}
                fetchExample={fetchExample}
                fullEndpointUrl={fullEndpointUrl}
              />
            </div>

            {/* Sample Response */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-sm text-gray-600">Response snippet</h4>
              </div>
              
              <div className="border border-gray-200 rounded-sm overflow-hidden h-80">
                <div className="bg-white h-full flex flex-col">
                  {/* Header with .json label and copy button - matching usage examples style */}
                  <div className="flex border-b border-gray-200 bg-blue-50/50 rounded-sm">
                    <div className="flex-1 px-2 py-2 text-xs font-medium text-gray-500 bg-gray-50 shadow-sm">
                      JSON
                    </div>
                    <button
                      onClick={async () => {
                        if (sampleResponse) {
                          const jsonString = JSON.stringify(sampleResponse, null, 2);
                          await copyToClipboard(jsonString);
                          setCopiedResponse(true);
                          setTimeout(() => setCopiedResponse(false), 2000);
                        }
                      }}
                      className="px-3 py-2 text-xs transition-all duration-200 border-l border-gray-200 bg-gray-50/50 text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                      title="Copy response"
                    >
                      {copiedResponse ? (
                        <CheckIcon className="h-3 w-3" />
                      ) : (
                        <DocumentDuplicateIcon className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    {sampleResponse ? (
                      (() => {
                        const jsonString = JSON.stringify(sampleResponse, null, 2);
                        const numberedLines = addLineNumbers(jsonString);
                        return (
                          <div className="flex text-sm font-mono h-full">
                            {/* Line Numbers */}
                            <div className="bg-gray-50 text-gray-500 px-0 py-4 select-none border-r border-gray-200 min-w-[2rem] overflow-y-auto">
                              {numberedLines.map((line) => (
                                <div key={line.number} className="text-center leading-6">
                                  {line.number}
                                </div>
                              ))}
                            </div>
                            {/* JSON Content */}
                            <div className="flex-1 bg-white text-gray-800 px-4 py-4 overflow-auto">
                              {numberedLines.map((line) => (
                                <div key={line.number} className="whitespace-pre leading-6">
                                  {line.content}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      <div className="flex text-sm font-mono h-full">
                        <div className="bg-gray-50 text-gray-500 px-0 py-4 select-none border-r border-gray-200 min-w-[2rem]">
                          <div className="text-center leading-6">1</div>
                        </div>
                        <div className="flex-1 bg-white text-gray-800 px-4 py-4">
                          <div className="whitespace-pre leading-6">Loading response...</div>
                        </div>
                      </div>
                    )}
                  </div>
                  {sampleResponse && !sampleResponse.error && (
                    <div className="text-xs text-gray-600 px-4 py-2 border-t border-gray-200 bg-gray-50">
                      Note: Response has been truncated for display. The actual API returns complete data.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        
      </div>
    </Modal>
  );
};

export default ApiDetailsModal;
