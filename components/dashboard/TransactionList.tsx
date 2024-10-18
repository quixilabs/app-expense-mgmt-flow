import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { getTransactions, addBusiness, Business } from '@/utils/storeUtils';

export function TransactionList() {
  const { user } = useUser();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newBusinessName, setNewBusinessName] = useState('');

  useEffect(() => {
    async function fetchTransactions() {
      if (!user) return;
      try {
        const data = await getTransactions(user.id);
        setTransactions(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchTransactions();
    }
  }, [user]);

  const handleAddBusiness = async () => {
    if (!user || !newBusinessName.trim()) return;
    try {
      const newBusiness = await addBusiness(newBusinessName.trim(), user.id);
      // Handle the new business (e.g., update state, show a success message)
      console.log('New business added:', newBusiness);
      setNewBusinessName('');
    } catch (error) {
      console.error('Error adding business:', error);
      // Handle the error (e.g., show an error message)
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (transactions.length === 0) return <div>No transactions found. Start by adding some!</div>;

  return (
    <div>
      <ul>
        {transactions.map((transaction) => (
          <li key={transaction.id}>{transaction.description}: ${transaction.amount}</li>
        ))}
      </ul>
      <div>
        <input
          type="text"
          value={newBusinessName}
          onChange={(e) => setNewBusinessName(e.target.value)}
          placeholder="Enter new business name"
        />
        <button onClick={handleAddBusiness}>Add Business</button>
      </div>
    </div>
  );
}
