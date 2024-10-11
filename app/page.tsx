import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-background to-secondary">
      <main className="text-center">
        <h1 className="text-4xl font-bold mb-6">Welcome to ExpenseFlow</h1>
        <p className="text-xl mb-8">Streamline your expense management across multiple businesses</p>
        <Link href="/dashboard">
          <Button size="lg">Get Started</Button>
        </Link>
      </main>
    </div>
  );
}