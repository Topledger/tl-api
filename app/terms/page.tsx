'use client';

import { useSearchParams } from 'next/navigation';
import MainLayout from '@/components/Layout/MainLayout';

export default function TermsPage() {
  const searchParams = useSearchParams();
  const noLayout = searchParams?.get('noLayout') === 'true';

  const content = (
    <div className="max-w-7xl mx-auto min-h-screen">
      <div className="px-8 py-8">
          {/* Header Section */}
          <div className="mb-8">
            
            <p className="text-sm text-gray-600 leading-relaxed max-w-5xl">
              These Terms and Conditions ("Terms") govern your access to and use of the TopLedger.xyz website and services (collectively, the "Services"). By accessing or using our Services, you agree to be bound by these Terms. If you do not agree with any part of these Terms, you must not use our Services.
            </p>
            <hr className="mt-8 border-gray-200" />
          </div>
          

          {/* Content Sections */}
          <div className="space-y-12">

            <section>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Introduction</h4>
              <p className="text-gray-700 leading-relaxed text-sm">
                Top Ledger is a comprehensive blockchain analytics platform focused on providing insights and data analytics for the Solana blockchain. We aim to deliver reliable data solutions for web3 data teams, institutions, and market intelligence platforms.
              </p>
              <hr className="mt-8 border-gray-200" />
            </section>

            <section>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">User Accounts</h4>
              <p className="text-gray-700 leading-relaxed text-sm">
                Services, you may be required to create an account. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete. You are responsible for maintaining the confidentiality of your account credentials.
              </p>
              <hr className="mt-8 border-gray-200" />
            </section>

            <section>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Acceptable Use</h4>
              <p className="text-gray-700 leading-relaxed text-sm mb-2">
                You agree to use our Services only for lawful purposes. You must not:
              </p>
              <div className="ml-6">
                <p className="text-gray-700 text-sm mb-2">1. Use the Services in any way that violates any applicable federal, state, local, or international law or regulation.</p>
                <p className="text-gray-700 text-sm mb-2">2. Engage in any conduct that restricts or inhibits anyone's use or enjoyment of the Services.</p>
                <p className="text-gray-700 text-sm">3. Transmit any advertising or promotional material without our prior written consent.</p>
              </div>
              <hr className="mt-8 border-gray-200" />
            </section>

            <section>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Access and Delivery of Services</h4>
              <p className="text-gray-700 leading-relaxed text-sm mb-2">
                We strive to ensure that access to our online blockchain analytics tool and analytics services is provided promptly upon purchase. Delivery timelines for access credentials or service initiation may vary smd on your location, payment confirmation, and the specifics of the service package selected.
              </p>
              <div className="ml-6 space-y-3">
                <p className="text-gray-700 text-sm"><strong>Service activation:</strong> Access to our analytics tool is typically granted immediately upon successful payment confirmation. For customized analytics services, timelines will be communicated during the onboarding process.</p>
                <p className="text-gray-700 text-sm"><strong>Service delivery:</strong> Estimated timelines for service initiation will be provided at the time of purchase but are not guaranteed. Delays may occur due to unforeseen technical or operational circumstances, and we will make every effort to keep you informed.</p>
              </div>
              <hr className="mt-8 border-gray-200" />
            </section>

            <section className="space-y-8">
              
              
              <div className="mb-8">
                <h5 className="text-lg font-semibold text-gray-800 mb-2">Early Termination</h5>
                <div className="ml-6 space-y-4">
                  <p className="text-gray-700 text-sm"><strong>Mutual termination:</strong> Either party may terminate this Agreement before the end of the Service Period for any reason, provided 15 days' written notice is given to the other party. This termination is separate from the specific rights outlined below.</p>
                  <p className="text-gray-700 text-sm"><strong>Breach of agreement:</strong> If a significant breach of this Agreement occurs, the non-breaching party may terminate the Agreement if the breach is not remedied within 30 days after written notice.</p>
                  <p className="text-gray-700 text-sm"><strong>Top Ledger's right to terminate:</strong> Top Ledger reserves the right to terminate the Agreement immediately with written notice to the Customer in the following situations:</p>
                
                <div className="ml-10 space-y-4 mt-3 mb-3">
                  <p className="text-gray-700 text-sm">• If the Customer breaches provisions of the Agreement (e.g., unauthorized use of the analytics tool, data misuse, or service violations) and fails to remedy the breach after being given a reasonable opportunity to do so.</p>
                  <p className="text-gray-700 text-sm">• If necessary for Top Ledger to comply with relevant laws or regulations.</p>
                  <p className="text-gray-700 text-sm">• If the Customer defaults on payment obligations under the agreed payment plan for the subscription or service.</p>
                  <p className="text-gray-700 text-sm">• If the Customer has purchased the subscription or services through a reseller who is no longer an authorized reseller of Top Ledger.</p>
                  </div>
                  <p className="text-gray-700 text-sm"><strong>Customer's right to terminate:</strong> The Customer reserves the right to terminate this Agreement immediately with written notice to Top Ledger if termination is necessary for the Customer to comply with relevant laws or regulations.</p>
                  </div>
              </div>
              <hr className="mt-8 border-gray-200" />
              

              <div className="mb-8">
                <h5 className="text-lg font-semibold text-gray-800 mb-2">Refunds</h5>
                
                <div className="mb-4">
                  <h6 className="text-md font-semibold text-gray-600 mb-4">Subscriptions (Product)</h6>
                  <div className="ml-6 space-y-3">
                    <p className="text-gray-700 text-sm"><strong>Before access:</strong> If the subscription is terminated before access to the tool begins, a full refund will be issued.</p>
                    <p className="text-gray-700 text-sm"><strong>Performance issues:</strong> If the Customer experiences material deficiencies in the analytics tool, they may request a refund within 15 days of subscription activation. Top Ledger will investigate the issue and, if substantiated, provide a refund or service credit.</p>
                    <p className="text-gray-700 text-sm"><strong>No refund for used periods:</strong> Refunds are not provided for any used portion of the subscription.</p>
                  </div>
                </div>

                <div className="mb-4">
                  <h6 className="text-md font-semibold text-gray-600 mb-4">Analytics services</h6>
                  <div className="ml-6 space-y-3">
                    <p className="text-gray-700 text-sm"><strong>Before service commencement:</strong> If the Agreement is terminated before the service begins, a full refund will be issued.</p>
                    <p className="text-gray-700 text-sm"><strong>Service deficiencies:</strong> If material deficiencies are identified during the service delivery, the Customer may request a refund within 15 days of service delivery. Top Ledger will assess the issue and, if appropriate, issue a refund or credit.</p>
                    <p className="text-gray-700 text-sm"><strong>Completed services:</strong> Refunds will not be issued for services that have been fully rendered.</p>
                  </div>
                </div>
                <div className="mb-4">
                <h6 className="text-md font-semibold text-gray-600 mb-4">Payment defaults</h6>
                <p className="text-gray-700 text-sm mb-2 ml-6">
                  If the Customer defaults on payment, no refund will be issued for the subscription or services already delivered.
                </p>
                </div>
              </div>

              <hr className="mt-8 border-gray-200" />

              <div className="mb-8">
                <h5 className="text-lg font-semibold text-gray-800 mb-2">Adjustments and Service Credits</h5>
                <p className="text-gray-700 leading-relaxed text-sm">
                  If the Customer is unsatisfied with the analytics tool or services due to performance issues, Top Ledger may offer adjustments or service credits at its discretion. Customers must report issues promptly by contacting <a href="mailto:connect@topledger.xyz" className="text-blue-600 hover:text-blue-800">connect@topledger.xyz</a> with detailed information.
                </p>
              </div>
              <hr className="mt-8 border-gray-200" />

              <div className="mb-8">
                <h5 className="text-lg font-semibold text-gray-800 mb-2">Service termination by Top Ledger</h5>
                <p className="text-gray-700 text-sm mb-2">
                  In cases where Top Ledger exercises its right to terminate the Agreement:
                </p>
                <div className="ml-6 space-y-3">
                  <p className="text-gray-700 text-sm">• For subscriptions, a prorated refund for the unused portion of the subscription period may be provided, except in cases of payment default or breaches caused by the Customer.</p>
                  <p className="text-gray-700 text-sm">• For analytics services, a refund or credit for undelivered portions of the service may be issued, subject to Top Ledger's discretion.</p>
                </div>
              </div>
              <hr className="mt-8 border-gray-200" />
            </section>

            <section>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Intellectual Property</h4>
              <p className="text-gray-700 leading-relaxed text-sm">
                All content on TopLedger.xyz, including but not limited to text, graphics, logos, and software, is the property of Top Ledger or its licensors and is protected by copyright and other intellectual property laws. You may not reproduce, distribute, modify, or create derivative works from any content without our express written permission.
              </p>
              <hr className="mt-8 border-gray-200" />
            </section>

            <section>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Limitation of Liability</h4>
              <p className="text-gray-700 leading-relaxed text-sm">
                To the fullest extent permitted by law, Top Ledger shall not be liable for any indirect, incidental, special, consequential damages, or loss of profits arising out of or in connection with your use of the Services. Our total liability shall not exceed the amount paid by you for the Services in the last twelve months.
              </p>
              <hr className="mt-8 border-gray-200" />
            </section>

            <section>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Dispute Resolution</h4>
              <p className="text-gray-700 leading-relaxed text-sm">
                Any disputes arising out of or related to these Terms shall be resolved through binding arbitration in accordance with the rules of Singapore International Arbitration Center (SIAC). The arbitration shall take place in Singapore, and you waive any right to a jury trial.
              </p>
              <hr className="mt-8 border-gray-200" />
            </section>

            <section>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Governing Law</h4>
              <p className="text-gray-700 leading-relaxed text-sm">
                These Terms shall be governed by and construed in accordance with the laws of Singapore, without regard to its conflict of law principles.
              </p>
              <hr className="mt-8 border-gray-200" />
            </section>

            <section>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Changes to Terms</h4>
              <p className="text-gray-700 leading-relaxed text-sm">
                We reserve the right to modify these Terms at any time. We will notify you of any changes by posting the new Terms on our website. Your continued use of the Services after such changes constitutes your acceptance of the new Terms.
              </p>
              <hr className="mt-8 border-gray-200" />
            </section>

            <section>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Termination</h4>
              <p className="text-gray-700 leading-relaxed text-sm">
                We may terminate or suspend your access to our Services immediately, without prior notice or liability, if you breach these Terms.
              </p>
              <hr className="mt-8 border-gray-200" />
            </section>

            <section>
              <p className="text-gray-700 leading-relaxed text-sm">
                By using our Services, you acknowledge that you have read these Terms and agree to be bound by them.
              </p>
              <p className="text-gray-700 leading-relaxed text-sm mt-6">
                <strong>Questions or Concerns?</strong> For any inquiries, please email <a href="mailto:connect@topledger.xyz" className="text-blue-600 hover:text-blue-800">connect@topledger.xyz</a>.
              </p>
            </section>

          </div>

          
        </div>
      </div>
    );

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

  return (
    <MainLayout title="Terms and Conditions">
      {content}
    </MainLayout>
  );
}
