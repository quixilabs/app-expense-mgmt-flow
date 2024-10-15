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

export async function GET() {
  try {
    // Retrieve the access token from Supabase
    const { data, error } = await supabase
      .from('plaid_tokens')
      .select('access_token')
      .eq('user_id', 'current_user_id')
      .single();

    if (error || !data) {
      console.error('Error retrieving access token:', error);
      return NextResponse.json({ error: 'No valid access token found' }, { status: 404 });
    }

    const accessToken = data.access_token;

    // Verify the token with Plaid
    await plaidClient.itemGet({ access_token: accessToken });

    return NextResponse.json({ accessToken });
  } catch (error) {
    console.error('Error verifying Plaid token:', error);
    return NextResponse.json({ error: 'Invalid or expired access token' }, { status: 401 });
  }
}
