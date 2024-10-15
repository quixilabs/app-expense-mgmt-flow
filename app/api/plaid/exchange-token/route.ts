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

    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token: public_token,
    });

    const accessToken = exchangeResponse.data.access_token;

    // Store the access token in Supabase
    const { error } = await supabase
      .from('plaid_tokens')
      .upsert({ access_token: accessToken, user_id: 'current_user_id' }, { onConflict: 'user_id' });

    if (error) throw error;

    return NextResponse.json({ message: 'Access token stored successfully' });
  } catch (error) {
    console.error('Error exchanging token:', error);
    return NextResponse.json({ error: 'Failed to exchange token', details: error }, { status: 500 });
  }
}
