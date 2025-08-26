'use client';

import { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, DocumentDuplicateIcon, FunnelIcon } from '@heroicons/react/24/outline';
import MainLayout from '@/components/Layout/MainLayout';
import Button from '@/components/UI/Button';
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

  useEffect(() => {
    loadData();
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

  // Get available page names for selected menu (for dependent filtering)
  const availablePageNames = selectedMenuName 
    ? [...new Set(apiData?.apis?.filter(api => api.menuName === selectedMenuName).map(api => api.pageName) || [])].sort()
    : pageNames;

  return (
    <MainLayout title="Top Ledger APIs">
      <div className="space-y-6">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="space-y-4">
            
            
            {/* All Filters in One Line */}
            <div className="flex flex-wrap items-center gap-4">
              {/* Search Bar */}
            <div className="relative max-w-[500px] flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search APIs by title, description, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-gray-300 focus:ring-gray-500"
              />
            </div>
              
              <div className="flex flex-wrap gap-4 flex-1">
                <div className="max-w-[200px] flex-1">
                  <select
                    value={selectedMenuName}
                    onChange={(e) => {
                      setSelectedMenuName(e.target.value);
                      setSelectedPageName(''); // Reset page filter when menu changes
                    }}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-gray-300 focus:ring-gray-500"
                  >
                    <option value="">All Categories</option>
                    {menuNames.map((menuName) => (
                      <option key={menuName} value={menuName}>
                        {menuName}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="max-w-[200px] flex-1">
                  <select
                    value={selectedPageName}
                    onChange={(e) => setSelectedPageName(e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-gray-300 focus:ring-gray-500"
                    disabled={!!selectedMenuName && availablePageNames.length === 0}
                  >
                    <option value="">All Pages</option>
                    {availablePageNames.map((pageName) => (
                      <option key={pageName} value={pageName}>
                        {pageName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="max-w-[200px] flex-1">
                  <select
                    value={selectedApiKey}
                    onChange={(e) => setSelectedApiKey(e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-gray-300 focus:ring-gray-500"
                  >
                    <option value="">Use Default API Key</option>
                    {Array.isArray(apiKeys) && apiKeys.map((key) => (
                      <option key={key.id} value={key.id}>
                        {key.name}
                      </option>
                    ))}
                  </select>
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
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading APIs...</p>
            </div>
          ) : filteredApis.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {apiData ? 'No APIs found matching your filters.' : 'Failed to load APIs.'}
              </p>
            </div>
          ) : (
            filteredApis.map((api, index) => (
              <div
                key={`${api.id}-${index}`}
                className="bg-white rounded-lg shadow-sm border border-gray-200 py-4 px-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start space-x-3 mb-0">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {api.title}
                        </h3>
                        
                      </div>
                    </div>
                    {api.subtitle && (
                      <p className="text-gray-600 mb-3">{api.subtitle}</p>
                    )}
                    
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
