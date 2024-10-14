"use client"
import { useState, useEffect } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import axios from 'axios';

interface PlaidLinkComponentProps {
  onSuccess: () => void;
}

const PlaidLinkComponent: React.FC<PlaidLinkComponentProps> = ({ onSuccess }) => {
  const [linkToken, setLinkToken] = useState<string | null>(null);

  useEffect(() => {
    const createLinkToken = async () => {
      try {
        console.log('Fetching link token...');
        const response = await axios.post('/api/plaid/create-link-token');
        console.log('Link token response:', response.data);
        setLinkToken(response.data.link_token);
      } catch (error) {
        console.error('Error generating link token:', error);
      }
    };
    createLinkToken();
  }, []);

  const handleSuccess = async (public_token: string, metadata: any) => {
    try {
      console.log('Plaid Link success. Exchanging token...');
      await axios.post('/api/plaid/exchange-token', {
        public_token,
      });
      console.log('Token exchange successful');
      onSuccess();
    } catch (error) {
      console.error('Error exchanging public token:', error);
    }
  };

  const config: Parameters<typeof usePlaidLink>[0] = {
    token: linkToken!,
    onSuccess: handleSuccess,
  };

  const { open, ready } = usePlaidLink(config);

  console.log('Plaid Link state:', { linkToken, ready });

  return (
    <button
      onClick={() => {
        console.log('Connect Bank Account clicked');
        open();
      }}
      disabled={!ready}
      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
    >
      Connect Bank Account
    </button>
  );
};

export default PlaidLinkComponent;
