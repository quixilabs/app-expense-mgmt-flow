import { supabase } from './supabase';

export type Transaction = {
  id: string
  amount: number
  description: string
  date: Date
  category?: string | null
  business_id?: string | null
  card_member?: string | null
  account_number?: string | null
}

export async function addTransaction(transaction: Omit<Transaction, 'id'>) {
  console.log('Adding transaction to database:', transaction);
  try {
    const { data, error } = await supabase
      .from('transactions')
      .insert([{
        date: transaction.date,
        description: transaction.description,
        card_member: transaction.card_member,
        account_number: transaction.account_number,
        amount: transaction.amount,
        business_id: transaction.business_id,
        category: transaction.category
      }])
      .select()
      .single();

    if (error) throw error;
    console.log('Transaction added successfully:', data);
    return data;
  } catch (error) {
    console.error('Error adding transaction to database:', error);
    throw error;
  }
}

export async function getTransactions() {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('date', { ascending: false });

  if (error) throw error;
  return data;
}

export async function updateTransaction(id: string, updates: Partial<Transaction>) {
  const { data, error } = await supabase
    .from('transactions')
    .update({
      business_id: updates.business_id,
      card_member: updates.card_member,
      account_number: updates.account_number,
      // Add other fields as necessary
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTransaction(id: string) {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export type Business = {
  id: string
  name: string
}

export async function addBusiness(name: string) {
  const { data, error } = await supabase
    .from('businesses')
    .insert([{ name }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getBusinesses() {
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .order('name');

  if (error) throw error;
  return data;
}

export type Rule = {
  id: string
  pattern: string
  business_id: string
}

export async function addRule(rule: Omit<Rule, 'id'>) {
  const { data, error } = await supabase
    .from('rules')
    .insert([rule])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getRules() {
  const { data, error } = await supabase
    .from('rules')
    .select('*');

  if (error) throw error;
  return data;
}
