'use client'

import dynamic from 'next/dynamic';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useTheme } from '@/app/providers/ThemeProvider';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { useToast } from '@/components/ui/use-toast';
import PlaidLinkComponent from '@/components/dashboard/plaid-link';

const RuleManager = dynamic(() => import('@/components/dashboard/rule-manager'), {
  ssr: false,
  loading: () => <p>Loading...</p>
});

interface ConnectedAccount {
  access_token: string;
  institution_name?: string;
}

export default function SettingsPage() {
  const { theme } = useTheme();
  const [clearMessage, setClearMessage] = useState('');
  const { toast } = useToast();
  const [connectedAccount, setConnectedAccount] = useState<ConnectedAccount | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    fetchConnectedAccount();
  }, []);

  const fetchConnectedAccount = async () => {
    try {
      const response = await fetch('/api/plaid/get-access-token');
      if (!response.ok) {
        throw new Error('Failed to fetch access token');
      }
      const data = await response.json();
      
      if (data.accessToken) {
        setConnectedAccount({ access_token: data.accessToken });
        // You might want to fetch the institution name using the Plaid API here
      } else {
        setConnectedAccount(null);
      }
    } catch (error) {
      console.error('Error fetching connected account:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch connected account.',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveAccount = async () => {
    if (!connectedAccount) return;

    try {
      // Remove the Plaid token from the database
      const { error } = await supabase
        .from('plaid_tokens')
        .delete()
        .eq('access_token', connectedAccount.access_token);

      if (error) throw error;

      // Call Plaid API to remove the item (you may need to implement this endpoint)
      await fetch('/api/plaid/remove-item', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ access_token: connectedAccount.access_token }),
      });

      setConnectedAccount(null);
      toast({
        title: 'Success',
        description: 'Bank account removed successfully.',
      });
    } catch (error) {
      console.error('Error removing bank account:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove bank account. Please try again.',
        variant: 'destructive',
      });
    }
  };

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

  const handlePlaidSuccess = async (public_token: string) => {
    try {
      console.log('Exchanging public token for access token');
      const response = await fetch('/api/plaid/exchange-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ public_token }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to exchange token: ${errorData.error}`);
      }

      const data = await response.json();
      console.log('Token exchange successful');

      await fetchConnectedAccount();
      toast({
        title: 'Success',
        description: 'Bank account connected successfully!',
      });
    } catch (error) {
      console.error('Error connecting bank account:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to connect bank account. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleImportTransactions = async () => {
    if (!connectedAccount) return;

    setIsImporting(true);
    try {
      const response = await fetch('/api/plaid/transactions', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${connectedAccount.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const data = await response.json();
      console.log('Fetched transactions:', data);

      toast({
        title: 'Success',
        description: `Imported ${data.transactions.length} transactions`,
      });
    } catch (error) {
      console.error('Error importing transactions:', error);
      toast({
        title: 'Error',
        description: 'Failed to import transactions. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
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
        <h2 className="text-2xl font-semibold mb-4">Bank Account</h2>
        {connectedAccount ? (
          <div className="bg-secondary p-4 rounded-md space-y-4">
            <div className="flex items-center justify-between">
              <span>{connectedAccount.institution_name || 'Bank Account Connected'}</span>
              <Button
                onClick={handleRemoveAccount}
                variant="destructive"
                size="sm"
              >
                Remove
              </Button>
            </div>
            <Button
              onClick={handleImportTransactions}
              disabled={isImporting}
            >
              {isImporting ? 'Importing...' : 'Import Transactions'}
            </Button>
          </div>
        ) : (
          <div>
            <p className="mb-2">No bank account connected.</p>
            <PlaidLinkComponent onSuccess={handlePlaidSuccess} />
          </div>
        )}
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
