import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface Transaction {
  id: string;
  date: string;
  description: string;
  cardMember: string;
  accountNumber: string;
  amount: number;
  businessId: string;
}

interface TransactionStore {
  transactions: Transaction[];
  addTransactions: (newTransactions: Transaction[]) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  plaidAccessToken: string | null;
  setPlaidAccessToken: (token: string) => void;
}

export const useTransactionStore = create<TransactionStore>()(
  persist(
    (set) => ({
      transactions: [],
      addTransactions: (newTransactions) =>
        set((state) => ({ transactions: [...state.transactions, ...newTransactions] })),
      updateTransaction: (id, updates) =>
        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        })),
      plaidAccessToken: null,
      setPlaidAccessToken: (token) => set({ plaidAccessToken: token }),
    }),
    {
      name: 'transaction-store',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : null)),
    }
  )
);

// Add this line at the end of the file
console.log('transactionStore loaded');
