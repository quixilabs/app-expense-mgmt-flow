"use client"

import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useTransactionStore } from '@/store/transactionStore';
import { ChevronUpIcon, ChevronDownIcon } from '@radix-ui/react-icons';
import { useRuleStore } from '@/store/ruleStore';
import { ScrollArea } from '@/components/ui/scroll-area';

// Update the SortField type to include the new sortable fields
type SortField = 'date' | 'description' | 'amount' | 'businessId' | 'cardMember' | 'accountNumber';
type SortOrder = 'asc' | 'desc';

const TransactionList = () => {
  const { transactions, updateTransaction } = useTransactionStore();
  const [businesses, setBusinesses] = useState<string[]>([]);
  const [newBusiness, setNewBusiness] = useState('');
  const [isAddingBusiness, setIsAddingBusiness] = useState(false);
  const { toast } = useToast();
  
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedBusinessForDownload, setSelectedBusinessForDownload] = useState<string>('');
  const [isDownloadDialogOpen, setIsDownloadDialogOpen] = useState(false);
  const [filterText, setFilterText] = useState('');
  const { rules, addRule } = useRuleStore();
  const [suggestedTransactions, setSuggestedTransactions] = useState<string[]>([]);
  const [isRuleDialogOpen, setIsRuleDialogOpen] = useState(false);
  const [newRule, setNewRule] = useState({ pattern: '', businessId: '' });

  useEffect(() => {
    console.log('Transactions in TransactionList:', transactions);
    const uniqueBusinesses = Array.from(new Set(transactions.map(t => t.businessId).filter(Boolean)));
    console.log('Unique businesses:', uniqueBusinesses);
    setBusinesses(uniqueBusinesses);
  }, [transactions]);

  const handleBusinessChange = (transactionId: string, newBusinessId: string) => {
    console.log('handleBusinessChange called with:', { transactionId, newBusinessId });
    if (typeof updateTransaction === 'function') {
      console.log('Calling updateTransaction');
      updateTransaction(transactionId, { businessId: newBusinessId });
      
      // Find the transaction that was just updated
      const updatedTransaction = transactions.find(t => t.id === transactionId);
      if (updatedTransaction) {
        // Check for similar transactions
        const similarTransactions = transactions.filter(t => 
          t.id !== transactionId && 
          t.description.toLowerCase().includes(updatedTransaction.description.toLowerCase()) &&
          !t.businessId
        );
        
        if (similarTransactions.length > 0) {
          setSuggestedTransactions(similarTransactions.map(t => t.id));
          setNewRule({ 
            pattern: updatedTransaction.description.toLowerCase(), 
            businessId: newBusinessId 
          });
          setIsRuleDialogOpen(true);
        }
      }
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

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedTransactions = [...transactions].sort((a, b) => {
    const compareValues = (aVal: any, bVal: any) => {
      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      return aVal < bVal ? -1 : 1;
    };

    let comparison = 0;
    switch (sortField) {
      case 'date':
        comparison = compareValues(new Date(a.date).getTime(), new Date(b.date).getTime());
        break;
      case 'description':
        comparison = a.description.localeCompare(b.description);
        break;
      case 'amount':
        comparison = compareValues(a.amount, b.amount);
        break;
      case 'businessId':
        comparison = compareValues(a.businessId, b.businessId);
        break;
      case 'cardMember':
        comparison = compareValues(a.cardMember, b.cardMember);
        break;
      case 'accountNumber':
        comparison = compareValues(a.accountNumber, b.accountNumber);
        break;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const renderSortIcon = (field: SortField) => {
    if (sortField === field) {
      return sortOrder === 'asc' ? <ChevronUpIcon className="inline ml-1" /> : <ChevronDownIcon className="inline ml-1" />;
    }
    return null;
  };

  const handleDownloadCSV = () => {
    if (!selectedBusinessForDownload) {
      toast({
        title: 'Error',
        description: 'Please select a business to download transactions.',
        variant: 'destructive',
      });
      return;
    }

    const filteredTransactions = transactions.filter(t => t.businessId === selectedBusinessForDownload);
    
    if (filteredTransactions.length === 0) {
      toast({
        title: 'No Transactions',
        description: 'There are no transactions for the selected business.',
        variant: 'destructive',
      });
      return;
    }

    const csvContent = [
      ['Date', 'Description', 'Amount', 'Card Member', 'Account Number'],
      ...filteredTransactions.map(t => [
        t.date,
        t.description,
        t.amount.toFixed(2),
        t.cardMember || '',
        t.accountNumber || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${selectedBusinessForDownload}_transactions.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    setIsDownloadDialogOpen(false);
    toast({
      title: 'Download Complete',
      description: `Transactions for ${selectedBusinessForDownload} have been downloaded.`,
    });
  };

  const filteredAndSortedTransactions = sortedTransactions.filter(transaction =>
    transaction.description.toLowerCase().includes(filterText.toLowerCase())
  );

  const handleApplyRule = () => {
    addRule(newRule);
    suggestedTransactions.forEach(id => {
      updateTransaction(id, { businessId: newRule.businessId });
    });
    setIsRuleDialogOpen(false);
    setSuggestedTransactions([]);
    toast({
      title: 'Rule Applied',
      description: `Applied ${newRule.businessId} to ${suggestedTransactions.length} transactions and saved the rule.`,
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Transactions</h2>
        <div className="space-x-2">
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
          <Dialog open={isDownloadDialogOpen} onOpenChange={setIsDownloadDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">Download Transactions</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Download Transactions by Business</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="businessSelect">Select Business</Label>
                  <Select
                    value={selectedBusinessForDownload}
                    onValueChange={setSelectedBusinessForDownload}
                  >
                    <SelectTrigger className="w-full">
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
                </div>
                <Button onClick={handleDownloadCSV}>Download CSV</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div className="mb-4">
        <Label htmlFor="filterTransactions">Filter Transactions</Label>
        <Input
          id="filterTransactions"
          placeholder="Search by description..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className="max-w-sm"
        />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead onClick={() => handleSort('date')} className="cursor-pointer">
              Date {renderSortIcon('date')}
            </TableHead>
            <TableHead onClick={() => handleSort('description')} className="cursor-pointer">
              Description {renderSortIcon('description')}
            </TableHead>
            <TableHead onClick={() => handleSort('amount')} className="cursor-pointer">
              Amount {renderSortIcon('amount')}
            </TableHead>
            <TableHead onClick={() => handleSort('businessId')} className="cursor-pointer">
              Business {renderSortIcon('businessId')}
            </TableHead>
            <TableHead onClick={() => handleSort('cardMember')} className="cursor-pointer">
              Card Member {renderSortIcon('cardMember')}
            </TableHead>
            <TableHead onClick={() => handleSort('accountNumber')} className="cursor-pointer">
              Account # {renderSortIcon('accountNumber')}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredAndSortedTransactions.map((transaction) => (
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
      
      <Dialog open={isRuleDialogOpen} onOpenChange={setIsRuleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply Business to Similar Transactions</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              Do you want to apply "{newRule.businessId}" to {suggestedTransactions.length} similar transactions?
            </p>
            <p>Pattern: "{newRule.pattern}"</p>
            <ScrollArea className="h-[200px] w-full rounded-md border p-4">
              {suggestedTransactions.map(id => {
                const transaction = transactions.find(t => t.id === id);
                return transaction ? (
                  <div key={id} className="py-1">
                    {transaction.date} - {transaction.description} - ${Math.abs(transaction.amount).toFixed(2)}
                  </div>
                ) : null;
              })}
            </ScrollArea>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRuleDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleApplyRule}>Apply and Save Rule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default TransactionList;
