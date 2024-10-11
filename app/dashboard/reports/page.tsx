import { ReportGenerator } from '@/components/dashboard/report-generator';

export default function ReportsPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Financial Reports</h1>
      <ReportGenerator />
    </div>
  );
}