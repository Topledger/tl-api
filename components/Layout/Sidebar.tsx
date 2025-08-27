'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  HomeIcon, 
  KeyIcon, 
  ChartBarIcon, 
  CogIcon, 
  DocumentTextIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Explore APIs', href: '/', icon: HomeIcon },
  { name: 'API Keys', href: '/keys', icon: KeyIcon },
  //{ name: 'Usage & Billing history', href: '/usage', icon: ChartBarIcon },
  //{ name: 'Settings', href: '/settings', icon: CogIcon },
    { name: 'Docs', href: '/docs', icon: DocumentTextIcon },
    { name: 'Api Tracking', href: '/tracking', icon: ChartBarIcon },
 
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

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
        "fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:flex lg:flex-col lg:shadow-none",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center px-4 py-4 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center">
              <img 
                src="https://topledger.xyz/assets/images/logo/topledger-full.svg?imwidth=384"
                alt="Top Ledger Logo"
                className="h-8 w-auto"
              />
              
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
            {navigation.map((item) => {
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
            })}
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