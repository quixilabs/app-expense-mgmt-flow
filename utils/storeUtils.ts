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
  reviewed?: boolean
  user_id?: string | null
}

export async function addTransaction(transaction: Omit<Transaction, 'id'>, userId: string) {
  if (!userId) {
    throw new Error('User ID is required');
  }
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
        category: transaction.category,
        user_id: userId
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

export async function getTransactions(userId: string) {
  if (!userId) {
    throw new Error('User ID is required');
  }
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (error) throw error;
  return data;
}

export async function updateTransaction(id: string, updates: Partial<Transaction>, userId: string) {
  const updateData: Partial<Transaction> = {};
  
  if (updates.business_id !== undefined) updateData.business_id = updates.business_id;
  if (updates.card_member !== undefined) updateData.card_member = updates.card_member;
  if (updates.account_number !== undefined) updateData.account_number = updates.account_number;
  if (updates.reviewed !== undefined) updateData.reviewed = updates.reviewed;
  // Add other fields as necessary

  const { data, error } = await supabase
    .from('transactions')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTransaction(id: string, userId: string) {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export type Business = {
  id: string
  name: string
  user_id: string
}

export async function addBusiness(name: string, userId: string) {
  if (!userId) {
    throw new Error('User ID is required');
  }
  
  const { data, error } = await supabase
    .from('businesses')
    .insert([{ name, user_id: userId }])
    .select()
    .single();

  if (error) {
    console.error('Error adding business:', error);
    throw error;
  }
  return data;
}

export async function getBusinesses(userId: string) {
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('user_id', userId)
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

export async function updateBusiness(id: string, updates: Partial<Business>, userId: string) {
  const { data, error } = await supabase
    .from('businesses')
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating business:', error);
    throw error;
  }
  return data;
}

export async function removeBusiness(id: string, userId: string) {
  const { error } = await supabase
    .from('businesses')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    console.error('Error removing business:', error);
    throw error;
  }
}
