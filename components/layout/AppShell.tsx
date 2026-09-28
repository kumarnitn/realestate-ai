import React from 'react';
import AppHeader from '@/components/layout/AppHeader';

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <AppHeader />
      <main className="flex-1 container mx-auto p-4">
        {children}
      </main>
    </div>
  );
}
