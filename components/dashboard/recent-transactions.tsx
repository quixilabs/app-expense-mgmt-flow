"use client"

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getTransactions, Transaction } from '@/utils/storeUtils';

export function RecentTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchRecentTransactions() {
      try {
        const data = await getTransactions();
        setTransactions(data.slice(0, 5)); // Get only the 5 most recent transactions
      } catch (error) {
        console.error('Failed to fetch recent transactions:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchRecentTransactions();
  }, []);

  if (isLoading) return <div>Loading...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Card Member</TableHead>
              <TableHead>Account #</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                <TableCell>{transaction.description}</TableCell>
                <TableCell className={transaction.amount < 0 ? 'text-destructive' : 'text-green-600'}>
                  ${Math.abs(Number(transaction.amount)).toFixed(2)}
                </TableCell>
                <TableCell>{transaction.card_member || 'N/A'}</TableCell>
                <TableCell>{transaction.account_number || 'N/A'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
