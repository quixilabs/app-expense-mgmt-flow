import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  const { accessToken } = await request.json();

  if (!accessToken) {
    console.error('Access token is missing from the request');
    return NextResponse.json({ error: 'Access token is required' }, { status: 400 });
  }

  try {
    console.log('Attempting to store access token in Supabase');
    const { data, error } = await supabase
      .from('plaid_tokens')
      .upsert({ access_token: accessToken, user_id: 'current_user_id' }, { onConflict: 'user_id' });

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    console.log('Access token stored successfully');
    return NextResponse.json({ message: 'Access token stored successfully' });
  } catch (error) {
    console.error('Error storing access token:', error);
    return NextResponse.json({ error: 'Failed to store access token', details: error }, { status: 500 });
  }
}
