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
