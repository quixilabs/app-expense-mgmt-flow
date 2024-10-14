import { NextRequest, NextResponse } from 'next/server';
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

const configuration = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
});

const client = new PlaidApi(configuration);

export async function GET(req: NextRequest) {
  console.log('Received request to fetch Plaid transactions');
  try {
    const plaidAccessToken = req.headers.get('X-Plaid-Access-Token');
    console.log('Plaid access token from header:', plaidAccessToken);

    if (!plaidAccessToken) {
      console.error('Access token is missing');
      return NextResponse.json({ error: 'Access token is required' }, { status: 400 });
    }

    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    const startDate = oneYearAgo.toISOString().split('T')[0];
    const endDate = now.toISOString().split('T')[0];

    console.log('Fetching transactions from Plaid API');
    console.log('Start date:', startDate);
    console.log('End date:', endDate);

    const response = await client.transactionsGet({
      access_token: plaidAccessToken,
      start_date: startDate,
      end_date: endDate,
    });

    console.log('Successfully fetched transactions from Plaid');
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error fetching Plaid transactions:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions', details: error }, { status: 500 });
  }
}
