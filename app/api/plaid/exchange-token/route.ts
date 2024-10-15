import { NextResponse } from 'next/server';
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
import { createClient } from '@supabase/supabase-js';

const configuration = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
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

export async function POST(request: Request) {
  try {
    const { public_token } = await request.json();
    console.log('Received public token:', public_token);

    console.log('Exchanging public token for access token');
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token: public_token,
    });

    const accessToken = exchangeResponse.data.access_token;
    const itemId = exchangeResponse.data.item_id;
    console.log('Received access token and item ID');

    console.log('Storing access token in Supabase');
    const { data, error } = await supabase
      .from('plaid_tokens')
      .insert({ access_token: accessToken, user_id: 'current_user_id' });

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    console.log('Access token stored successfully');
    return NextResponse.json({ message: 'Access token stored successfully' });
  } catch (error) {
    console.error('Error in exchange-token route:', error);
    return NextResponse.json({ error: 'Failed to exchange token', details: error }, { status: 500 });
  }
}
