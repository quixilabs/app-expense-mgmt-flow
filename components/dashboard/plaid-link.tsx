"use client"
import { useState, useEffect, useCallback } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import axios from 'axios';
import { Button } from '@/components/ui/button';

interface PlaidLinkComponentProps {
  onSuccess: (public_token: string) => void;
}

const PlaidLinkComponent: React.FC<PlaidLinkComponentProps> = ({ onSuccess }) => {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const onSuccessCallback = useCallback((public_token: string) => {
    console.log('Plaid Link success callback triggered');
    onSuccess(public_token);
  }, [onSuccess]);

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

  const { open, ready } = usePlaidLink({
    token: linkToken!,
    onSuccess: onSuccessCallback,
  });

  console.log('Plaid Link state:', { linkToken, ready });

  return (
    <Button onClick={() => open()} disabled={!ready}>
      Connect a bank account
    </Button>
  );
};

export default PlaidLinkComponent;
