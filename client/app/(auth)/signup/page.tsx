'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ChevronLeft } from 'lucide-react';
import PasswordlessLoginForm from '@/components/auth/PasswordlessLoginForm';
import PasswordlessSignUpForm from '@/components/auth/PasswordlessSignUpForm';

export default function LoginPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [showEmailForm, setShowEmailForm] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, router]);

  if (isAuthenticated) {
    return null;
  }

  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:8080/auth/google';
  };

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center bg-black text-white">
      <Link
        href="/"
        className={cn(
          "absolute left-4 top-4 md:left-8 md:top-8 text-white",
          "hover:text-gray-300 transition-colors"
        )}
      >
        <ChevronLeft className="mr-2 h-4 w-4 inline" />
        Back
      </Link>
      <div className="mx-auto flex w-full flex-col items-center justify-center gap-6 sm:w-[350px]">
        <div className="flex flex-col gap-2 text-center">
          <div className="mb-4">
            {/* Replace with your actual logo */}
            <div className="w-12 h-12 bg-white rounded-full mx-auto"></div>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Sign up
          </h1>
        </div>
        {!showEmailForm ? (
          <div className="w-full space-y-4">
            <Button
              onClick={handleGoogleLogin}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              Continue with Google
            </Button>
            <Button
              onClick={() => setShowEmailForm(true)}
              className="w-full bg-gray-800 hover:bg-gray-700"
            >
              Continue with email
            </Button>
          </div>
        ) : (
          <PasswordlessSignUpForm />
        )}
      </div>
    </div>
  );
}