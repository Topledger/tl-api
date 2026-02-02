'use client';

import { useState, useEffect, Suspense } from 'react';
import { ChevronDownIcon, ChevronRightIcon, DocumentDuplicateIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useRouter, useSearchParams } from 'next/navigation';
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

function DocsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [apiData, setApiData] = useState<ApiData | null>(null);
  const [selectedApi, setSelectedApi] = useState<ApiItem | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedSubcategories, setExpandedSubcategories] = useState<Set<string>>(new Set());
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [expandedColumns, setExpandedColumns] = useState<Set<number>>(new Set());
  const [paginationExpanded, setPaginationExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sampleResponse, setSampleResponse] = useState<any>(null);
  const [loadingResponse, setLoadingResponse] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedResponse, setCopiedResponse] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [selectedApiKey, setSelectedApiKey] = useState('');
  const [showApiKeyDropdown, setShowApiKeyDropdown] = useState(false);

  // Generate URL-friendly API identifier based on name
  const generateApiId = (api: ApiItem): string => {
    const menuName = api.menuName.toLowerCase().replace(/\s+/g, '_');
    let title = api.title.toLowerCase();
    
    // Remove menu name from title if it's already included (e.g., "Helium IoT..." -> "IoT...")
    const menuWords = api.menuName.toLowerCase().split(/\s+/);
    menuWords.forEach(word => {
      if (word.length > 2) { // Only remove meaningful words, not short ones like "L1"
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        title = title.replace(regex, '').trim();
      }
    });
    
    // Clean up the title
    title = title
      .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
      .replace(/\s+/g, '_')     // Replace spaces with underscores
      .replace(/_+/g, '_')      // Replace multiple underscores with single
      .replace(/^_|_$/g, '');   // Remove leading/trailing underscores
    
    // Handle edge case where title becomes empty after cleanup
    if (!title) {
      title = api.pageName.toLowerCase().replace(/\s+/g, '_');
    }
    
    return `${menuName}_${title}`;
  };

  // Handle API selection with URL update
  const handleApiSelect = (api: ApiItem) => {
    setSelectedApi(api);
    const apiId = generateApiId(api);
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('api', apiId);
    router.push(newUrl.pathname + newUrl.search, { scroll: false });
  };

  // Find API by URL-friendly ID
  const findApiById = (apiId: string): ApiItem | null => {
    if (!apiData) return null;
    return apiData.apis.find(api => generateApiId(api) === apiId) || null;
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle URL parameters on page load and when URL changes
  useEffect(() => {
    if (apiData && apiData.apis.length > 0) {
      const apiParam = searchParams?.get('api');
      
      if (apiParam) {
        // Try to find API by URL parameter
        const apiFromUrl = findApiById(apiParam);
        if (apiFromUrl) {
          setSelectedApi(apiFromUrl);
          // Expand the category containing this API
          setExpandedCategories(prev => new Set(prev).add(apiFromUrl.menuName));
          
          // If it's a Projects category, also expand the project
          if (apiFromUrl.menuName === 'Projects' && apiFromUrl.page) {
            const parts = apiFromUrl.page.split('-');
            const projectName = parts[0] === 'sol' && parts[1] === 'strategies' ? 'sol-strategies' : parts[0];
            setExpandedProjects(prev => new Set(prev).add(projectName));
          } else {
            setExpandedSubcategories(prev => new Set(prev).add(apiFromUrl.pageName));
          }
          return;
        }
      }
      
      // If no valid API from URL, select first API and update URL
      const firstApi = apiData.apis[0];
      if (firstApi && !selectedApi) {
        handleApiSelect(firstApi);
      }
    }
  }, [apiData, searchParams]);

  // Close API key dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target as Element).closest('.dropdown-container')) {
        setShowApiKeyDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
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
      }

      // Load API keys from our API
      const keysResponse = await fetch('/api/keys');
      if (keysResponse.ok) {
        const keysData = await keysResponse.json();
        const keys = Array.isArray(keysData) ? keysData : [];
        setApiKeys(keys);

        // Set first API key as default
        if (keys.length > 0) {
          setSelectedApiKey(keys[0].id);
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
      let docsPreviewUrl = '';
      let requestMethod = 'GET';
      let requestBody: any = null;

      // Handle different API types with appropriate transformations
      if (api.wrapperUrl.includes('/api/tl/')) {
        // Research Tool APIs - Standard GET transformation
        docsPreviewUrl = `${window.location.origin}${api.wrapperUrl.replace('/api/tl/', '/api/docs-preview/')}`;
      } else if (api.wrapperUrl.includes('/api/helium/oracle/')) {
        // Helium Oracle APIs - POST requests with body
        docsPreviewUrl = `${window.location.origin}${api.wrapperUrl.replace('/api/helium/oracle/', '/api/docs-preview/helium/oracle/')}`;
        requestMethod = 'POST';
        requestBody = {
          parameters: {
            block_date: '2026-01-01'
          }
        };
      } else if (api.wrapperUrl.includes('/api/helium/queries/')) {
        // Helium Query APIs - POST requests with body  
        docsPreviewUrl = `${window.location.origin}${api.wrapperUrl.replace('/api/helium/queries/', '/api/docs-preview/helium/queries/')}`;
        requestMethod = 'POST';
        requestBody = {
          parameters: {
            start_date: '2022-08-04',
            end_date: '2022-08-08'
          }
        };
      } else if (api.wrapperUrl.includes('/api/')) {
        // Trading APIs and others - Fallback to general docs-preview
        const apiPath = api.wrapperUrl.replace('/api/', '');
        docsPreviewUrl = `${window.location.origin}/api/docs-preview/${apiPath}`;
      } else {
        throw new Error(`Unsupported API type: ${api.wrapperUrl}`);
      }

      // Prepare request options
      const requestOptions: RequestInit = {
        method: requestMethod,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (requestBody) {
        requestOptions.body = JSON.stringify(requestBody);
      }

      console.log(`📖 Fetching docs preview: ${requestMethod} ${docsPreviewUrl}`);
      
      const response = await fetch(docsPreviewUrl, requestOptions);
      
      // Check if response is ok
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Docs preview error: ${response.status} ${response.statusText}`, errorText);
        
        setSampleResponse({ 
          error: `Preview unavailable: ${response.status} ${response.statusText}`,
          details: errorText || 'No additional details available',
          _docs_preview: true,
          _note: 'This API may require authentication or specific parameters.'
        });
        return;
      }

      // Check if response has content
      const responseText = await response.text();
      if (!responseText.trim()) {
        console.error('❌ Empty response from docs preview');
        setSampleResponse({
          error: 'Preview unavailable: Empty response',
          details: 'The preview endpoint returned no content',
          _docs_preview: true
        });
        return;
      }

      // Parse JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError);
        setSampleResponse({
          error: 'Preview unavailable: Invalid JSON response',
          details: parseError instanceof Error ? parseError.message : 'Unknown parsing error',
          response_preview: responseText.substring(0, 200) + (responseText.length > 200 ? '...' : ''),
          _docs_preview: true
        });
        return;
      }
      
      // Response is already truncated by the docs-preview endpoint
      setSampleResponse(data);
      
    } catch (error) {
      console.error('❌ Error fetching response:', error);
      setSampleResponse({ 
        error: 'Failed to fetch response', 
        details: error instanceof Error ? error.message : 'Unknown error',
        _docs_preview: true,
        _note: 'Unable to load preview. This may be due to network issues or API configuration.'
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
      setPaginationExpanded(false);
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
    if (fullEndpointUrl) {
      await copyToClipboard(fullEndpointUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Get the selected API key
  const selectedKey = Array.isArray(apiKeys) ? apiKeys.find(key => key.id === selectedApiKey) : null;
  const apiKeyValue = selectedKey?.key || 'YOUR_API_KEY';

  const fullEndpointUrl = selectedApi 
    ? `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}${selectedApi.wrapperUrl}?api_key=${apiKeyValue}`
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
      onApiSelect={handleApiSelect}
      onToggleCategory={toggleCategory}
      onToggleSubcategory={toggleSubcategory}
      onToggleProject={toggleProject}
    >
          {selectedApi ? (
        <div className="max-w-7xl mx-auto">
              {/* API Header */}
              <div className="mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h1 className="text-lg sm:text-md font-semibold text-gray-900">{selectedApi.title}</h1>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-sm text-xs font-medium bg-green-100 text-green-800 w-fit">
                        {selectedApi.method}
                      </span>
                    </div>
                    {selectedApi.subtitle && (
                      <p className="text-sm text-gray-600">{selectedApi.subtitle}</p>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    {!session ? (
                                <button
                        onClick={() => {
                          // Store the current URL to redirect back after login
                          const currentUrl = window.location.pathname + window.location.search;
                          sessionStorage.setItem('redirectAfterLogin', currentUrl);
                          // Redirect to login with callback to current docs page (preserving API parameter)
                          const callbackUrl = encodeURIComponent(currentUrl);
                          router.push(`/auth/signin?callbackUrl=${callbackUrl}`);
                        }}
                        className="px-4 py-2 text-sm sm:border sm:bg-white sm:border-gray-200 font-medium text-gray-600 hover:text-white hover:bg-gray-900 transition-colors duration-200"
                                >
                        Get API Key →
                      </button>
                    ) : (
                      <div className="w-[200px] relative dropdown-container">
                        <div className="flex bg-white border border-gray-200 rounded-sm transition-shadow duration-200 overflow-hidden">
                          {/* Left section - Key label */}
                          <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-r border-gray-200 px-3 py-2 flex items-center">
                            <span className="text-xs font-normal text-gray-500 tracking-wider">KEY</span>
                          </div>
                          {/* Right section - Dropdown area */}
                                          <button
                            type="button"
                            className="flex-1 py-2 px-3 text-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-inset flex items-center justify-between group"
                            onClick={() => setShowApiKeyDropdown(!showApiKeyDropdown)}
                          >
                            <span className={`truncate ${!selectedApiKey ? 'text-gray-400' : ''}`}>
                              {selectedApiKey 
                                ? Array.isArray(apiKeys) && apiKeys.find(key => key.id === selectedApiKey)?.name 
                                : 'Select API key'
                              }
                            </span>
                            <ChevronDownIcon className={`h-4 w-4 text-gray-400 ml-2 flex-shrink-0 transition-transform duration-200 ${showApiKeyDropdown ? 'rotate-180' : ''} group-hover:text-gray-600`} />
                                          </button>
                        </div>
                        
                        {showApiKeyDropdown && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-sm shadow-md border border-gray-200 py-1 focus:outline-none z-50 max-h-60 overflow-auto">
                            {Array.isArray(apiKeys) && apiKeys.map((key) => (
                                                <button
                                key={key.id}
                                type="button"
                                className="block w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-150"
                                onClick={() => {
                                  setSelectedApiKey(key.id);
                                  setShowApiKeyDropdown(false);
                                }}
                              >
                                <span className="font-medium">{key.name}</span>
                                {key.description && (
                                  <span className="block text-xs text-gray-500 mt-0.5">{key.description}</span>
                                )}
                                      </button>
                                    ))}
                                  </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
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
                  {session && (
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
                  )}
                </div>
              </div>

              

              {/* Pagination Documentation - Show for APIs that support large datasets */}
              {(selectedApi.menuName === 'Helium' || selectedApi.path.includes('/demo-large-dataset') || 
                selectedApi.title.toLowerCase().includes('large') || selectedApi.subtitle.toLowerCase().includes('pagination')) && (
                <div className="mb-6">
                  <div className="bg-white border border-gray-200 rounded-sm p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-700">Pagination:</span>
                          <div className="flex space-x-2">
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">offset</code>
                          </div>
                        </div>
                        <span className="text-xs text-gray-600">For large datasets (&gt;10K rows)</span>
                      </div>
                      <button
                        onClick={() => setPaginationExpanded(!paginationExpanded)}
                        className="flex items-center text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
                      >
                        {paginationExpanded ? 'Hide details' : 'Show details'}
                        <ChevronDownIcon 
                          className={`h-3 w-3 ml-1 transition-transform duration-200 ${
                            paginationExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                    </div>
                    
                    {paginationExpanded && (
                      <div className="mt-4 pt-3 border-t border-gray-200 space-y-4">
                        <div>
                          <p className="text-sm text-gray-700 font-medium mb-2">How it works:</p>
                          <p className="text-sm text-gray-600">
                            This API automatically handles large datasets. Small datasets return all data immediately. 
                            For datasets with more than 10,000 rows, pagination is automatically applied.
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Parameters:</p>
                          <div className="bg-white border border-gray-200 rounded p-3 space-y-2">
                            <div className="flex justify-between items-center">
                              <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">offset</code>
                              <span className="text-xs text-gray-500">Page number (1, 2, 3...)</span>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Usage Examples:</p>
                          <div className="bg-white border border-gray-200 rounded p-3 space-y-2 font-mono text-xs">
                            <div className="text-gray-600">
                              <span className="text-blue-600"># First page (default)</span><br/>
                              <span className="text-gray-800">?api_key=YOUR_KEY</span>
                            </div>
                            <div className="text-gray-600">
                              <span className="text-blue-600"># Second page</span><br/>
                              <span className="text-gray-800">?offset=2&api_key=YOUR_KEY</span>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Response Format:</p>
                          <div className="bg-white border border-gray-200 rounded p-3">
                            <pre className="text-xs text-gray-700 overflow-x-auto">
{`{
  "data": [...],           // Your actual data
  "total_records": 25000,  // Total available records
  "returned_records": 10000,
  "is_complete": false,    // true if all data returned
  "pagination": {
    "current_page": 1,
    "total_pages": 3,
    "has_next_page": true,
    "next_page": 2
  },
  "navigation": {
    "next_page": "?offset=2&api_key=YOUR_KEY"
  }
}`}
                            </pre>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

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

export default function DocsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading API documentation...</p>
        </div>
      </div>
    }>
      <DocsPageContent />
    </Suspense>
  );
}
