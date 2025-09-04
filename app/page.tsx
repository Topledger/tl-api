'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Layout/Header';
import Footer from '@/components/Layout/Footer';

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return; // Still loading session

    setIsLoading(false);

    if (session) {
      // User is authenticated, redirect to dashboard
      router.push('/dashboard');
    }
    // If no session, show landing page (don't redirect)
  }, [session, status, router]);

  const handleGetStarted = () => {
    router.push('/auth/signin');
  };

  const handleViewDocs = () => {
    router.push('/docs');
  };

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
      </div>
    );
  }

  // Show landing page for non-authenticated users
  return (
    <div className="min-h-screen bg-white flex flex-col relative overflow-hidden">
      
      {/* Geometric Background Pattern */}
      <div className="absolute inset-0 pointer-events-none">
        <svg className="w-full h-full" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="hexPattern" width="100" height="87" patternUnits="userSpaceOnUse">
              <polygon 
                points="50,5 85,25 85,65 50,85 15,65 15,25" 
                fill="none" 
                stroke="#f3f4f6" 
                strokeWidth="1" 
                opacity="0.8"
              />
            </pattern>
          </defs>
          
          <rect width="100%" height="100%" fill="url(#hexPattern)" />
          
          {/* Large accent hexagons */}
          <g opacity="0.4">
            <polygon 
              points="200,100 270,140 270,220 200,260 130,220 130,140" 
              fill="none" 
              stroke="#e5e7eb" 
              strokeWidth="1"
            />
            <polygon 
              points="700,300 770,340 770,420 700,460 630,420 630,340" 
              fill="none" 
              stroke="#e5e7eb" 
              strokeWidth="1"
            />
            <polygon 
              points="400,600 470,640 470,720 400,760 330,720 330,640" 
              fill="none" 
              stroke="#e5e7eb" 
              strokeWidth="1"
            />
          </g>
          
          {/* Connecting lines */}
          <g opacity="0.3">
            <line x1="200" y1="260" x2="630" y2="340" stroke="#e5e7eb" strokeWidth="1"/>
            <line x1="270" y1="220" x2="700" y2="300" stroke="#e5e7eb" strokeWidth="1"/>
            <line x1="700" y1="460" x2="400" y2="600" stroke="#e5e7eb" strokeWidth="1"/>
          </g>
          
          {/* Small geometric shapes */}
          <g opacity="0.5">
            <circle cx="150" cy="400" r="3" fill="#d1d5db"/>
            <circle cx="800" cy="200" r="3" fill="#d1d5db"/>
            <circle cx="600" cy="700" r="3" fill="#d1d5db"/>
            <circle cx="300" cy="800" r="3" fill="#d1d5db"/>
          </g>
        </svg>
      </div>

      {/* Header */}
      <div className="relative z-20">
        <Header 
          showLogo={true}
          menuItems={[
            { label: 'Documentation', onClick: handleViewDocs }
          ]}
          customButton={{
            label: 'Sign In',
            onClick: handleGetStarted,
            variant: 'primary'
          }}
        />
      </div>

      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-16">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light text-gray-900 mb-6 sm:mb-8 leading-tight tracking-tight">
              Top Ledger APIs for
              <br />
              <span className="font-normal leading-tight">Solana data</span>
            </h1>
            
            <p className="text-base sm:text-lg text-gray-600 mb-8 sm:mb-12 max-w-2xl mx-auto leading-relaxed px-4 sm:px-0">
              Access comprehensive solana data through clean, reliable APIs. 
              Built for performance and simplicity.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-16 sm:mb-24">
              <button
                onClick={handleGetStarted}
                className="w-full sm:w-auto px-8 py-3 bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors duration-200"
              >
                Get Started
              </button>
              
              <button
                onClick={handleViewDocs}
                className="w-full sm:w-auto px-8 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors duration-200"
              >
                View Documentation →
              </button>
            </div>
          </div>

          

          {/* Minimal Stats */}
          <div className="border-t border-gray-200 pt-8 sm:pt-12">
            <div className="grid grid-cols-3 gap-4 sm:gap-8 text-center">
              <div>
                <div className="text-xl sm:text-2xl font-light text-gray-900 mb-1">99.9%</div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Uptime</div>
              </div>
              
              <div>
                <div className="text-xl sm:text-2xl font-light text-gray-900 mb-1">500ms</div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Avg Response</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-light text-gray-900 mb-1">24/7</div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Support</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <div className="relative z-20">
        <Footer />
      </div>
    </div>
  );
}