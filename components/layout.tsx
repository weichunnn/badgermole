import type React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-50">
      <main className="h-[calc(100vh-4rem)]">{children}</main>
    </div>
  );
}
