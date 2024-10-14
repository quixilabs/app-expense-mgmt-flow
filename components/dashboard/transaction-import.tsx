"use client"

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import Papa from 'papaparse';
import { useTransactionStore, Transaction } from '@/store/transactionStore';
import PlaidLinkComponent from './plaid-link';

/**
 * TransactionImport component allows users to import transactions from a CSV file.
 * It uses Papa Parse for CSV parsing and Zustand for state management.
 */
function TransactionImport() {
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();
  const { addTransactions, setPlaidAccessToken, plaidAccessToken } = useTransactionStore();
  const [isExchangingToken, setIsExchangingToken] = useState(false);

  useEffect(() => {
    console.log('Current Plaid access token:', plaidAccessToken);
  }, [plaidAccessToken]);

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

      setPlaidAccessToken(data.access_token);
      console.log('Plaid access token set in store:', data.access_token);
      
      // Add this line to verify the token is set
      console.log('Current Plaid access token after setting:', useTransactionStore.getState().plaidAccessToken);
      
      setIsConnected(true);
      toast({
        title: 'Success',
        description: 'Bank account connected successfully!',
      });
    } catch (error) {
      console.error('Error connecting bank account:', error);
      toast({
        title: 'Error',
        description: 'Failed to connect bank account',
        variant: 'destructive',
      });
    } finally {
      setIsExchangingToken(false);
    }
  };

  const fetchPlaidTransactions = async () => {
    try {
      setIsImporting(true);
      const currentToken = useTransactionStore.getState().plaidAccessToken;
      console.log('Current Plaid access token before fetching:', currentToken);
    
      if (!currentToken) {
        throw new Error('Plaid access token is missing');
      }
      
      const response = await fetch('/api/plaid/transactions', {
        method: 'GET',
        headers: {
          'X-Plaid-Access-Token': currentToken,
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to fetch transactions:', errorData);
        throw new Error(`Failed to fetch transactions: ${errorData.error}`);
      }

      const data = await response.json();
      console.log('Fetched Plaid transactions:', data);

      const plaidTransactions = data.transactions.map((transaction: any) => ({
        id: transaction.transaction_id,
        date: transaction.date,
        description: transaction.name,
        cardMember: '', // Plaid doesn't provide this information
        accountNumber: transaction.account_id,
        amount: transaction.amount,
        businessId: '',
      }));

      addTransactions(plaidTransactions);

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

    Papa.parse(file, {
      complete: (results) => {
        try {
          const transactions = (results.data as string[][])
            .slice(1) // Skip header row
            .map((row, index) => ({
              id: `csv-${index}`,
              date: row[0],
              description: row[2],
              cardMember: row[3],
              accountNumber: row[4],
              amount: parseFloat(row[5]),
              businessId: '',
            }));

          const validTransactions = transactions.filter(transaction => 
            transaction.date && 
            transaction.description && 
            !isNaN(transaction.amount)
          ) as Transaction[];

          addTransactions(validTransactions);

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
        {!isConnected ? (
          <PlaidLinkComponent onSuccess={handlePlaidSuccess} />
        ) : (
          <div>
            <p className="text-green-600 mb-2">Bank account connected successfully!</p>
            <Button 
              onClick={fetchPlaidTransactions} 
              disabled={isImporting || isExchangingToken}
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
