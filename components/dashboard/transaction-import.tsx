"use client"

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import Papa from 'papaparse';
import { addTransaction, Transaction } from '@/utils/storeUtils';
import PlaidLinkComponent from './plaid-link';
import { useRouter } from 'next/navigation';

/**
 * TransactionImport component allows users to import transactions from a CSV file.
 * It uses Papa Parse for CSV parsing and Zustand for state management.
 */
function TransactionImport() {
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();
  const [isExchangingToken, setIsExchangingToken] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const router = useRouter();

  useEffect(() => {
    verifyAccessToken();
  }, []);

  const verifyAccessToken = async () => {
    try {
      const response = await fetch('/api/plaid/verify-token');
      if (response.ok) {
        const data = await response.json();
        setAccessToken(data.accessToken);
        setIsTokenValid(true);
        setIsConnected(true);
      } else {
        console.error('Failed to verify access token:', await response.text());
        setIsTokenValid(false);
        setIsConnected(false);
      }
    } catch (error) {
      console.error('Error verifying access token:', error);
      setIsTokenValid(false);
      setIsConnected(false);
    }
  };

  /**
   * Handles file selection change event.
   * @param {React.ChangeEvent<HTMLInputElement>} e - The change event.
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handlePlaidSuccess = async (public_token: string) => {
    console.log('Plaid link success. Received public token:', public_token);
    if (isExchangingToken) {
      console.log('Token exchange already in progress. Skipping.');
      return;
    }
    
    setIsExchangingToken(true);
    try {
      console.log('Sending request to exchange token');
      const response = await fetch('/api/plaid/exchange-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ public_token }),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        throw new Error(`Failed to exchange token: ${errorData.error}`);
      }

      const data = await response.json();
      console.log('Received data from exchange token:', data);

      await verifyAccessToken(); // Verify the token after exchange

      toast({
        title: 'Success',
        description: 'Bank account connected successfully!',
      });
    } catch (error) {
      console.error('Error connecting bank account:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to connect bank account',
        variant: 'destructive',
      });
    } finally {
      setIsExchangingToken(false);
    }
  };

  const fetchPlaidTransactions = async () => {
    try {
      setIsImporting(true);
      console.log('Fetching Plaid transactions, access token:', accessToken);
      const response = await fetch('/api/plaid/transactions', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      
      console.log('Plaid transactions response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to fetch transactions:', errorData);
        throw new Error(`Failed to fetch transactions: ${errorData.error}`);
      }

      const data = await response.json();
      console.log('Fetched Plaid transactions:', data);

      if (!data.transactions || data.transactions.length === 0) {
        console.log('No transactions returned from Plaid');
        toast({
          title: 'No Transactions',
          description: 'No transactions were found for this account.',
        });
        return;
      }

      const plaidTransactions = data.transactions.map((transaction: any) => ({
        date: new Date(transaction.date),
        description: transaction.name,
        cardMember: '', // Plaid doesn't provide this information
        accountNumber: transaction.account_id,
        amount: transaction.amount,
        businessId: null,
      }));

      console.log('Mapped Plaid transactions:', plaidTransactions);

      // Use a batch insert approach for better performance
      const batchSize = 100;
      for (let i = 0; i < plaidTransactions.length; i += batchSize) {
        const batch = plaidTransactions.slice(i, i + batchSize);
        await Promise.all(batch.map(addTransaction));
      }

      toast({
        title: 'Import Successful',
        description: `Imported ${plaidTransactions.length} transactions from Plaid`,
      });

      window.dispatchEvent(new Event('transactionsUpdated'));
    } catch (error) {
      console.error('Error fetching Plaid transactions:', error);
      toast({
        title: 'Import Failed',
        description: 'An error occurred while fetching Plaid transactions.',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  };

  /**
   * Handles the import process of the CSV file.
   */
  const handleImport = async () => {
    if (!file) {
      toast({
        title: 'Error',
        description: 'Please select a file.',
        variant: 'destructive',
      });
      return;
    }    

    setIsImporting(true);
    console.log('Starting CSV import process');

    Papa.parse(file, {
      complete: async (results) => {
        try {
          console.log('CSV parsing complete. Raw data:', results.data);
          const transactions = (results.data as string[][])
            .slice(1) // Skip header row
            .map((row) => ({
              date: new Date(row[0]),
              description: row[2],
              cardMember: row[3],
              accountNumber: row[4],
              amount: parseFloat(row[5]),
              businessId: null,
            }));

          console.log('Mapped transactions:', transactions);

          const validTransactions = transactions.filter(transaction => 
            transaction.date && 
            transaction.description && 
            !isNaN(transaction.amount)
          ) as Omit<Transaction, 'id'>[];

          console.log('Valid transactions:', validTransactions);

          for (const transaction of validTransactions) {
            console.log('Adding transaction:', transaction);
            try {
              const addedTransaction = await addTransaction(transaction);
              console.log('Transaction added successfully:', addedTransaction);
            } catch (error) {
              console.error('Error adding transaction:', error);
            }
          }

          toast({
            title: 'Import Successful',
            description: `Imported ${validTransactions.length} transactions from CSV`,
          });

          setFile(null);
          window.dispatchEvent(new Event('transactionsUpdated'));
        } catch (error) {
          console.error('Error parsing CSV:', error);
          toast({
            title: 'Import Failed',
            description: 'An error occurred while parsing the CSV file.',
            variant: 'destructive',
          });
        } finally {
          setIsImporting(false);
          console.log('Import process completed');
        }
      },
      error: (error) => {
        console.error('Papa Parse error:', error);
        toast({
          title: 'Import Failed',
          description: 'An error occurred while reading the CSV file.',
          variant: 'destructive',
        });
        setIsImporting(false);
      },
      skipEmptyLines: true,
    });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Import Transactions</h2>
      <div>
        <Label htmlFor="file">CSV File</Label>
        <Input 
          id="file" 
          type="file" 
          accept=".csv" 
          onChange={handleFileChange} 
          disabled={isImporting}
        />
      </div>
      <Button 
        onClick={handleImport} 
        disabled={!file || isImporting}
      >
        {isImporting ? 'Importing...' : 'Import CSV Transactions'}
      </Button>
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-2">Connect Bank Account</h3>
        {!isTokenValid ? (
          <PlaidLinkComponent onSuccess={handlePlaidSuccess} />
        ) : (
          <div>
            <p className="text-green-600 mb-2">Bank account connected successfully!</p>
            <Button 
              onClick={fetchPlaidTransactions} 
              disabled={isImporting || isExchangingToken || !accessToken}
            >
              {isImporting ? 'Importing...' : 'Import Plaid Transactions'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default TransactionImport;
