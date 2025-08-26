'use client';

import MainLayout from '@/components/Layout/MainLayout';

export default function DocsPage() {
  return (
    <MainLayout title="Documentation">
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">API Documentation</h2>
          <p className="text-gray-600 mb-6">
            Welcome to the Top Ledger API documentation. Here you'll find everything you need to get started with our APIs.
          </p>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Getting Started</h3>
              <p className="text-gray-600">
                To get started with our API, you'll need to create an API key from the API Keys page.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication</h3>
              <p className="text-gray-600">
                All API requests must include your API key in the Authorization header.
              </p>
              <pre className="bg-gray-50 p-4 rounded-lg text-sm mt-2">
                <code>Authorization: Bearer YOUR_API_KEY</code>
              </pre>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Rate Limits</h3>
              <p className="text-gray-600">
                API requests are limited based on your current plan. Check your usage on the Usage page.
              </p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 