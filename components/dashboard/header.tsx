"use client"

import { UserButton } from '@clerk/nextjs';

export function Header() {
  return (
    <header className="bg-card border-b p-4 flex justify-end">
      <UserButton afterSignOutUrl="/" />
    </header>
  );
}
