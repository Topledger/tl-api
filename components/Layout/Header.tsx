'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ChevronDownIcon, ChevronRightIcon, Bars3Icon } from '@heroicons/react/24/outline';
import { useAppStore } from '@/lib/store';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface MenuItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface CustomButton {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

interface HeaderProps {
  title?: string;
  breadcrumbs?: BreadcrumbItem[];
  onMenuClick?: () => void;
  showLogo?: boolean;
  customButton?: CustomButton;
  hideDefaultButton?: boolean;
  menuItems?: MenuItem[];
}

export default function Header({ title, breadcrumbs, onMenuClick, showLogo, customButton, hideDefaultButton, menuItems }: HeaderProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();
  const { user } = useAppStore();

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  const handleSignIn = () => {
    router.push('/auth/signin');
  };

  const handleLogoClick = () => {
    router.push(session ? '/dashboard' : '/');
  };

  const displayUser = session?.user || user;

  return (
    <header className="bg-gray-50 border-b border-gray-200">
      <div className="px-4 md:px-6 lg:px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Mobile menu button */}
          {onMenuClick && (
            <button
              type="button"
              className="lg:hidden pr-2 rounded-md text-gray-400 hover:text-gray-500 focus:text-gray-500 "
              onClick={onMenuClick}
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
          )}
          
          {/* Logo, Title or Breadcrumbs */}
          <div className="flex-1 flex items-center">
            {showLogo && (
              <div className="flex items-center mr-4">
                <button
                  onClick={handleLogoClick}
                  className="focus:outline-none rounded-sm transition-opacity hover:opacity-80"
                >
                  <img 
                    src="https://topledger.xyz/assets/images/logo/topledger-full.svg?imwidth=384"
                    alt="Top Ledger"
                    className="h-8 w-auto"
                  />
                </button>
              </div>
            )}
            <div className="flex-1">
              {breadcrumbs && breadcrumbs.length > 0 ? (
                <nav className="flex" aria-label="Breadcrumb">
                  <ol className="flex items-center space-x-2">
                    {breadcrumbs.map((breadcrumb, index) => (
                      <li key={index} className="flex items-center">
                        {index > 0 && (
                          <ChevronRightIcon className="h-4 w-4 text-gray-400 mx-2" />
                        )}
                        {breadcrumb.href ? (
                          <a
                            href={breadcrumb.href}
                            className="text-sm font-medium text-gray-300 hover:text-gray-700 transition-colors"
                          >
                            {breadcrumb.label}
                          </a>
                        ) : (
                          <span className="text-sm font-medium text-gray-900">
                            {breadcrumb.label}
                          </span>
                        )}
                      </li>
                    ))}
                  </ol>
                </nav>
              ) : (
                showLogo ? null : <h1 className="text-lg font-semibold text-gray-600">{title}</h1>
              )}
            </div>
          </div>

          {/* Menu Items and User Info */}
          <div className="flex items-center space-x-4">
            {/* Custom Menu Items */}
            {menuItems && menuItems.length > 0 && (
              <nav className="hidden md:flex space-x-6">
                {menuItems.map((item, index) => (
                  item.href ? (
                    <a
                      key={index}
                      href={item.href}
                      className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
                    >
                      {item.label}
                    </a>
                  ) : (
                    <button
                      key={index}
                      onClick={item.onClick}
                      className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
                    >
                      {item.label}
                    </button>
                  )
                ))}
              </nav>
            )}

            {session ? (
              <>
                {/* Credits Display 
                {displayUser?.credits && (
                  <div className="hidden sm:flex items-center space-x-2 bg-gray-50 px-3 py-0 rounded-lg">
                    <div className="text-sm">
                      <span className="text-gray-600">Credits left:</span>
                      <span className="ml-1 font-semibold text-gray-900">
                        {displayUser.credits.remaining?.toLocaleString() || 0}
                      </span>
                      
                    </div>
                  </div>
                )}*/}

                {/* User Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    className="flex items-center space-x-2 text-sm rounded-full focus:outline-none focus:ring-offset-2 focus:ring-gray-300"
                    //onClick={() => setShowDropdown(!showDropdown)}
                    onMouseEnter={() => setShowDropdown(true)}
                    
                  >
                    <img
                      className="h-8 w-8 rounded-full"
                      src={session.user?.image || '/default-avatar.png'}
                      alt="User avatar"
                    />
                    <span className="hidden sm:block font-medium text-gray-700">
                      {session.user?.name}
                    </span>
                    <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                  </button>

                  {showDropdown && (
                    
                    <div  onMouseLeave={() => setShowDropdown(false)} className="absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                      <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-200">
                        <p className="font-medium">{session.user?.name}</p>
                        <p className="text-gray-500">{session.user?.email}</p>
                      </div>
                      <button
                        
                        onClick={handleSignOut}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Custom Button or Default Sign In */}
                {!hideDefaultButton && (
                  customButton ? (
                    <button
                      onClick={customButton.onClick}
                      className={`px-4 py-2 rounded-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
                        customButton.variant === 'secondary'
                          ? 'bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-300'
                          : 'bg-gray-900 text-white hover:bg-gray-700 focus:ring-gray-300'
                      }`}
                    >
                      {customButton.label}
                    </button>
                  ) : (
                    <button
                      onClick={handleSignIn}
                      className="bg-gray-900 text-white px-4 py-2 rounded-sm text-sm font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
                    >
                      Sign In
                    </button>
                  )
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
} 