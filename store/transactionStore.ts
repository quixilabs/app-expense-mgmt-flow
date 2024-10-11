import { create } from 'zustand';

export interface Transaction {
  id: number;
  date: string;
  description: string;
  amount: number;
  businessId: string;
  cardMember: string;
  accountNumber: string;
}

interface TransactionStore {
  transactions: Transaction[];
  addTransactions: (newTransactions: Transaction[]) => void;
  updateTransaction: (id: number, updates: Partial<Transaction>) => void;
}

export const useTransactionStore = create<TransactionStore>((set) => ({
  transactions: [],
  addTransactions: (newTransactions) => {
    // console.log('Adding transactions:', newTransactions);
    set((state) => {
      const updatedTransactions = [...state.transactions, ...newTransactions];
    //   console.log('Updated transactions:', updatedTransactions);
      return { transactions: updatedTransactions };
    });
  },
  updateTransaction: (id, updates) => {
    // console.log('Updating transaction:', { id, updates });
    set((state) => {
      const updatedTransactions = state.transactions.map((transaction) =>
        transaction.id === id ? { ...transaction, ...updates } : transaction
      );
    //   console.log('Updated transactions:', updatedTransactions);
      return { transactions: updatedTransactions };
    });
  },
}));

// Add this line at the end of the file
// console.log('transactionStore loaded');