import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SignInButton, SignUpButton } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function Home() {
  const { userId } = await auth();

  if (userId) {
    redirect('/dashboard');
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-background to-secondary">
      <main className="text-center">
        <h1 className="text-4xl font-bold mb-6">Welcome to ExpenseFlow</h1>
        <p className="text-xl mb-8">Streamline your expense management across multiple businesses</p>
        <div className="space-x-4">
          <SignInButton mode="modal">
            <Button variant="outline">Sign In</Button>
          </SignInButton>
          <SignUpButton mode="modal">
            <Button>Sign Up</Button>
          </SignUpButton>
        </div>
      </main>
    </div>
  );
}
