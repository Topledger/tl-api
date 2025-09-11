'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
  breadcrumbs?: BreadcrumbItem[];
  // Docs-specific props
  isDocsMode?: boolean;
  groupedApis?: any;
  selectedApi?: any;
  expandedCategories?: Set<string>;
  expandedSubcategories?: Set<string>;
  expandedProjects?: Set<string>;
  onApiSelect?: (api: any) => void;
  onToggleCategory?: (category: string) => void;
  onToggleSubcategory?: (subcategory: string) => void;
  onToggleProject?: (project: string) => void;
}

export default function MainLayout({ 
  children, 
  title, 
  breadcrumbs, 
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
}: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Redirect to sign in if not authenticated, except for docs page
    if (status === 'loading') return; // Still loading
    if (!session && pathname !== '/docs') {
      router.push('/auth/signin');
      return;
    }
  }, [session, status, router, pathname]);

  // Determine contextual menu items based on current page
  const getContextualMenuItems = () => {
    if (pathname === '/docs') {
      // If not authenticated, show sign in option, otherwise show dashboard
      return session ? [{ label: 'Dashboard', href: '/dashboard' }] : [{ label: 'Home', href: '/' }];
    } else if (pathname === '/dashboard') {
      return [{ label: 'Documentation', href: '/docs' }];
    } else {
      // For other pages, show both options
      return [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Documentation', href: '/docs' }
      ];
    }
  };

  // Show loading while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
      </div>
    );
  }

  // Don't render if not authenticated (except for docs page)
  if (!session && pathname !== '/docs') {
    return null;
  }

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        isDocsMode={isDocsMode}
        groupedApis={groupedApis}
        selectedApi={selectedApi}
        expandedCategories={expandedCategories}
        expandedSubcategories={expandedSubcategories}
        expandedProjects={expandedProjects}
        onApiSelect={onApiSelect}
        onToggleCategory={onToggleCategory}
        onToggleSubcategory={onToggleSubcategory}
        onToggleProject={onToggleProject}
      />
      
      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <Header 
          title={title}
          breadcrumbs={breadcrumbs}
          onMenuClick={() => setSidebarOpen(true)}
          menuItems={getContextualMenuItems()}
        />
        
        <main className="flex-1 bg-gray-50 p-6">
          {children}
        </main>
        
        <Footer />
      </div>
    </div>
  );
} 