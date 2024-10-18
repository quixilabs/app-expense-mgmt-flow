"use client"

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Receipt, FileText, Settings } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/transactions', label: 'Transactions', icon: Receipt },
  { href: '/dashboard/reports', label: 'Reports', icon: FileText },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="w-64 bg-card border-r p-4 space-y-4">
      <div className="font-bold text-2xl mb-6">ExpenseFlow</div>
      {navItems.map((item) => (
        <Link key={item.href} href={item.href}>
          <Button
            variant="ghost"
            className={cn(
              'w-full justify-start',
              pathname === item.href && 'bg-accent'
            )}
          >
            <item.icon className="mr-2 h-4 w-4" />
            {item.label}
          </Button>
        </Link>
      ))}
    </nav>
  );
}
