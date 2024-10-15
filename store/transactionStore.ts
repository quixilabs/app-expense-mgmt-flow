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
  hasBeenCleared: boolean;
  clearStore: () => void;
}

// Define initial state
const initialState = {
  transactions: [],
  plaidAccessToken: null,
  hasBeenCleared: false,
};

export const useTransactionStore = create<TransactionStore>()(
  persist(
    (set) => ({
      ...initialState,
      addTransactions: (newTransactions) =>
        set((state) => ({ transactions: [...state.transactions, ...newTransactions] })),
      updateTransaction: (id, updates) =>
        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        })),
      setPlaidAccessToken: (token) => set({ plaidAccessToken: token }),
      clearStore: () => set({ ...initialState, hasBeenCleared: true }),
    }),
    {
      name: 'transaction-store',
      storage: createJSONStorage(() => {
        if (typeof window !== 'undefined') {
          return localStorage;
        }
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
    }
  )
);

// Add this line at the end of the file
console.log('transactionStore loaded');
