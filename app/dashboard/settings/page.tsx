import dynamic from 'next/dynamic';

const RuleManager = dynamic(() => import('@/components/dashboard/rule-manager'), {
  ssr: false,
  loading: () => <p>Loading...</p>
});

export default function SettingsPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      <RuleManager />
      {/* Add other settings components here */}
    </div>
  );
}
