"use client"

import { useState } from 'react';
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
  const addTransactions = useTransactionStore((state) => state.addTransactions);

  /**
   * Handles file selection change event.
   * @param {React.ChangeEvent<HTMLInputElement>} e - The change event.
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handlePlaidSuccess = () => {
    console.log('Plaid connection successful');
    setIsConnected(true);
    toast({
      title: 'Success',
      description: 'Bank account connected successfully!',
    });
    // TODO: Implement logic to fetch and display transactions
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
              id: index,
              date: row[0],
              description: row[2],
              cardMember: row[3],
              accountNumber: row[4],
              amount: parseFloat(row[5]),
              businessId: '',
            }));

          // Filter out any transactions with invalid data
          const validTransactions = transactions.filter(transaction => 
            transaction.date && 
            transaction.description && 
            !isNaN(transaction.amount)
          ) as Transaction[];

          // console.log('Processed Transactions:', validTransactions);
          // console.log('Number of Valid Transactions:', validTransactions.length);

          // Add transactions to the Zustand store
          addTransactions(validTransactions);

          toast({
            title: 'Import Successful',
            description: `Imported ${validTransactions.length} transactions`,
          });

          // Reset the form
          setFile(null);

          // Dispatch a custom event to notify other components
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
      // header: true,
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
        {isImporting ? 'Importing...' : 'Import Transactions'}
      </Button>
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-2">Connect Bank Account</h3>
        {!isConnected ? (
          <PlaidLinkComponent onSuccess={handlePlaidSuccess} />
        ) : (
          <p className="text-green-600">Bank account connected successfully!</p>
        )}
      </div>
    </div>
  );
}

export default TransactionImport;
