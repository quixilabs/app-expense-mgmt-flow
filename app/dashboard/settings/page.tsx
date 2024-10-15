'use client'

import dynamic from 'next/dynamic';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useTheme } from '@/app/providers/ThemeProvider';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { supabase } from '@/utils/supabase';
import { useToast } from '@/components/ui/use-toast';

const RuleManager = dynamic(() => import('@/components/dashboard/rule-manager'), {
  ssr: false,
  loading: () => <p>Loading...</p>
});

export default function SettingsPage() {
  const { theme } = useTheme();
  const [clearMessage, setClearMessage] = useState('');
  const { toast } = useToast();

  const handleClearStore = async () => {
    try {
      // Clear transactions
      const { error: transactionError } = await supabase
        .from('transactions')
        .delete()
        .not('id', 'is', null); // This deletes all rows

      if (transactionError) throw transactionError;

      // Clear rules
      const { error: ruleError } = await supabase
        .from('rules')
        .delete()
        .not('id', 'is', null);

      if (ruleError) throw ruleError;

      // Clear businesses
      const { error: businessError } = await supabase
        .from('businesses')
        .delete()
        .not('id', 'is', null);

      if (businessError) throw businessError;

      setClearMessage('All data cleared successfully!');
      toast({
        title: 'Success',
        description: 'All data has been cleared from the database.',
      });
    } catch (error) {
      console.error('Failed to clear data:', error);
      toast({
        title: 'Error',
        description: 'Failed to clear data. Please try again.',
        variant: 'destructive',
      });
    }

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
            Clear All Data
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
