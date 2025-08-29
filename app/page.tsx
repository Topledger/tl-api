'use client';

import { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, DocumentDuplicateIcon, FunnelIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import MainLayout from '@/components/Layout/MainLayout';
import Button from '@/components/UI/Button';
import Dropdown from '@/components/UI/Dropdown';
import ApiDetailsModal from '@/components/UI/ApiDetailsModal';
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

interface ApiData {
  totalApis: number;
  extractedAt: string;
  apis: ApiItem[];
}

export default function ExplorePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMenuName, setSelectedMenuName] = useState('');
  const [selectedPageName, setSelectedPageName] = useState('');
  const [selectedApiKey, setSelectedApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [apiData, setApiData] = useState<ApiData | null>(null);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [menuNames, setMenuNames] = useState<string[]>([]);
  const [pageNames, setPageNames] = useState<string[]>([]);
  const [selectedApi, setSelectedApi] = useState<ApiItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showApiKeyDropdown, setShowApiKeyDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    loadData();
  }, []);

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

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Load wrapped APIs from our new endpoint
      const response = await fetch('/api/tl-apis');
      if (response.ok) {
        const data = await response.json();
        setApiData(data);

        // Extract unique menu names and page names
        const uniqueMenuNames = [...new Set(data.apis.map((api: any) => api.menuName as string))].sort();
        const uniquePageNames = [...new Set(data.apis.map((api: any) => api.pageName as string))].sort();
        
        setMenuNames(uniqueMenuNames as string[]);
        setPageNames(uniquePageNames as string[]);
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
      console.error('Error loading data:', error);
      setApiData(null);
      setApiKeys([]);
      setMenuNames([]);
      setPageNames([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyEndpoint = (api: ApiItem) => {
    // Check if API key is selected
    const selectedKey = Array.isArray(apiKeys) ? apiKeys.find(key => key.id === selectedApiKey) : null;
    if (!selectedKey) {
      alert('Please select an API key first');
      return;
    }

    // Open modal with API details
    setSelectedApi(api);
    setIsModalOpen(true);
  };

  const handleViewDetails = (api: ApiItem) => {
    // For now, just show more info or could navigate to a dedicated page
    alert(`API: ${api.title}\nCategory: ${api.menuName} > ${api.pageName}\nWrapper URL: ${api.wrapperUrl}\nOriginal URL: ${api.originalUrl}`);
  };

  // Filter APIs based on search term and selected categories
  const filteredApis = apiData?.apis ? apiData.apis.filter(api => {
    const matchesSearch = !searchTerm || (
      api.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      api.subtitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      api.menuName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      api.pageName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const matchesMenuName = !selectedMenuName || api.menuName === selectedMenuName;
    const matchesPageName = !selectedPageName || api.pageName === selectedPageName;
    
    return matchesSearch && matchesMenuName && matchesPageName;
  }) : [];

  // Pagination logic
  const totalPages = Math.ceil(filteredApis.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedApis = filteredApis.slice(startIndex, endIndex);

  // Get available page names for selected menu (for dependent filtering)
  const availablePageNames = selectedMenuName 
    ? [...new Set(apiData?.apis?.filter(api => api.menuName === selectedMenuName).map(api => api.pageName) || [])].sort()
    : pageNames;

  // Prepare dropdown options
  const categoryOptions = [
    { value: '', label: 'All Categories' },
    ...menuNames.map(name => ({ value: name, label: name }))
  ];

  const pageOptions = [
    { value: '', label: 'All Subcategories' },
    ...availablePageNames.map(name => ({ value: name, label: name }))
  ];

  const apiKeyOptions = [
    { value: '', label: 'Use Default API Key' },
    ...(Array.isArray(apiKeys) ? apiKeys.map(key => ({ value: key.id, label: key.name })) : [])
  ];

  return (
    <MainLayout title="Top Ledger APIs">
      <div className="space-y-6">
        {/* Search and Filters */}
        <div className="bg-white rounded-sm justify border border-gray-200 py-1 pl-2 pr-6">
          <div className="space-y-4">
            
            
            {/* All Filters in One Line */}
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              {/* Search Bar - expands to fill available space */}
              <div className="relative flex-1 lg:max-w-none">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search APIs by title, description, or category..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1); // Reset to first page when searching
                  }}
                  className="pl-10 w-full text-sm rounded-sm border-black py-2 focus:outline-none"
                />
              </div>
              
              {/* Dropdowns Container - shifts right on desktop */}
              <div className="flex flex-wrap gap-4 lg:flex-nowrap lg:ml-auto lg:flex-shrink-0">
                <Dropdown
                  options={categoryOptions}
                  value={selectedMenuName}
                  onChange={(value) => {
                    setSelectedMenuName(value);
                    setSelectedPageName(''); // Reset page filter when menu changes
                    setCurrentPage(1); // Reset to first page
                  }}
                  placeholder="All Categories"
                  className="w-full sm:w-[200px] lg:w-[200px]"
                />
                
                <Dropdown
                  options={pageOptions}
                  value={selectedPageName}
                  onChange={(value) => {
                    setSelectedPageName(value);
                    setCurrentPage(1); // Reset to first page
                  }}
                  placeholder={!selectedMenuName ? "Select Category First" : "All Subcategories"}
                  disabled={!selectedMenuName}
                  className="w-full sm:w-[200px] lg:w-[200px]"
                />

                <div className="w-full sm:w-[200px] lg:w-[200px] relative dropdown-container">
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
              </div>
            </div>
          </div>
        </div>

        {/* API Statistics 
        {apiData && (
          <div className="bg-gradient-to-r from-gray-50 to-indigo-50 rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Top Ledger APIs</h2>
                <p className="text-sm text-gray-600">Comprehensive analytics and data endpoints</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-600">{filteredApis.length}</div>
                <div className="text-sm text-gray-500">of {apiData.totalApis} APIs</div>
              </div>
            </div>
          </div>
        )}*/}

        {/* API Endpoints List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
              <p className="mt-2 text-gray-500">Loading APIs...</p>
            </div>
          ) : filteredApis.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {apiData ? 'No APIs found matching your filters.' : 'Failed to load APIs.'}
              </p>
            </div>
          ) : (
            paginatedApis.map((api, index) => (
              <div
                key={`${api.id}-${index}`}
                className="bg-white rounded-sm border border-gray-200 py-4 px-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-800 mb-[0.2rem]">
                          {api.title}
                        </h3>
                        {api.subtitle && (
                          <p className="text-gray-500 text-sm">{api.subtitle}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyEndpoint(api)}
                      disabled={!selectedApiKey}
                    >
                      <DocumentDuplicateIcon className="h-4 w-4 mr-1" />
                      View API Details
                    </Button>
                    {/* <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleViewDetails(api)}
                    >
                      View Details
                    </Button> */}
                  </div>
                </div>
              </div>
            ))
          )}
          
          {/* Pagination Controls */}
          {filteredApis.length > itemsPerPage && (
            <div className="flex items-center justify-between py-4">
              <div className="text-sm text-gray-500">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredApis.length)} of {filteredApis.length} results
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
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
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
    
    {/* API Details Modal */}
    <ApiDetailsModal
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      api={selectedApi}
      selectedApiKey={Array.isArray(apiKeys) ? apiKeys.find(key => key.id === selectedApiKey) : null}
    />
    </MainLayout>
  );
}
