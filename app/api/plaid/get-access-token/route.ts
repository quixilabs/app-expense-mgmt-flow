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
    console.log('Fetching access token from Supabase');
    const { data, error } = await supabase
      .from('plaid_tokens')
      .select('access_token')
      .eq('user_id', 'current_user_id')
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    if (data) {
      console.log('Access token found');
      return NextResponse.json({ accessToken: data.access_token });
    } else {
      console.log('No access token found');
      return NextResponse.json({ accessToken: null });
    }
  } catch (error) {
    console.error('Error fetching access token:', error);
    return NextResponse.json({ error: 'Failed to fetch access token', details: error }, { status: 500 });
  }
}
