'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  HomeIcon, 
  KeyIcon, 
  ChartBarIcon, 
  CogIcon, 
  DocumentTextIcon,
  XMarkIcon,
  CurrencyDollarIcon,
  ChevronDownIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';

const navigation = [
  { name: 'Explore APIs', href: '/dashboard', icon: HomeIcon },
  { name: 'API Keys', href: '/keys', icon: KeyIcon },
  { name: 'Usage', href: '/usage', icon: ChartBarIcon },
  //{ name: 'Documentation', href: '/docs', icon: DocumentTextIcon },
  //{ name: 'Pricing', href: '/plans', icon: CurrencyDollarIcon },
  //{ name: 'Settings', href: '/settings', icon: CogIcon },
];

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

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  // Docs-specific props
  isDocsMode?: boolean;
  groupedApis?: GroupedApis | ProjectGroupedApis;
  selectedApi?: ApiItem | null;
  expandedCategories?: Set<string>;
  expandedSubcategories?: Set<string>;
  expandedProjects?: Set<string>;
  onApiSelect?: (api: ApiItem) => void;
  onToggleCategory?: (category: string) => void;
  onToggleSubcategory?: (subcategory: string) => void;
  onToggleProject?: (project: string) => void;
}

export default function Sidebar({ 
  isOpen, 
  onClose,
  isDocsMode = false,
  groupedApis,
  selectedApi,
  expandedCategories,
  expandedSubcategories,
  expandedProjects,
  onApiSelect,
  onToggleCategory,
  onToggleSubcategory,
  onToggleProject
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const handleLogoClick = () => {
    session ? router.push('/dashboard') : router.push('/');
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 lg:hidden z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:flex lg:flex-col lg:shadow-none lg:sticky lg:top-0 lg:h-screen",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center px-4 py-4 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center">
              <button
                onClick={handleLogoClick}
                className="focus:outline-none rounded-sm transition-opacity hover:opacity-80"
              >
                <img 
                  src="https://topledger.xyz/assets/images/logo/topledger-full.svg?imwidth=384"
                  alt="Top Ledger Logo"
                  className="h-8 w-auto"
                />
              </button>
              
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-1 rounded-md text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {isDocsMode ? (
              // Docs API Navigation
              <div className="px-3 py-4">
                <h2 className="text-xs font-medium text-gray-500 mb-3 tracking-wide">API Reference</h2>
                
                {/* API Navigation Tree */}
                <div className="space-y-0.5">
                  {groupedApis && Object.entries(groupedApis as any).map(([categoryName, subcategories]: [string, any]) => {
                    // Calculate total API count for the category
                    const totalCount = categoryName === 'Projects' 
                      ? Object.values(subcategories as any).reduce((total: number, projects: any) => 
                          total + Object.values(projects as any).reduce((subTotal: number, apis: any) => subTotal + (apis as any[]).length, 0), 0)
                      : Object.values(subcategories as any).reduce((total: number, apis: any) => total + (apis as any[]).length, 0);

                    return (
                      <div key={categoryName}>
                        <button
                          onClick={() => onToggleCategory?.(categoryName)}
                          className="flex items-center w-full text-left px-2 py-1.5 text-xs font-medium text-gray-700 hover:bg-blue-50/50 hover:text-gray-900 transition-colors rounded-sm"
                        >
                          {expandedCategories?.has(categoryName) ? (
                            <ChevronDownIcon className="h-3 w-3 mr-1.5 text-gray-500" />
                          ) : (
                            <ChevronRightIcon className="h-3 w-3 mr-1.5 text-gray-500" />
                          )}
                          {categoryName}
                          <span className="ml-auto text-xs text-gray-400 font-normal">
                            {totalCount}
                          </span>
                        </button>
                        
                        {expandedCategories?.has(categoryName) && (
                          <div className="ml-4 mt-0.5 space-y-0.5">
                            {categoryName === 'Projects' ? (
                              // Three-level structure for Projects: Projects > Project Name > API Type > APIs
                              Object.entries(subcategories as any).map(([projectName, apiTypes]: [string, any]) => {
                                const projectCount = Object.values(apiTypes as any).reduce((total: number, apis: any) => total + (apis as any[]).length, 0);
                                
                                return (
                                  <div key={projectName}>
                                    <button
                                      onClick={() => onToggleProject?.(projectName)}
                                      className="flex items-center w-full text-left py-1 px-2 text-xs text-gray-600 hover:bg-blue-50/50 hover:text-gray-900 transition-colors rounded-sm"
                                    >
                                      {expandedProjects?.has(projectName) ? (
                                        <ChevronDownIcon className="h-3 w-3 mr-1.5 text-gray-400" />
                                      ) : (
                                        <ChevronRightIcon className="h-3 w-3 mr-1.5 text-gray-400" />
                                      )}
                                      {projectName.charAt(0).toUpperCase() + projectName.slice(1)}
                                      <span className="ml-auto text-xs text-gray-400 font-normal">{projectCount}</span>
                                    </button>
                                    
                                    {expandedProjects?.has(projectName) && (
                                      <div className="ml-4 mt-0.5 space-y-0.5">
                                        {Object.entries(apiTypes as any).map(([apiTypeName, apis]: [string, any]) => {
                                          const apiTypeKey = `${categoryName}-${projectName}-${apiTypeName}`;
                                          
                                          return (
                                            <div key={apiTypeKey}>
                                              <button
                                                onClick={() => onToggleSubcategory?.(apiTypeKey)}
                                                className="flex items-center w-full text-left py-1 px-2 text-xs text-gray-500 hover:bg-blue-50/50 hover:text-gray-900 transition-colors rounded-sm"
                                              >
                                                {expandedSubcategories?.has(apiTypeKey) ? (
                                                  <ChevronDownIcon className="h-3 w-3 mr-1.5 text-gray-400" />
                                                ) : (
                                                  <ChevronRightIcon className="h-3 w-3 mr-1.5 text-gray-400" />
                                                )}
                                                {apiTypeName}
                                                <span className="ml-auto text-xs text-gray-400 font-normal">{(apis as any[]).length}</span>
                                              </button>
                                              
                                              {expandedSubcategories?.has(apiTypeKey) && (
                                                <div className="ml-4 mt-0.5 space-y-0.5">
                                                  {(apis as any[]).map((api: any) => (
                                                    <button
                                                      key={api.id}
                                                      onClick={() => onApiSelect?.(api)}
                                                      className={`block w-full text-left px-2 py-1.5 text-xs transition-colors rounded-sm ${
                                                        selectedApi?.id === api.id
                                                          ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500'
                                                          : 'text-gray-500 hover:bg-blue-50/50 hover:text-gray-900'
                                                      }`}
                                                    >
                                                      <div className="font-normal truncate">{api.title}</div>
                                                    </button>
                                                  ))}
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                );
                              })
                            ) : (
                              // Two-level structure for other categories: Category > Subcategory > APIs
                              Object.entries(subcategories as any).map(([subcategoryName, apis]: [string, any]) => {
                                const subcategoryKey = `${categoryName}-${subcategoryName}`;
                                return (
                                  <div key={subcategoryKey}>
                                    <button
                                      onClick={() => onToggleSubcategory?.(subcategoryKey)}
                                      className="flex items-center w-full text-left py-1 px-2 text-xs text-gray-600 hover:bg-blue-50/50 hover:text-gray-900 transition-colors rounded-sm"
                                    >
                                      {expandedSubcategories?.has(subcategoryKey) ? (
                                        <ChevronDownIcon className="h-3 w-3 mr-1.5 text-gray-400" />
                                      ) : (
                                        <ChevronRightIcon className="h-3 w-3 mr-1.5 text-gray-400" />
                                      )}
                                      {subcategoryName}
                                      <span className="ml-auto text-xs text-gray-400 font-normal">{(apis as any[]).length}</span>
                                    </button>
                                    
                                    {expandedSubcategories?.has(subcategoryKey) && (
                                      <div className="ml-4 mt-0.5 space-y-0.5">
                                        {(apis as any[]).map((api: any) => (
                                          <button
                                            key={api.id}
                                            onClick={() => onApiSelect?.(api)}
                                            className={`block w-full text-left px-2 py-1.5 text-xs transition-colors rounded-sm ${
                                              selectedApi?.id === api.id
                                                ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500'
                                                : 'text-gray-500 hover:bg-blue-50/50 hover:text-gray-900'
                                            }`}
                                          >
                                            <div className="font-normal truncate">{api.title}</div>
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              // Regular Navigation
              navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-blue-50 text-gray-600 border-r-2 border-blue-500"
                      : "text-gray-500 hover:bg-blue-50/50 hover:text-gray-900"
                  )}
                  onClick={onClose}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.name}
                </Link>
              );
              })
            )}
          </nav>

          {/* Upgrade section
          <div className="p-4 border-t border-gray-200 flex-shrink-0">
            <div className="bg-gradient-to-br from-gray-50 to-indigo-100 rounded-lg p-4 text-center">
              <div className="w-16 h-16 mx-auto mb-3 relative">
                <div className="absolute inset-0 bg-gray-100 rounded-full flex items-center justify-center">
                  <KeyIcon className="h-8 w-8 text-gray-600" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-yellow-800">★</span>
                </div>
              </div>
              <p className="text-sm font-medium text-gray-900 mb-1">
                Upgrade for more features.
              </p>
              <button className="w-full bg-gray-600 text-white text-sm font-medium py-2 px-4 rounded-md hover:bg-gray-700 transition-colors">
                Upgrade
              </button>
            </div>
          </div>*/}
        </div>
      </div>
    </>
  );
} 