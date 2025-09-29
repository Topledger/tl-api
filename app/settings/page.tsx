'use client';

import { useState } from 'react';
import { PencilIcon } from '@heroicons/react/24/outline';
import MainLayout from '@/components/Layout/MainLayout';
import Button from '@/components/UI/Button';
import Modal from '@/components/UI/Modal';
import { useAppStore } from '@/lib/store';

export default function SettingsPage() {
  const [emailNotifications, setEmailNotifications] = useState({
    runningOutOfCredits: false,
    lessThan100MCredits: false,
    lessThan50MCredits: false,
    lessThan10MCredits: false,
    dailyBalanceUpdate: false,
  });
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [email, setEmail] = useState('abc.bcd3@gmail.com');
  const [isEditingEmail, setIsEditingEmail] = useState(false);

  const { user } = useAppStore();

  const handleNotificationChange = (key: string, value: boolean) => {
    setEmailNotifications(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleUpgradePlan = () => {
    // Implementation for plan upgrade
  };

  const handleCancelPlan = () => {
    setShowCancelModal(false);
    // Implementation for plan cancellation
  };

  const handleSaveEmail = () => {
    setIsEditingEmail(false);
    // Implementation for saving email
  };

  return (
    <MainLayout title="Settings">
      <div className="space-y-6">
        {/* Current Plan */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Current Plan: Basic</h3>
            <Button onClick={handleUpgradePlan}>
              Upgrade Plan
            </Button>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <svg className="w-4 h-4 text-google-gray" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.017 11.215c.026-.012.053-.027.081-.042l5.516-2.847c.403-.208.403-.777 0-.985l-5.516-2.847c-.323-.167-.726-.167-1.049 0l-5.516 2.847c-.403.208-.403.777 0 .985l5.516 2.847c.028.015.055.03.081.042zm-.081-1.06l-4.468-2.303 4.468-2.303c.108-.056.243-.056.351 0l4.468 2.303-4.468 2.303c-.108.056-.243.056-.351 0z"/>
              <path d="M6.036 12.75l5.947 3.067c.324.167.727.167 1.051 0l5.947-3.067c.329-.17.329-.66 0-.83-.329-.17-.727-.17-1.051 0l-5.947 3.067-5.947-3.067c-.324-.17-.722-.17-1.051 0-.329.17-.329.66 0 .83z"/>
              <path d="M6.036 16.75l5.947 3.067c.324.167.727.167 1.051 0l5.947-3.067c.329-.17.329-.66 0-.83-.329-.17-.727-.17-1.051 0l-5.947 3.067-5.947-3.067c-.324-.17-.722-.17-1.051 0-.329.17-.329.66 0 .83z"/>
            </svg>
            <span>{email}</span>
          </div>
        </div>

        {/* Email notifications */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Email notifications</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                {isEditingEmail ? (
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                    onBlur={handleSaveEmail}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveEmail();
                      }
                    }}
                    autoFocus
                  />
                ) : (
                  <>
                    <span className="text-sm text-gray-700">{email}</span>
                    <button
                      onClick={() => setIsEditingEmail(true)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {[
              { key: 'runningOutOfCredits', label: 'Running out of credits' },
              { key: 'lessThan100MCredits', label: 'Less than 100M credits left' },
              { key: 'lessThan50MCredits', label: 'Less than 50M credits left' },
              { key: 'lessThan10MCredits', label: 'Less than 10M credits left' },
              { key: 'dailyBalanceUpdate', label: 'Daily balance update' },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between">
                <label className="text-sm text-gray-700">{label}</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={emailNotifications[key as keyof typeof emailNotifications]}
                    onChange={(e) => handleNotificationChange(key, e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-600"></div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Cancel Plan */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <Button
            variant="danger"
            onClick={() => setShowCancelModal(true)}
          >
            Cancel Plan
          </Button>
        </div>
      </div>

      {/* Cancel Plan Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancel Plan"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to cancel your current plan? This action cannot be undone and you will lose access to all premium features.
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowCancelModal(false)}
            >
              Keep Plan
            </Button>
            <Button
              variant="danger"
              onClick={handleCancelPlan}
            >
              Cancel Plan
            </Button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
} 