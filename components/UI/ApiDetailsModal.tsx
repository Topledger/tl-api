import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';
import { DocumentDuplicateIcon, CheckIcon } from '@heroicons/react/24/outline';
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

// Tabs component for usage examples
const UsageExamplesTabs: React.FC<{
  curlExample: string;
  fetchExample: string;
  fullEndpointUrl: string;
}> = ({ curlExample, fetchExample, fullEndpointUrl }) => {
  const [activeTab, setActiveTab] = useState('curl');

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

  return (
    <div className="border border-gray-200 rounded-sm overflow-hidden h-80">
      {/* Tab Headers */}
      <div className="flex border-b border-gray-200 bg-blue-50/50 rounded-sm">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 relative ${
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
      
      {/* Tab Content */}
      <div className="bg-gray-100 flex-1 overflow-hidden">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`h-full overflow-y-auto ${activeTab === tab.id ? 'block' : 'hidden'}`}
          >
            <code className="block p-4 text-sm whitespace-pre-wrap break-words font-mono">
              {tab.content}
            </code>
          </div>
        ))}
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
  const [sampleResponse, setSampleResponse] = useState<any>(null);
  const [loadingResponse, setLoadingResponse] = useState(false);

  const fullEndpointUrl = api && selectedApiKey 
    ? `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001'}${api.wrapperUrl}?api_key=${selectedApiKey.key}`
    : '';

  // Preview URL for demo purposes (doesn't consume credits)
  const previewEndpointUrl = api && selectedApiKey 
    ? `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001'}${api.wrapperUrl.replace('/api/tl/', '/api/tl-preview/')}?api_key=${selectedApiKey.key}`
    : '';

  const curlExample = fullEndpointUrl 
    ? `curl -X GET "${fullEndpointUrl}"`
    : '';

  const fetchExample = fullEndpointUrl 
    ? `fetch('${fullEndpointUrl}')
  .then(response => response.json())
  .then(data => console.log(data))
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
            <code className="block bg-gray-900 text-green-400 p-4 rounded-sm text-sm overflow-x-auto">
              {fullEndpointUrl}
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

        {/* Horizontal Line */}
        <hr className="border-gray-200" />

        {/* Usage Examples and Sample Response - Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Usage Examples */}
          <div>
            <h4 className="font-medium text-sm text-gray-600 mb-3">Usage Examples</h4>
            
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
              <div className="flex items-center space-x-1 text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full border border-green-200">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Preview Mode - No Credits Used</span>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-sm overflow-hidden h-80">
              <div className="bg-gray-100 h-full flex flex-col">
                <div className="flex-1 overflow-y-auto">
                  <code className="block p-4 text-sm overflow-x-auto whitespace-pre font-mono">
                    {sampleResponse ? JSON.stringify(sampleResponse, null, 2) : 'Loading response...'}
                  </code>
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
    </Modal>
  );
};

export default ApiDetailsModal;
