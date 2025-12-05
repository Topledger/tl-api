'use client';

import React from 'react';

export interface Tab {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export default function Tabs({ tabs, activeTab, onTabChange }: TabsProps) {
  return (
    <div className="flex space-x-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          data-tab-id={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-4 text-sm font-medium transition-colors duration-200 ${
            activeTab === tab.id
              ? 'text-gray-900'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

