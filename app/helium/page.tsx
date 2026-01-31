'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MagnifyingGlassIcon, DocumentDuplicateIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import MainLayout from '@/components/Layout/MainLayout';
import Button from '@/components/UI/Button';
import ApiDetailsModal from '@/components/UI/ApiDetailsModal';

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

export default function HeliumPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApiKey, setSelectedApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [apiData, setApiData] = useState<ApiData | null>(null);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [selectedApi, setSelectedApi] = useState<ApiItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showApiKeyDropdown, setShowApiKeyDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    loadData();
  }, []);

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
      
      const response = await fetch('/api/tl-apis');
      if (response.ok) {
        const data = await response.json();
        setApiData(data);
      }

      const keysResponse = await fetch('/api/keys');
      if (keysResponse.ok) {
        const keysData = await keysResponse.json();
        const keys = Array.isArray(keysData) ? keysData : [];
        setApiKeys(keys);
        if (keys.length > 0) {
          setSelectedApiKey(keys[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setApiData(null);
      setApiKeys([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyEndpoint = (api: ApiItem) => {
    const selectedKey = Array.isArray(apiKeys) ? apiKeys.find(key => key.id === selectedApiKey) : null;
    if (!selectedKey) {
      alert('Please select an API key first');
      return;
    }
    setSelectedApi(api);
    setIsModalOpen(true);
  };

  // Helium APIs are filtered by menuName === 'Helium'
  const availableApis = (apiData?.apis || []).filter(api => api.menuName === 'Helium');

  const filteredApis = availableApis.filter(api => {
    const matchesSearch = !searchTerm || (
      api.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      api.subtitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      api.menuName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      api.pageName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    return matchesSearch;
  });

  const totalPages = Math.ceil(filteredApis.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedApis = filteredApis.slice(startIndex, endIndex);

  const tabs = [
    { id: 'research', label: 'Research Tool APIs' },
    { id: 'trading', label: 'Trading APIs' },
    { id: 'helium', label: 'Helium APIs' },
  ];

  const handleTabChange = (tabId: string) => {
    if (tabId === 'research') {
      router.push('/research');
    } else if (tabId === 'trading') {
      router.push('/trading');
    } else if (tabId === 'helium') {
      router.push('/helium');
    }
  };

  return (
    <MainLayout 
      tabs={tabs}
      activeTab="helium"
      onTabChange={handleTabChange}
    >
      <div className="space-y-6">
        {/* Search and Filters */}
        <div className="bg-white rounded-sm justify border border-gray-200 py-1 pl-2 pr-6">
          <div className="space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              <div className="relative flex-1 lg:max-w-none">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search Helium APIs by title, description..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10 w-full text-sm rounded-sm border-black py-2 focus:outline-none"
                />
              </div>
              
              <div className="flex flex-wrap gap-4 lg:flex-nowrap lg:ml-auto lg:flex-shrink-0">
                <div className="w-full sm:w-[200px] lg:w-[200px] relative dropdown-container">
                  <div className="flex bg-white border border-gray-200 rounded-sm transition-shadow duration-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-r border-gray-200 px-3 py-2 flex items-center">
                      <span className="text-xs font-normal text-gray-500 tracking-wider">KEY</span>
                    </div>
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

        {/* API Endpoints List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
              <p className="mt-2 text-gray-500">Loading Helium APIs...</p>
            </div>
          ) : filteredApis.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {apiData ? 'No Helium APIs found matching your search.' : 'Failed to load Helium APIs.'}
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