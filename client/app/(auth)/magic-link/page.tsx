'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useVerifyMagicLink } from '@/hooks/auth';

export default function MagicLinkVerificationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const verifyMagicLink = useVerifyMagicLink();

  useEffect(() => {
    if (token) {
      verifyMagicLink.mutate(token, {
        onSuccess: () => {
          // Redirect to dashboard after successful login
          router.replace('/dashboard');
        },
        onError: () => {
          // Redirect to login page on error
          router.replace('/login');
        },
      });
    } else {
      // If no token, redirect to login
      router.replace('/login');
    }
  }, [token, verifyMagicLink, router]);

  return <div>Verifying magic link...</div>;
}