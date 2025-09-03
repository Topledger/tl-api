'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import MainLayout from '@/components/Layout/MainLayout';

function PrivacyContent() {
  const searchParams = useSearchParams();
  const noLayout = searchParams?.get('noLayout') === 'true';

  const content = (
    <div className="max-w-7xl mx-auto min-h-screen">
      <div className="px-8 py-8">
          {/* Header Section */}
          <div className="mb-8">
            <p className="text-sm text-gray-600 leading-relaxed max-w-5xl">
              Thank you for choosing Top Ledger. By using our website, engaging with our services, or accessing our software-as-a-service (SaaS) offerings, you agree to the practices described in this policy. If you're representing an organization, your agreement confirms you're authorized to bind your entity and its users to these terms. If you lack such authority, or if you disagree with any part of these terms, you will not be able to access our services.
            </p>
            <hr className="mt-8 border-gray-200" />
          </div>

          {/* Content Sections */}
          <div className="space-y-12">

            <section>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Effective date</h4>
              <p className="text-gray-700 leading-relaxed text-sm">
                This policy is effective as of January 1st, 2024. We are committed to managing any significant changes with transparency, affecting your rights or obligations and seeking your consent where required by law.
              </p>
              <hr className="mt-8 border-gray-200" />
            </section>

            <section>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Who we are</h4>
              <p className="text-gray-700 leading-relaxed text-sm">
                Top Ledger specializes in cutting-edge blockchain data analytics through our sophisticated SaaS platform. Our Privacy Policy is designed to protect information collected directly through our services and does not cover third-party websites or services you might interact with. We encourage you to review their privacy policies. If our data handling practices are not aligned with your expectations, consider removing cookies from your device after using our site and reconsidering your use of our services.
              </p>
              <hr className="mt-8 border-gray-200" />
            </section>

            <section>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Understanding our data use</h4>
              <p className="text-gray-700 leading-relaxed text-sm">
                We collect data directly when you interact with our website, sign up for trials, or communicate with us, and indirectly through tracking technologies like cookies. This helps us understand your navigation of our website and integrate data from third-party sources to enhance our services. Our goal is to deliver and improve the valuable services you expect from us, maintaining the highest standards of data security.
              </p>
              <hr className="mt-8 border-gray-200" />
            </section>

            <section>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Types of data we collect</h4>
              <div className="space-y-4">
                <div>
                  <p className="text-gray-700 text-sm mb-2">
                    <strong>Personal data:</strong> Information you provide that allows us to offer personalized services, respond to queries, send updates, and market our offerings. This is crucial for access to our platform, content delivery, and regulatory compliance.
                  </p>
                </div>
                <div>
                  <p className="text-gray-700 text-sm mb-2">
                    <strong>Service data:</strong> Used to facilitate the services you've subscribed to, ensuring functionality and performance.
                  </p>
                </div>
                <div>
                  <p className="text-gray-700 text-sm">
                    <strong>Other data:</strong> Treated with the same level of care as personal data in jurisdictions with stringent data protection laws, respecting your privacy and rights under our policy.
                  </p>
                </div>
              </div>
              <hr className="mt-8 border-gray-200" />
            </section>

            <section>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">How do we share data</h4>
              <p className="text-gray-700 leading-relaxed text-sm mb-2">
                We do not sell your data. Sharing is limited to:
              </p>
              <div className="ml-6 space-y-3">
                <p className="text-gray-700 text-sm"><strong>Service providers:</strong> Partners providing essential services, from infrastructure to operational assistance.</p>
                <p className="text-gray-700 text-sm"><strong>Partners and legal entities:</strong> For service integrations and legal compliance.</p>
              </div>
              <hr className="mt-8 border-gray-200" />
            </section>

            <section>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Security measures and data retention</h4>
              <p className="text-gray-700 leading-relaxed text-sm">
                We employ rigorous security measures to protect your data and retain it only as long as necessary or as required by law, after which it is securely disposed of or anonymized.
              </p>
              <hr className="mt-8 border-gray-200" />
            </section>

            <section>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Use by minors and your data rights</h4>
              <p className="text-gray-700 leading-relaxed text-sm">
                Our services are not intended for minors. You have the right to access, correct, or delete your personal information. We provide mechanisms for updating or removing your data, except where retention is legally required.
              </p>
              <hr className="mt-8 border-gray-200" />
            </section>

            <section>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Global presence and your data</h4>
              <p className="text-gray-700 leading-relaxed text-sm">
                Your data may be processed in any country where we or our service providers are located, subject to different data protection laws. We ensure international data transfers comply with legal requirements, safeguarding your information according to this policy.
              </p>
              <hr className="mt-8 border-gray-200" />
            </section>

            <section>
              <p className="text-gray-700 leading-relaxed text-sm">
                <strong>Questions or Concerns?</strong> For any inquiries related to your data privacy to contact our Data Privacy Officer, please email <a href="mailto:connect@topledger.xyz" className="text-blue-600 hover:text-blue-800">connect@topledger.xyz</a>. We are committed to managing your data with care and respect, in line with our commitment to privacy and security.
              </p>
            </section>

          </div>

          
        </div>
      </div>
    );

  // Return layout based on context
  if (noLayout) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Simple header for auth pages */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-8 py-4">
            <div className="flex items-center justify-between">
              <img 
                src="https://topledger.xyz/assets/images/logo/topledger-full.svg?imwidth=384"
                alt="Top Ledger"
                className="h-8 w-auto"
              />
              <button 
                onClick={() => window.history.back()}
                className="text-gray-600 hover:text-gray-900 text-sm"
              >
                ← Back to login
              </button>
            </div>
          </div>
        </div>
        {content}
      </div>
    );
  }

  // Default: full layout with sidebar
  return (
    <MainLayout title="Privacy Policy">
      {content}
    </MainLayout>
  );
}

export default function PrivacyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <PrivacyContent />
    </Suspense>
  );
}
