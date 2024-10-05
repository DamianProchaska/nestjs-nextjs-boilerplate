'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRequestPasswordlessLogin, useVerifyOtp } from '@/hooks/auth';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const emailSchema = z.object({
  email: z.string().email({ message: 'Enter a valid email address' }),
});

const otpSchema = z.object({
  otp: z.string().length(6, { message: 'OTP must be 6 digits' }),
});

type EmailFormValues = z.infer<typeof emailSchema>;
type OtpFormValues = z.infer<typeof otpSchema>;

// Email Form Component
function EmailForm({ onSuccess }: { onSuccess: (email: string) => void }) {
  const form = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: '',
    },
  });

  const requestPasswordlessLogin = useRequestPasswordlessLogin();

  const onSubmit = async (values: EmailFormValues) => {
    try {
      await requestPasswordlessLogin.mutateAsync({ email: values.email });
      onSuccess(values.email);
    } catch (error: any) {
      form.setError('email', { message: error.message });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  {...field}
                  disabled={requestPasswordlessLogin.isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="w-full"
          disabled={requestPasswordlessLogin.isLoading}
        >
          {requestPasswordlessLogin.isLoading ? 'Sending...' : 'Continue with Email'}
        </Button>
      </form>
    </Form>
  );
}

// OTP Form Component
function OtpForm({ email }: { email: string }) {
  const form = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: '',
    },
  });

  const verifyOtp = useVerifyOtp();

  const onSubmit = async (values: OtpFormValues) => {
    try {
      await verifyOtp.mutateAsync({ email, otp: values.otp });
      window.location.href = '/dashboard';
    } catch (error: any) {
      form.setError('otp', { message: error.message });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="otp"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Enter OTP</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder="6-digit OTP"
                  {...field}
                  disabled={verifyOtp.isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={verifyOtp.isLoading}>
          {verifyOtp.isLoading ? 'Verifying...' : 'Verify OTP'}
        </Button>
      </form>
    </Form>
  );
}

// Main Component
export default function PasswordlessLoginForm() {
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [email, setEmail] = useState('');

  const handleEmailSuccess = (email: string) => {
    setEmail(email);
    setIsOtpSent(true);
  };

  return isOtpSent ? (
    <OtpForm email={email} />
  ) : (
    <EmailForm onSuccess={handleEmailSuccess} />
  );
}