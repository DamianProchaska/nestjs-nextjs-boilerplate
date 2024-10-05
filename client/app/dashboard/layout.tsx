"use client";

import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import { GetServerSideProps, Metadata } from 'next';
import { parseCookies } from 'nookies';
import { useEffect, useState } from 'react';
import { useUser } from '@/hooks/useUser';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

// export const metadata: Metadata = {
//   title: 'Next Shadcn Dashboard Starter',
//   description: 'Basic dashboard with Next.js and Shadcn'
// };

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated === false) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  if (isAuthenticated === false) {
    return null;
  }

  return (
    <div className="flex">
      <Sidebar />
      <main className="w-full flex-1 overflow-hidden">
        <Header />
        {children}
      </main>
    </div>
  );
}
