"use client"

import { useState, useEffect, useCallback } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { ChevronUp, ChevronDown, ThumbsUp, Check } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getTransactions, deleteTransaction, updateTransaction, getBusinesses, addBusiness, Transaction, Business } from '@/utils/storeUtils';
import { getRules, addRule, Rule } from '@/store/ruleStore';
import { Checkbox } from '@/components/ui/checkbox';
import { useUser } from '@clerk/nextjs';

// Update the SortField type to include the new sortable fields
type SortField = 'date' | 'description' | 'amount' | 'businessId' | 'cardMember' | 'accountNumber';
type SortOrder = 'asc' | 'desc';

const TransactionList = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newBusiness, setNewBusiness] = useState('');
  const [isAddingBusiness, setIsAddingBusiness] = useState(false);
  const { toast } = useToast();
  
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedBusinessForDownload, setSelectedBusinessForDownload] = useState<string>('');
  const [isDownloadDialogOpen, setIsDownloadDialogOpen] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [rules, setRules] = useState<Rule[]>([]);
  const [suggestedTransactions, setSuggestedTransactions] = useState<string[]>([]);
  const [isRuleDialogOpen, setIsRuleDialogOpen] = useState(false);
  const [newRule, setNewRule] = useState({ pattern: '', business_id: '' });
  const [recentBusinessAssignments, setRecentBusinessAssignments] = useState<Array<{ description: string, business_id: string }>>([]);
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const { user } = useUser();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (!user) throw new Error('User not authenticated');
      const [transactionData, businessData, rulesData] = await Promise.all([
        getTransactions(user.id),
        getBusinesses(user.id),
        getRules()
      ]);
      console.log('Fetched transactions:', transactionData);
      setTransactions(transactionData);
      setBusinesses(businessData);
      setRules(rulesData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const handleTransactionsUpdated = () => {
      console.log('Transactions updated event received');
      fetchData();
    };

    window.addEventListener('transactionsUpdated', handleTransactionsUpdated);

    return () => {
      window.removeEventListener('transactionsUpdated', handleTransactionsUpdated);
    };
  }, [fetchData]);

  const handleDelete = async (id: string) => {
    try {
      await deleteTransaction(id);
      setTransactions(transactions.filter(t => t.id !== id));
      toast({
        title: 'Transaction Deleted',
        description: 'The transaction has been successfully deleted.',
      });
    } catch (error) {
      console.error('Failed to delete transaction:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete the transaction. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleBusinessChange = async (transactionId: string, newBusinessId: string) => {
    try {
      const updatedTransaction = await updateTransaction(transactionId, { business_id: newBusinessId });
      setTransactions(transactions.map(t => t.id === transactionId ? updatedTransaction : t));
      
      if (updatedTransaction) {
        // Add this assignment to recent business assignments
        setRecentBusinessAssignments(prev => [
          { description: updatedTransaction.description, business_id: newBusinessId },
          ...prev.slice(0, 4) // Keep only the last 5 assignments
        ]);

        // Check for similar transactions
        const similarTransactions = findSimilarTransactions(updatedTransaction, newBusinessId);
        
        if (similarTransactions.length > 0) {
          setSuggestedTransactions(similarTransactions.map(t => t.id));
          setSelectedTransactions(similarTransactions.map(t => t.id)); // Initially select all similar transactions
          setNewRule({ 
            pattern: findCommonPattern(updatedTransaction.description, similarTransactions[0].description),
            business_id: newBusinessId 
          });
          setIsRuleDialogOpen(true);
        }
      }
    } catch (error) {
      console.error('Failed to update transaction:', error);
      toast({
        title: 'Error',
        description: 'Failed to update the transaction. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const findSimilarTransactions = (updatedTransaction: any, newBusinessId: string) => {
    const recentAssignment = recentBusinessAssignments.find(a => a.business_id === newBusinessId && a.description !== updatedTransaction.description);
    
    if (recentAssignment) {
      // Check for common beginning or ending
      const commonStart = findCommonStart(updatedTransaction.description, recentAssignment.description);
      const commonEnd = findCommonEnd(updatedTransaction.description, recentAssignment.description);
      
      const pattern = commonStart.length > commonEnd.length ? commonStart : commonEnd;
      
      if (pattern.length >= 3) { // Minimum length for a meaningful pattern
        return transactions.filter(t => 
          t.id !== updatedTransaction.id && 
          !t.business_id &&
          (t.description.startsWith(pattern) || t.description.endsWith(pattern))
        );
      }
    }
    
    // Fallback to the previous similarity check
    return transactions.filter(t => 
      t.id !== updatedTransaction.id && 
      t.description.toLowerCase().includes(updatedTransaction.description.toLowerCase()) &&
      !t.business_id
    );
  };

  const findCommonStart = (str1: string, str2: string) => {
    let i = 0;
    while (i < str1.length && i < str2.length && str1[i].toLowerCase() === str2[i].toLowerCase()) {
      i++;
    }
    return str1.slice(0, i);
  };

  const findCommonEnd = (str1: string, str2: string) => {
    let i = 1;
    while (i <= str1.length && i <= str2.length && 
           str1[str1.length - i].toLowerCase() === str2[str2.length - i].toLowerCase()) {
      i++;
    }
    return str1.slice(-i + 1);
  };

  const findCommonPattern = (str1: string, str2: string) => {
    const commonStart = findCommonStart(str1, str2);
    const commonEnd = findCommonEnd(str1, str2);
    return commonStart.length > commonEnd.length ? commonStart : commonEnd;
  };

  const handleAddBusiness = async () => {
    if (!user || !newBusiness.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a business name and ensure you are logged in.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const addedBusiness = await addBusiness(newBusiness.trim(), user.id);
      setBusinesses([...businesses, addedBusiness]);
      setNewBusiness('');
      toast({
        title: 'Business Added',
        description: `${newBusiness} has been added to the list of businesses.`,
      });
    } catch (error) {
      console.error('Failed to add business:', error);
      toast({
        title: 'Error',
        description: 'Failed to add the business. Please try again.',
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
        comparison = compareValues(a.business_id, b.business_id);
        break;
      case 'cardMember':
        comparison = compareValues(a.card_member, b.card_member);
        break;
      case 'accountNumber':
        comparison = compareValues(a.account_number, b.account_number);
        break;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const renderSortIcon = (field: SortField) => {
    if (sortField === field) {
      return sortOrder === 'asc' ? <ChevronUp className="inline ml-1" /> : <ChevronDown className="inline ml-1" />;
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

    const filteredTransactions = transactions.filter(t => t.business_id === selectedBusinessForDownload);
    
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
        t.card_member || '',
        t.account_number || ''
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

  const handleTransactionSelection = (transactionId: string) => {
    setSelectedTransactions(prev => 
      prev.includes(transactionId)
        ? prev.filter(id => id !== transactionId)
        : [...prev, transactionId]
    );
  };

  const handleApplyRule = async () => {
    try {
      const addedRule = await addRule(newRule);
      setRules([...rules, addedRule]);
      for (const id of selectedTransactions) {
        await updateTransaction(id, { business_id: newRule.business_id });
      }
      setIsRuleDialogOpen(false);
      setSuggestedTransactions([]);
      setSelectedTransactions([]);
      await fetchData(); // Refresh the transaction list
      toast({
        title: 'Rule Applied',
        description: `Applied ${newRule.business_id} to ${selectedTransactions.length} transactions and saved the rule.`,
      });
    } catch (error) {
      console.error('Failed to apply rule:', error);
      toast({
        title: 'Error',
        description: 'Failed to apply rule. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleReviewTransaction = async (transactionId: string) => {
    const transaction = transactions.find(t => t.id === transactionId);
    
    if (!transaction) {
      toast({
        title: 'Error',
        description: 'Transaction not found.',
        variant: 'destructive',
      });
      return;
    }

    if (!transaction.business_id) {
      toast({
        title: 'Error',
        description: 'Please select a business before reviewing the transaction.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const updatedTransaction = await updateTransaction(transactionId, { reviewed: true });
      if (updatedTransaction) {
        setTransactions(transactions.map(t => t.id === transactionId ? { ...t, reviewed: true } : t));
        toast({
          title: 'Transaction Reviewed',
          description: 'The transaction has been marked as reviewed.',
        });
      } else {
        throw new Error('Failed to update transaction');
      }
    } catch (error) {
      console.error('Failed to review transaction:', error);
      toast({
        title: 'Error',
        description: 'Failed to review the transaction. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) return <div>Loading transactions...</div>;

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
                        <SelectItem key={business.id} value={business.id}>
                          {business.name}
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
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredAndSortedTransactions.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
              <TableCell>{transaction.description}</TableCell>
              <TableCell className={transaction.amount < 0 ? 'text-destructive' : 'text-green-600'}>
                ${Math.abs(transaction.amount).toFixed(2)}
              </TableCell>
              <TableCell>
                <Select
                  value={transaction.business_id || ''}
                  onValueChange={(value) => handleBusinessChange(transaction.id, value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select business" />
                  </SelectTrigger>
                  <SelectContent>
                    {businesses.map((business) => (
                      <SelectItem key={business.id} value={business.id}>
                        {business.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>{transaction.card_member}</TableCell>
              <TableCell>{transaction.account_number}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button onClick={() => handleDelete(transaction.id)} variant="destructive">
                    Delete
                  </Button>
                  <Button 
                    onClick={() => handleReviewTransaction(transaction.id)} 
                    variant="outline"
                    disabled={transaction.reviewed || !transaction.business_id}
                  >
                    {transaction.reviewed ? (
                      <Check className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ThumbsUp className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </TableCell>
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
              Select transactions to apply "{businesses.find(b => b.id === newRule.business_id)?.name}" to:
            </p>
            <p>Pattern: "{newRule.pattern}"</p>
            <ScrollArea className="h-[300px] w-full rounded-md border p-4">
              {suggestedTransactions.map(id => {
                const transaction = transactions.find(t => t.id === id);
                return transaction ? (
                  <div key={id} className="flex items-center space-x-2 py-2">
                    <Checkbox
                      id={id}
                      checked={selectedTransactions.includes(id)}
                      onCheckedChange={() => handleTransactionSelection(id)}
                    />
                    <label htmlFor={id} className="text-sm">
                      {new Date(transaction.date).toLocaleDateString()} - {transaction.description} - ${Math.abs(Number(transaction.amount)).toFixed(2)}
                    </label>
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
