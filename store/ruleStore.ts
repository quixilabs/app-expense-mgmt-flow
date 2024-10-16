import { supabase } from '@/utils/supabase';

export interface Rule {
  id: string;
  pattern: string;
  business_id: string;
}

export async function getRules(): Promise<Rule[]> {
  const { data, error } = await supabase
    .from('rules')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function addRule(rule: Omit<Rule, 'id'>): Promise<Rule> {
  const { data, error } = await supabase
    .from('rules')
    .insert([rule])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function removeRule(id: string): Promise<void> {
  const { error } = await supabase
    .from('rules')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function updateRule(id: string, updates: Partial<Rule>): Promise<Rule> {
  const { data, error } = await supabase
    .from('rules')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function applyRulesToTransactions(transactions: any[]): Promise<any[]> {
  const rules = await getRules();
  
  // Sort rules by pattern length in descending order
  const sortedRules = rules.sort((a, b) => b.pattern.length - a.pattern.length);
  
  return transactions.map(transaction => {
    const matchingRule = sortedRules.find(rule => {
      const pattern = rule.pattern.toLowerCase();
      const description = transaction.description.toLowerCase();
      
      // Ensure the pattern is at least 6 characters long
      if (pattern.length < 6) return false;
      
      // Check if the first 6 characters match
      if (!description.startsWith(pattern.slice(0, 6))) return false;
      
      // If more than 6 characters in the pattern, check for partial match
      if (pattern.length > 6) {
        const remainingPattern = pattern.slice(6);
        const remainingDescription = description.slice(6);
        
        // Check if at least 80% of the remaining characters match
        const matchCount = remainingPattern.split('').filter((char, index) => 
          remainingDescription[index] === char
        ).length;
        
        const matchPercentage = matchCount / remainingPattern.length;
        return matchPercentage >= 0.8;
      }
      
      return true;
    });
    
    if (matchingRule) {
      return { ...transaction, business_id: matchingRule.business_id };
    }
    
    return transaction;
  });
}
