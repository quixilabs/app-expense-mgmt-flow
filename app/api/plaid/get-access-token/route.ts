import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    console.log('Fetching access tokens from Supabase');
    const { data, error } = await supabase
      .from('plaid_tokens')
      .select('access_token')
      .eq('user_id', 'current_user_id');

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    if (data && data.length > 0) {
      console.log('Access tokens found');
      return NextResponse.json({ accessTokens: data });
    } else {
      console.log('No access tokens found');
      return NextResponse.json({ accessTokens: [] });
    }
  } catch (error) {
    console.error('Error fetching access tokens:', error);
    return NextResponse.json({ error: 'Failed to fetch access tokens', details: error }, { status: 500 });
  }
}
