import { NextRequest, NextResponse } from 'next/server';
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

const configuration = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV as keyof typeof PlaidEnvironments],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
});

const client = new PlaidApi(configuration);

export async function POST(req: NextRequest) {
  console.log('Received request to exchange token');
  
  const body = await req.json();
  console.log('Request body:', body);

  const { public_token } = body;
  
  if (!public_token) {
    console.error('Public token is missing from the request');
    return NextResponse.json({ error: 'Public token is required' }, { status: 400 });
  }

  console.log('Public token received:', public_token);

  try {
    console.log('Attempting to exchange public token with Plaid');
    const response = await client.itemPublicTokenExchange({
      public_token: public_token,
    });
    const { access_token, item_id } = response.data;
    
    console.log('Successfully exchanged public token. Item ID:', item_id);
    return NextResponse.json({ success: true, access_token, item_id });
  } catch (error) {
    console.error('Error exchanging public token:', error);
    return NextResponse.json({ error: 'Error exchanging public token', details: error }, { status: 500 });
  }
}
