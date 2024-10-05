'use client';
import React from 'react';
import ThemeProvider from './ThemeToggle/theme-provider';
import { ReactQueryProvider } from '@/lib/react-query';
import { AuthProvider } from '@/context/AuthContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <ReactQueryProvider>
        <AuthProvider>{children}</AuthProvider>
      </ReactQueryProvider>
    </ThemeProvider>
  );
}