"use client"

import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useTransactionStore } from '@/store/transactionStore';

const TransactionList = () => {
  const { transactions, updateTransaction } = useTransactionStore();
  const [businesses, setBusinesses] = useState<string[]>([]);
  const [newBusiness, setNewBusiness] = useState('');
  const [isAddingBusiness, setIsAddingBusiness] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    console.log('Transactions in TransactionList:', transactions);
    const uniqueBusinesses = Array.from(new Set(transactions.map(t => t.businessId).filter(Boolean)));
    console.log('Unique businesses:', uniqueBusinesses);
    setBusinesses(uniqueBusinesses);
  }, [transactions]);

  const handleBusinessChange = (transactionId: number, newBusinessId: string) => {
    console.log('handleBusinessChange called with:', { transactionId, newBusinessId });
    if (typeof updateTransaction === 'function') {
      console.log('Calling updateTransaction');
      updateTransaction(transactionId, { businessId: newBusinessId });
    } else {
      console.error('updateTransaction is not a function', updateTransaction);
    }
  };

  const handleAddBusiness = () => {
    if (newBusiness && !businesses.includes(newBusiness)) {
      setBusinesses([...businesses, newBusiness]);
      setNewBusiness('');
      setIsAddingBusiness(false);
      toast({
        title: 'Business Added',
        description: `${newBusiness} has been added to the list of businesses.`,
      });
    } else {
      toast({
        title: 'Error',
        description: 'Please enter a unique business name.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Transactions</h2>
        <Dialog open={isAddingBusiness} onOpenChange={setIsAddingBusiness}>
          <DialogTrigger asChild>
            <Button variant="outline">Add New Business</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Business</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="newBusiness">Business Name</Label>
                <Input 
                  id="newBusiness" 
                  value={newBusiness} 
                  onChange={(e) => setNewBusiness(e.target.value)}
                  placeholder="Enter new business name"
                />
              </div>
              <Button onClick={handleAddBusiness}>Add Business</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Business</TableHead>
            <TableHead>Card Member</TableHead>
            <TableHead>Account #</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell>{transaction.date}</TableCell>
              <TableCell>{transaction.description}</TableCell>
              <TableCell className={transaction.amount < 0 ? 'text-destructive' : 'text-green-600'}>
                ${Math.abs(transaction.amount).toFixed(2)}
              </TableCell>
              <TableCell>
                <Select
                  value={transaction.businessId || ''}
                  onValueChange={(value) => {
                    console.log('Select onValueChange called with:', value);
                    handleBusinessChange(transaction.id, value);
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select business" />
                  </SelectTrigger>
                  <SelectContent>
                    {businesses.map((business) => (
                      <SelectItem key={business} value={business}>
                        {business}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>{transaction.cardMember}</TableCell>
              <TableCell>{transaction.accountNumber}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default TransactionList;