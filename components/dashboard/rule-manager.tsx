'use client';

import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getRules, addRule, removeRule, updateRule, Rule } from '@/store/ruleStore';
import { getTransactions, updateTransaction, getBusinesses, Transaction, Business } from '@/utils/storeUtils';

function RuleManager() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [newRule, setNewRule] = useState({ pattern: '', business_id: '' });
  const [editingRule, setEditingRule] = useState<string | null>(null);
  const { toast } = useToast();
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const [currentRule, setCurrentRule] = useState<Rule | null>(null);
  const [matchingTransactions, setMatchingTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    fetchRules();
    fetchTransactions();
    fetchBusinesses();
  }, []);

  async function fetchRules() {
    try {
      const fetchedRules = await getRules();
      setRules(fetchedRules);
    } catch (error) {
      console.error('Failed to fetch rules:', error);
      toast({ title: 'Error', description: 'Failed to fetch rules.', variant: 'destructive' });
    }
  }

  async function fetchTransactions() {
    try {
      const fetchedTransactions = await getTransactions();
      setTransactions(fetchedTransactions);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      toast({ title: 'Error', description: 'Failed to fetch transactions.', variant: 'destructive' });
    }
  }

  async function fetchBusinesses() {
    try {
      const fetchedBusinesses = await getBusinesses();
      setBusinesses(fetchedBusinesses);
    } catch (error) {
      console.error('Failed to fetch businesses:', error);
      toast({ title: 'Error', description: 'Failed to fetch businesses.', variant: 'destructive' });
    }
  }

  const handleAddRule = async () => {
    if (newRule.pattern && newRule.business_id) {
      try {
        const addedRule = await addRule(newRule);
        setRules([...rules, addedRule]);
        setNewRule({ pattern: '', business_id: '' });
        toast({
          title: 'Rule Added',
          description: 'New rule has been added successfully.',
        });
      } catch (error) {
        console.error('Failed to add rule:', error);
        toast({ title: 'Error', description: 'Failed to add rule.', variant: 'destructive' });
      }
    }
  };

  const handleEditRule = (id: string) => {
    setEditingRule(id);
  };

  const handleUpdateRule = async (id: string) => {
    try {
      const updatedRule = await updateRule(id, newRule);
      setRules(rules.map(r => r.id === id ? updatedRule : r));
      setEditingRule(null);
      setNewRule({ pattern: '', business_id: '' });
      toast({
        title: 'Rule Updated',
        description: 'Rule has been updated successfully.',
      });
    } catch (error) {
      console.error('Failed to update rule:', error);
      toast({ title: 'Error', description: 'Failed to update rule.', variant: 'destructive' });
    }
  };

  const handleRemoveRule = (rule: Rule) => {
    setCurrentRule(rule);
    const matching = transactions.filter(t => 
      t.description.toLowerCase().includes(rule.pattern.toLowerCase()) && 
      t.business_id === rule.business_id
    );
    setMatchingTransactions(matching);
    setIsRemoveDialogOpen(true);
  };

  const confirmRemoveRule = async (removeAssignments: boolean) => {
    if (currentRule) {
      try {
        await removeRule(currentRule.id);
        setRules(rules.filter(r => r.id !== currentRule.id));
        if (removeAssignments) {
          for (const t of matchingTransactions) {
            await updateTransaction(t.id, { business_id: null });
          }
          await fetchTransactions();
        }
        setIsRemoveDialogOpen(false);
        toast({
          title: 'Rule Removed',
          description: `Rule has been removed${removeAssignments ? ' and business assignments cleared' : ''}.`,
        });
      } catch (error) {
        console.error('Failed to remove rule:', error);
        toast({ title: 'Error', description: 'Failed to remove rule.', variant: 'destructive' });
      }
    }
  };

  const handleApplyRule = (rule: Rule) => {
    setCurrentRule(rule);
    const matching = transactions.filter(t => 
      t.description.toLowerCase().includes(rule.pattern.toLowerCase()) && 
      (!t.business_id || t.business_id !== rule.business_id)
    );
    setMatchingTransactions(matching);
    setIsApplyDialogOpen(true);
  };

  const confirmApplyRule = async () => {
    if (currentRule) {
      try {
        for (const t of matchingTransactions) {
          await updateTransaction(t.id, { business_id: currentRule.business_id });
        }
        await fetchTransactions();
        setIsApplyDialogOpen(false);
        toast({
          title: 'Rule Applied',
          description: `Applied "${currentRule.business_id}" to ${matchingTransactions.length} transactions.`,
        });
      } catch (error) {
        console.error('Failed to apply rule:', error);
        toast({ title: 'Error', description: 'Failed to apply rule.', variant: 'destructive' });
      }
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Manage Business Assignment Rules</h2>
      <div className="flex space-x-2">
        <Input
          placeholder="Pattern"
          value={newRule.pattern}
          onChange={(e) => setNewRule({ ...newRule, pattern: e.target.value })}
        />
        <Select
          value={newRule.business_id}
          onValueChange={(value) => setNewRule({ ...newRule, business_id: value })}
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
        <Button onClick={handleAddRule}>Add Rule</Button>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pattern</TableHead>
              <TableHead>Business</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules.map((rule) => (
              <TableRow key={rule.id}>
                <TableCell>
                  {editingRule === rule.id ? (
                    <Input
                      value={newRule.pattern || rule.pattern}
                      onChange={(e) => setNewRule({ ...newRule, pattern: e.target.value })}
                    />
                  ) : (
                    rule.pattern
                  )}
                </TableCell>
                <TableCell>
                  {editingRule === rule.id ? (
                    <Select
                      value={newRule.business_id || rule.business_id}
                      onValueChange={(value) => setNewRule({ ...newRule, business_id: value })}
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
                  ) : (
                    businesses.find(b => b.id === rule.business_id)?.name || rule.business_id
                  )}
                </TableCell>
                <TableCell>
                  {editingRule === rule.id ? (
                    <Button onClick={() => handleUpdateRule(rule.id)}>Save</Button>
                  ) : (
                    <>
                      <Button variant="outline" onClick={() => handleEditRule(rule.id)}>Edit</Button>
                      <Button variant="destructive" onClick={() => handleRemoveRule(rule)}>Remove</Button>
                      <Button variant="secondary" onClick={() => handleApplyRule(rule)}>Apply to Transactions</Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isApplyDialogOpen} onOpenChange={setIsApplyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply Rule to Matching Transactions</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              Do you want to apply "{businesses.find(b => b.id === currentRule?.business_id)?.name}" to {matchingTransactions.length} matching transactions?
            </p>
            <p>Pattern: "{currentRule?.pattern}"</p>
            <ScrollArea className="h-[200px] w-full rounded-md border p-4">
              {matchingTransactions.map(t => (
                <div key={t.id} className="py-1">
                  {new Date(t.date).toLocaleDateString()} - {t.description} - ${Math.abs(Number(t.amount)).toFixed(2)}
                </div>
              ))}
            </ScrollArea>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApplyDialogOpen(false)}>Cancel</Button>
            <Button onClick={confirmApplyRule}>Apply Rule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Rule and Clear Assignments?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              Do you want to remove the rule "{currentRule?.pattern}" for business "{businesses.find(b => b.id === currentRule?.business_id)?.name}"?
            </p>
            <p>
              There are {matchingTransactions.length} transactions with this business assignment.
              Do you also want to clear these assignments?
            </p>
            <ScrollArea className="h-[200px] w-full rounded-md border p-4">
              {matchingTransactions.map(t => (
                <div key={t.id} className="py-1">
                  {new Date(t.date).toLocaleDateString()} - {t.description} - ${Math.abs(Number(t.amount)).toFixed(2)}
                </div>
              ))}
            </ScrollArea>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRemoveDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => confirmRemoveRule(false)}>Remove Rule Only</Button>
            <Button variant="destructive" onClick={() => confirmRemoveRule(true)}>Remove Rule and Clear Assignments</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default RuleManager;