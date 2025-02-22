import type React from 'react';
import { AlertCircle } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-50">
      <header className="h-16 flex items-center justify-between px-4 border-b border-gray-800">
        <h1 className="text-2xl font-bold">
          <span className="sr-only">
            Visual Assistant - AI-Powered Navigation Aid
          </span>
          Visual Assistant
        </h1>
        <button
          aria-label="Help"
          className="p-2 rounded-full hover:bg-gray-800 transition-colors"
        >
          <AlertCircle className="w-6 h-6" />
        </button>
      </header>
      <main className="h-[calc(100vh-4rem)]">{children}</main>
    </div>
  );
}
