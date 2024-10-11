import dynamic from 'next/dynamic';

const TransactionImport = dynamic(() => import('@/components/dashboard/transaction-import'), { ssr: false });
const TransactionList = dynamic(() => import('@/components/dashboard/transaction-list'), { ssr: false });

export default function TransactionsPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Transactions</h1>
      <TransactionImport />
      <TransactionList />
    </div>
  );
}