import { BusinessOverview } from '@/components/dashboard/business-overview';
import { RecentTransactions } from '@/components/dashboard/recent-transactions';

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <BusinessOverview />
      <RecentTransactions />
    </div>
  );
}