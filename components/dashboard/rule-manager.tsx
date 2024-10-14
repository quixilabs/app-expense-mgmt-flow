'use client';

import React, { useState, useEffect } from 'react';
import { useRuleStore } from '@/store/ruleStore';
import { useTransactionStore } from '@/store/transactionStore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function RuleManager() {
  const { rules, addRule, removeRule, updateRule } = useRuleStore();
  const { transactions, updateTransaction } = useTransactionStore();
  const [newRule, setNewRule] = useState({ pattern: '', businessId: '' });
  const [editingRule, setEditingRule] = useState<string | null>(null);
  const { toast } = useToast();
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const [currentRule, setCurrentRule] = useState<{ pattern: string, businessId: string } | null>(null);
  const [matchingTransactions, setMatchingTransactions] = useState<any[]>([]);
  const [businesses, setBusinesses] = useState<string[]>([]);

  useEffect(() => {
    const uniqueBusinesses = Array.from(new Set(transactions.map(t => t.businessId).filter(Boolean)));
    setBusinesses(uniqueBusinesses);
  }, [transactions]);

  const handleAddRule = () => {
    if (newRule.pattern && newRule.businessId) {
      addRule(newRule);
      setNewRule({ pattern: '', businessId: '' });
      toast({
        title: 'Rule Added',
        description: 'New rule has been added successfully.',
      });
    }
  };

  const handleEditRule = (pattern: string) => {
    setEditingRule(pattern);
  };

  const handleUpdateRule = (oldPattern: string) => {
    const ruleToUpdate = rules.find(r => r.pattern === oldPattern);
    if (ruleToUpdate) {
      updateRule(oldPattern, { ...ruleToUpdate, ...newRule });
      setEditingRule(null);
      setNewRule({ pattern: '', businessId: '' });
      toast({
        title: 'Rule Updated',
        description: 'Rule has been updated successfully.',
      });
    }
  };

  const handleRemoveRule = (rule: { pattern: string, businessId: string }) => {
    setCurrentRule(rule);
    const matching = transactions.filter(t => 
      t.description.toLowerCase().includes(rule.pattern.toLowerCase()) && 
      t.businessId === rule.businessId
    );
    setMatchingTransactions(matching);
    setIsRemoveDialogOpen(true);
  };

  const confirmRemoveRule = (removeAssignments: boolean) => {
    if (currentRule) {
      removeRule(currentRule.pattern);
      if (removeAssignments) {
        matchingTransactions.forEach(t => {
          updateTransaction(t.id, { businessId: undefined });
        });
      }
      setIsRemoveDialogOpen(false);
      toast({
        title: 'Rule Removed',
        description: `Rule has been removed${removeAssignments ? ' and business assignments cleared' : ''}.`,
      });
    }
  };

  const handleApplyRule = (rule: { pattern: string, businessId: string }) => {
    setCurrentRule(rule);
    const matching = transactions.filter(t => 
      t.description.toLowerCase().includes(rule.pattern.toLowerCase()) && 
      (!t.businessId || t.businessId !== rule.businessId)
    );
    setMatchingTransactions(matching);
    setIsApplyDialogOpen(true);
  };

  const confirmApplyRule = () => {
    if (currentRule) {
      matchingTransactions.forEach(t => {
        updateTransaction(t.id, { businessId: currentRule.businessId });
      });
      setIsApplyDialogOpen(false);
      toast({
        title: 'Rule Applied',
        description: `Applied "${currentRule.businessId}" to ${matchingTransactions.length} transactions.`,
      });
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
          value={newRule.businessId}
          onValueChange={(value) => setNewRule({ ...newRule, businessId: value })}
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
        <Button onClick={handleAddRule}>Add Rule</Button>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pattern</TableHead>
              <TableHead>Business ID</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules.map((rule) => (
              <TableRow key={rule.pattern}>
                <TableCell>
                  {editingRule === rule.pattern ? (
                    <Input
                      value={newRule.pattern || rule.pattern}
                      onChange={(e) => setNewRule({ ...newRule, pattern: e.target.value })}
                    />
                  ) : (
                    rule.pattern
                  )}
                </TableCell>
                <TableCell>
                  {editingRule === rule.pattern ? (
                    <Select
                      value={newRule.businessId || rule.businessId}
                      onValueChange={(value) => setNewRule({ ...newRule, businessId: value })}
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
                  ) : (
                    rule.businessId
                  )}
                </TableCell>
                <TableCell>
                  {editingRule === rule.pattern ? (
                    <Button onClick={() => handleUpdateRule(rule.pattern)}>Save</Button>
                  ) : (
                    <>
                      <Button variant="outline" onClick={() => handleEditRule(rule.pattern)}>Edit</Button>
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
              Do you want to apply "{currentRule?.businessId}" to {matchingTransactions.length} matching transactions?
            </p>
            <p>Pattern: "{currentRule?.pattern}"</p>
            <ScrollArea className="h-[200px] w-full rounded-md border p-4">
              {matchingTransactions.map(t => (
                <div key={t.id} className="py-1">
                  {t.date} - {t.description} - ${Math.abs(t.amount).toFixed(2)}
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
              Do you want to remove the rule "{currentRule?.pattern}" for business "{currentRule?.businessId}"?
            </p>
            <p>
              There are {matchingTransactions.length} transactions with this business assignment.
              Do you also want to clear these assignments?
            </p>
            <ScrollArea className="h-[200px] w-full rounded-md border p-4">
              {matchingTransactions.map(t => (
                <div key={t.id} className="py-1">
                  {t.date} - {t.description} - ${Math.abs(t.amount).toFixed(2)}
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
