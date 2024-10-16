'use client'

import dynamic from 'next/dynamic';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useTheme } from '@/app/providers/ThemeProvider';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { useToast } from '@/components/ui/use-toast';
import PlaidLinkComponent from '@/components/dashboard/plaid-link';
import { applyRulesToTransactions } from '@/store/ruleStore';
import BusinessManager from '@/components/dashboard/business-manager';

const RuleManager = dynamic(() => import('@/components/dashboard/rule-manager'), {
  ssr: false,
  loading: () => <p>Loading...</p>
});

interface ConnectedAccount {
  access_token: string;
}

export default function SettingsPage() {
  const { theme } = useTheme();
  const [clearMessage, setClearMessage] = useState('');
  const { toast } = useToast();
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    fetchConnectedAccounts();
  }, []);

  const fetchConnectedAccounts = async () => {
    try {
      const response = await fetch('/api/plaid/get-access-token');
      if (!response.ok) {
        throw new Error('Failed to fetch access tokens');
      }
      const data = await response.json();
      
      if (data.accessTokens && data.accessTokens.length > 0) {
        setConnectedAccounts(data.accessTokens);
      } else {
        setConnectedAccounts([]);
      }
    } catch (error) {
      console.error('Error fetching connected accounts:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch connected accounts.',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveAccount = async (account: ConnectedAccount) => {
    try {
      // Remove the Plaid token from the database
      const { error } = await supabase
        .from('plaid_tokens')
        .delete()
        .eq('access_token', account.access_token);

      if (error) throw error;

      // Call Plaid API to remove the item (you may need to implement this endpoint)
      await fetch('/api/plaid/remove-item', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ access_token: account.access_token }),
      });

      setConnectedAccounts(connectedAccounts.filter(a => a.access_token !== account.access_token));
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
      // Clear only transactions
      const { error: transactionError } = await supabase
        .from('transactions')
        .delete()
        .not('id', 'is', null); // This deletes all rows in the transactions table

      if (transactionError) throw transactionError;

      setClearMessage('All transaction data cleared successfully!');
      toast({
        title: 'Success',
        description: 'All transaction data has been cleared from the database.',
      });
    } catch (error) {
      console.error('Failed to clear transaction data:', error);
      toast({
        title: 'Error',
        description: 'Failed to clear transaction data. Please try again.',
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
        console.error('Error response:', errorData);
        throw new Error(`Failed to exchange token: ${errorData.error}`);
      }

      const data = await response.json();
      console.log('Token exchange response:', data);

      await fetchConnectedAccounts();
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

  const handleImportTransactions = async (account: ConnectedAccount) => {
    setIsImporting(true);
    try {
      const response = await fetch('/api/plaid/transactions', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${account.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const data = await response.json();
      console.log('Fetched transactions:', data);

      // Apply rules to the fetched transactions
      const processedTransactions = await applyRulesToTransactions(data.transactions);

      // Here, you would save the processedTransactions to your database
      // For example:
      // await saveTransactionsToDatabase(processedTransactions);

      toast({
        title: 'Success',
        description: `Imported and processed ${processedTransactions.length} transactions`,
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
        {connectedAccounts.length > 0 ? (
          <div className="bg-secondary p-4 rounded-md space-y-4">
            {connectedAccounts.map((account, index) => (
              <div key={index} className="flex items-center justify-between mb-4">
                <span>Connected Bank Account {index + 1}</span>
                <Button
                  onClick={() => handleRemoveAccount(account)}
                  variant="destructive"
                  size="sm"
                >
                  Remove
                </Button>
              </div>
            ))}
            <Button
              onClick={() => handleImportTransactions(connectedAccounts[0])}
              disabled={isImporting}
            >
              {isImporting ? 'Importing...' : 'Import Transactions'}
            </Button>
            <div className="mt-4">
              <p className="mb-2">Connect another bank account:</p>
              <PlaidLinkComponent onSuccess={handlePlaidSuccess} />
            </div>
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
            Clear Transaction Data
          </Button>
          {clearMessage && (
            <p className="text-green-500 font-semibold">{clearMessage}</p>
          )}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Rule Management</h2>
        <RuleManager />
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Business Management</h2>
        <BusinessManager />
      </section>

      {/* Add other settings sections here */}
    </div>
  );
}
