'use client'

import dynamic from 'next/dynamic';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useTheme } from '@/app/providers/ThemeProvider';
import { Button } from '@/components/ui/button';
import { clearStoreOnce } from '@/utils/storeUtils';
import { useState } from 'react';

const RuleManager = dynamic(() => import('@/components/dashboard/rule-manager'), {
  ssr: false,
  loading: () => <p>Loading...</p>
});

export default function SettingsPage() {
  const { theme } = useTheme();
  const [clearMessage, setClearMessage] = useState('');

  const handleClearStore = () => {
    clearStoreOnce();
    setClearMessage('Store cleared successfully!');
    setTimeout(() => setClearMessage(''), 3000); // Clear message after 3 seconds
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Theme Settings</h2>
        <div className="flex items-center space-x-4">
          <span className="text-lg">Current theme: {theme === 'light' ? 'Light' : 'Dark'}</span>
          <ThemeToggle variant="outline" size="default" />
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Data Management</h2>
        <div className="flex flex-col space-y-4">
          <Button onClick={handleClearStore} variant="destructive">
            Clear Zustand Store
          </Button>
          {clearMessage && (
            <p className="text-green-500 font-semibold">{clearMessage}</p>
          )}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Rule Manager</h2>
        <RuleManager />
      </section>

      {/* Add other settings sections here */}
    </div>
  );
}
