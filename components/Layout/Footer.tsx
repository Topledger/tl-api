'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const pathname = usePathname();
  const isAuthPage = pathname?.includes('/auth/');
  const isHomePage = pathname === '/';
  const isDocsPage = pathname === '/docs';
  
  // Use noLayout for auth, home, and docs pages
  const shouldUseNoLayout = isAuthPage || isHomePage || isDocsPage;

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto relative z-20">
      <div className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-2">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            {/* Logo and Company 
            <div className="flex items-center space-x-3">
              <img 
                src="https://topledger.xyz/assets/images/logo/topledger-full.svg?imwidth=384"
                alt="Top Ledger"
                className="h-6 w-auto"
              />
            </div> */}
            {/* Copyright */}
            <div className="text-xs text-gray-500 leading-relaxed">
              © {currentYear} Top Ledger. All rights reserved.
            </div>
            {/* Links */}
            <div className="flex items-center space-x-6 text-xs text-gray-600">
              <Link 
                href={shouldUseNoLayout ? "/privacy?noLayout=true" : "/privacy"} 
                className="hover:text-gray-900 transition-colors cursor-pointer"
              >
                Privacy Policy
              </Link>
              <Link 
                href={shouldUseNoLayout ? "/terms?noLayout=true" : "/terms"} 
                className="hover:text-gray-900 transition-colors cursor-pointer"
              >
                Terms of Service
              </Link>
              
            </div>

            
          </div>
        </div>
      </div>
    </footer>
  );
}
