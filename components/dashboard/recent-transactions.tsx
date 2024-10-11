"use client"

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Transaction {
  id: string;
  date: string;
  receipt: string;
  description: string;
  cardMember: string;
  accountNumber: string;
  amount: number;
}

export function RecentTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const loadTransactions = () => {
    const storedTransactions = localStorage.getItem('transactions');
    console.log('Stored transactions:', storedTransactions);
    if (storedTransactions) {
      const parsedTransactions = JSON.parse(storedTransactions);
      console.log('Parsed transactions:', parsedTransactions);
      setTransactions(parsedTransactions);
    }
  };

  useEffect(() => {
    loadTransactions();

    const handleTransactionsUpdated = () => {
      loadTransactions();
    };

    window.addEventListener('transactionsUpdated', handleTransactionsUpdated);

    return () => {
      window.removeEventListener('transactionsUpdated', handleTransactionsUpdated);
    };
  }, []);

  console.log('Transactions in state:', transactions);

  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <p>No transactions found. Please import some transactions.</p>
        </CardContent>
      </Card>
    );
  }

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
                <TableCell>{transaction.date || 'N/A'}</TableCell>
                <TableCell>{transaction.description || 'N/A'}</TableCell>
                <TableCell className={transaction.amount < 0 ? 'text-destructive' : 'text-green-600'}>
                  ${typeof transaction.amount === 'number' ? Math.abs(transaction.amount).toFixed(2) : 'N/A'}
                </TableCell>
                <TableCell>{transaction.cardMember || 'N/A'}</TableCell>
                <TableCell>{transaction.accountNumber || 'N/A'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}