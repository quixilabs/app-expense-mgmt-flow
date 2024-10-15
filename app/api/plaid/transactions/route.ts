import { NextRequest, NextResponse } from 'next/server';
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
import { createClient } from '@supabase/supabase-js';

const configuration = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV as keyof typeof PlaidEnvironments],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
});

const plaidClient = new PlaidApi(configuration);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  console.log('Received auth header:', authHeader);
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Access token is required' }, { status: 400 });
  }

  const accessToken = authHeader.split(' ')[1];
  console.log('Extracted access token:', accessToken);

  try {
    let allTransactions = [];
    let hasMore = true;
    let cursor = null;

    while (hasMore) {
      console.log('Fetching transactions from Plaid, cursor:', cursor);
      const response = await plaidClient.transactionsSync({
        access_token: accessToken,
        cursor: cursor,
      });

      console.log('Plaid response:', response.data);

      allTransactions = allTransactions.concat(response.data.added);
      hasMore = response.data.has_more;
      cursor = response.data.next_cursor;

      // Store the cursor for future syncs
      await supabase
        .from('plaid_sync_cursors')
        .upsert({ user_id: 'current_user_id', cursor: cursor }, { onConflict: 'user_id' });
    }

    console.log('All transactions fetched:', allTransactions.length);
    return NextResponse.json({ transactions: allTransactions });
  } catch (error) {
    console.error('Error fetching Plaid transactions:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions', details: error }, { status: 500 });
  }
}
