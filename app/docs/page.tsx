'use client';

import { useState, useEffect } from 'react';
import { ChevronDownIcon, ChevronRightIcon, DocumentDuplicateIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import MainLayout from '@/components/Layout/MainLayout';
import { copyToClipboard } from '@/lib/utils';

interface ApiItem {
  id: string;
  title: string;
  subtitle: string;
  path: string;
  wrapperUrl: string;
  menuName: string;
  pageName: string;
  page?: string;
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

interface ApiData {
  totalApis: number;
  extractedAt: string;
  apis: ApiItem[];
}

interface GroupedApis {
  [menuName: string]: {
    [pageName: string]: ApiItem[];
  };
}

interface ProjectGroupedApis {
  [menuName: string]: {
    [projectName: string]: {
      [apiType: string]: ApiItem[];
    };
  };
}

// Helper function to add line numbers to code
const addLineNumbers = (code: string) => {
  const lines = code.split('\n');
  return lines.map((line, index) => ({
    number: index + 1,
    content: line
  }));
};

// Helper function to shorten URL based on screen size
const shortenUrl = (url: string, isMobile: boolean = false) => {
  const maxLength = isMobile ? 28 : 80;
  return url.length > maxLength ? url.slice(0, maxLength) + '...' : url;
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

export default function DocsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [apiData, setApiData] = useState<ApiData | null>(null);
  const [selectedApi, setSelectedApi] = useState<ApiItem | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedSubcategories, setExpandedSubcategories] = useState<Set<string>>(new Set());
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [expandedColumns, setExpandedColumns] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [sampleResponse, setSampleResponse] = useState<any>(null);
  const [loadingResponse, setLoadingResponse] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  // Hook to detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640); // Tailwind's sm breakpoint
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/tl-apis');
      if (response.ok) {
        const data = await response.json();
        setApiData(data);
        
        // Select first API by default and expand necessary categories to show it
        if (data.apis.length > 0) {
          const firstApi = data.apis[0];
          setSelectedApi(firstApi);
          
          // Expand the category containing the first API
          setExpandedCategories(new Set([firstApi.menuName]));
          
          // If it's a Projects category, also expand the project
          if (firstApi.menuName === 'Projects' && firstApi.page) {
            const parts = firstApi.page.split('-');
            const firstPart = parts[0];
            
            // Extract project name using same logic
            let projectName = '';
            if (firstPart === 'sol' && parts.length > 1 && parts[1] === 'strategies') {
              projectName = 'sol-strategies';
            } else {
              projectName = firstPart;
            }
            
            setExpandedProjects(new Set([projectName]));
            setExpandedSubcategories(new Set([`${firstApi.menuName}-${projectName}-${firstApi.pageName}`]));
          } else {
            // For non-Projects categories, expand the subcategory
            setExpandedSubcategories(new Set([`${firstApi.menuName}-${firstApi.pageName}`]));
            setExpandedProjects(new Set());
          }
        } else {
          // Keep all categories collapsed if no APIs
          setExpandedCategories(new Set());
          setExpandedSubcategories(new Set());
          setExpandedProjects(new Set());
        }
      }
    } catch (error) {
      console.error('Error loading API data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSampleResponse = async (api: ApiItem) => {
    setLoadingResponse(true);
    try {
      // Use secure docs preview endpoint that doesn't expose API keys
      const docsPreviewUrl = `${window.location.origin}${api.wrapperUrl.replace('/api/tl/', '/api/docs-preview/')}`;
      const response = await fetch(docsPreviewUrl);
      const data = await response.json();
      
      // Response is already truncated by the docs-preview endpoint
      setSampleResponse(data);
    } catch (error) {
      console.error('Error fetching response:', error);
      setSampleResponse({ 
        error: 'Failed to fetch response', 
        details: error instanceof Error ? error.message : 'Unknown error',
        _docs_preview: true
      });
    } finally {
      setLoadingResponse(false);
    }
  };

  useEffect(() => {
    if (selectedApi) {
      setSampleResponse(null);
      setCopied(false);
      setExpandedColumns(new Set());
      fetchSampleResponse(selectedApi);
    }
  }, [selectedApi?.id]);

  // Group APIs by category and subcategory (with special handling for Projects)
  const groupedApis: GroupedApis | ProjectGroupedApis = apiData?.apis.reduce((acc: any, api) => {
    if (!acc[api.menuName]) {
      acc[api.menuName] = {};
    }
    
    // Special handling for Projects category - group by project name first
    if (api.menuName === 'Projects' && api.page) {
      // Extract core project name using same logic as dashboard
      const parts = api.page.split('-');
      const firstPart = parts[0];
      
      // Special case: sol-strategies should be kept together
      let projectName = '';
      if (firstPart === 'sol' && parts.length > 1 && parts[1] === 'strategies') {
        projectName = 'sol-strategies';
      } else {
        // For all other cases, just take the first part (core project name)
        projectName = firstPart;
      }
      
      // Group by project name, then by API type (pageName)
      if (!acc[api.menuName][projectName]) {
        acc[api.menuName][projectName] = {};
      }
      if (!acc[api.menuName][projectName][api.pageName]) {
        acc[api.menuName][projectName][api.pageName] = [];
      }
      acc[api.menuName][projectName][api.pageName].push(api);
    } else {
      // Regular two-level grouping for other categories
      if (!acc[api.menuName][api.pageName]) {
        acc[api.menuName][api.pageName] = [];
      }
      acc[api.menuName][api.pageName].push(api);
    }
    
    return acc;
  }, {}) || {};

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const toggleSubcategory = (subcategory: string) => {
    setExpandedSubcategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(subcategory)) {
        newSet.delete(subcategory);
      } else {
        newSet.add(subcategory);
      }
      return newSet;
    });
  };

  const toggleProject = (project: string) => {
    setExpandedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(project)) {
        newSet.delete(project);
      } else {
        newSet.add(project);
      }
      return newSet;
    });
  };

  const toggleColumnExpansion = (index: number) => {
    setExpandedColumns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleCopyEndpoint = async () => {
    const fullEndpointUrl = selectedApi 
      ? `${window.location.origin}${selectedApi.wrapperUrl}?api_key=YOUR_API_KEY`
      : '';
    
    if (fullEndpointUrl) {
      await copyToClipboard(fullEndpointUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const fullEndpointUrl = selectedApi 
    ? `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}${selectedApi.wrapperUrl}?api_key=YOUR_API_KEY`
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <MainLayout 
      title="API Documentation"
      isDocsMode={true}
      groupedApis={groupedApis}
      selectedApi={selectedApi}
      expandedCategories={expandedCategories}
      expandedSubcategories={expandedSubcategories}
      expandedProjects={expandedProjects}
      onApiSelect={setSelectedApi}
      onToggleCategory={toggleCategory}
      onToggleSubcategory={toggleSubcategory}
      onToggleProject={toggleProject}
    >
          {selectedApi ? (
        <div className="max-w-7xl mx-auto">
              {/* API Header */}
              <div className="mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                  <h1 className="text-lg sm:text-md font-semibold text-gray-900">{selectedApi.title}</h1>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-sm text-xs font-medium bg-green-100 text-green-800 w-fit">
                    {selectedApi.method}
                  </span>
                </div>
                {selectedApi.subtitle && (
                  <p className="text-sm text-gray-600 mb-3">{selectedApi.subtitle}</p>
                )}
              </div>

              {/* API Description */}
              {selectedApi.description && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-sm">{selectedApi.description}</p>
                </div>
              )}

              {/* Endpoint URL */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">API Endpoint</h4>
                <div className="relative">
                  <code className="block bg-gray-900 text-green-400 p-3 rounded-sm text-sm font-mono overflow-x-auto">
                    {shortenUrl(fullEndpointUrl, isMobile)}
                  </code>
                  <button
                    onClick={handleCopyEndpoint}
                    className="absolute top-2 right-2 bg-gray-800 border-gray-600 hover:bg-gray-700 text-gray-300 px-2 py-1 rounded-sm text-xs transition-colors flex items-center"
                  >
                    {copied ? (
                      <>
                        <CheckIcon className="h-4 w-4 mr-1 text-green-400" />
                        <span className="text-green-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <DocumentDuplicateIcon className="h-4 w-4 mr-1" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Horizontal Line */}
              <hr className="border-gray-200 mb-6" />

                              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Response Schema */}
                {selectedApi.responseColumns && selectedApi.responseColumns.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm text-gray-600 mb-2">Response Columns</h4>
                    <div className="border border-gray-200 rounded-sm overflow-hidden">
                      <div className="divide-y divide-gray-200">
                        {selectedApi.responseColumns.map((column, index) => (
                          <div key={index} className="bg-white">
                            <button
                              onClick={() => toggleColumnExpansion(index)}
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
                                    expandedColumns.has(index) ? 'rotate-180' : ''
                                  }`}
                                />
                              </div>
                            </button>
                            
                            {expandedColumns.has(index) && (
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

                {/* Usage Examples and Sample Response */}
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
                                          <div className="border border-gray-200 rounded-sm overflow-hidden h-64 sm:h-80">
                      <div className="bg-white h-full flex flex-col">
                        <div className="flex-1 overflow-hidden">
                          {sampleResponse ? (
                            (() => {
                              const jsonString = JSON.stringify(sampleResponse, null, 2);
                              const numberedLines = addLineNumbers(jsonString);
                              return (
                                <div className="flex text-xs sm:text-sm font-mono h-full">
                                  {/* Line Numbers - Hidden on mobile */}
                                  <div className="hidden sm:block bg-gray-50 text-gray-500 px-0 py-4 select-none border-r border-gray-200 min-w-[2rem] overflow-y-auto">
                                    {numberedLines.map((line) => (
                                      <div key={line.number} className="text-center leading-6">
                                        {line.number}
                                      </div>
                                    ))}
                                  </div>
                                  {/* JSON Content */}
                                  <div className="flex-1 bg-white text-gray-800 px-2 sm:px-4 py-4 overflow-auto">
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
                            <div className="flex text-xs sm:text-sm font-mono h-full">
                              <div className="hidden sm:block bg-gray-50 text-gray-500 px-0 py-4 select-none border-r border-gray-200 min-w-[2rem]">
                                <div className="text-center leading-6">1</div>
                              </div>
                              <div className="flex-1 bg-white text-gray-800 px-2 sm:px-4 py-4">
                                <div className="whitespace-pre leading-6">Loading response...</div>
                              </div>
                            </div>
                          )}
                        </div>
                        {sampleResponse && !sampleResponse.error && (
                          <div className="text-xs text-gray-600 px-2 sm:px-4 py-2 border-t border-gray-200 bg-gray-50">
                            {sampleResponse._docs_preview ? 
                              'Note: Actual API responses may vary and contain more complete data.' :
                              'Note: Response has been truncated for display. The actual API returns complete data.'
                            }
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Select an API</h2>
                <p className="text-gray-600">Choose an API from the sidebar to view its documentation</p>
              </div>
            </div>
          )}
    </MainLayout>
  );
}
