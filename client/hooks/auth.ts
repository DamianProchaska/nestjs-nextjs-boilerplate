'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { graphqlClient } from '@/lib/graphql-client';
import { gql } from 'graphql-request';
import { useAuth } from '@/context/AuthContext';

const REQUEST_PASSWORDLESS_LOGIN_MUTATION = gql`
  mutation requestPasswordlessSignupOrLogin($data: PasswordlessLoginInput!) {
    requestPasswordlessSignupOrLogin(data: $data)
  }
`;

const REQUEST_PASSWORDLESS_SIGNUP_MUTATION = gql`
  mutation requestPasswordlessSignupOrLogin($email: String!) {
    requestPasswordlessSignupOrLogin(data: { email: $email })
  }
`;

const VERIFY_OTP_MUTATION = gql`
  mutation VerifyOTP($data: VerifyOtpInput!) {
    verifyOTP(data: $data) {
      accessToken
      refreshToken
      user {
        id
        email
        firstname
        lastname
      }
    }
  }
`;

const VERIFY_MAGIC_LINK_MUTATION = gql`
  mutation VerifyMagicLink($token: String!) {
    verifyMagicLink(token: $token) {
      accessToken
      refreshToken
      user {
        id
        email
        firstname
        lastname
      }
    }
  }
`;

export function useRequestPasswordlessLogin() {
  return useMutation({
    mutationFn: async (data: { email: string }) => {
      return graphqlClient.request(REQUEST_PASSWORDLESS_LOGIN_MUTATION, {
        data,
      });
    },
    onError: (error: any) => {
      console.error('Error requesting passwordless login:', error);
    },
  });
}

export function useRequestPasswordlessSignup() {
  return useMutation({
    mutationFn: async (data: { email: string }) => {
      return graphqlClient.request(REQUEST_PASSWORDLESS_SIGNUP_MUTATION, {
        email: data.email,
      });
    },
    onError: (error: any) => {
      console.error('Error requesting passwordless signup:', error);
    },
  });
}

export function useVerifyOtp() {
  const queryClient = useQueryClient();
  const { setIsAuthenticated } = useAuth();

  return useMutation({
    mutationFn: async (data: { email: string; otp: string }) => {
      const response = await graphqlClient.request(VERIFY_OTP_MUTATION, {
        data,
      });
      return response.verifyOTP.user;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(['me'], user);
      setIsAuthenticated(true);
    },
    onError: (error: any) => {
      console.error('Error verifying OTP:', error);
    },
  });
}

export function useVerifyMagicLink() {
  const queryClient = useQueryClient();
  const { setIsAuthenticated } = useAuth();

  return useMutation({
    mutationFn: async (token: string) => {
      const response = await graphqlClient.request(VERIFY_MAGIC_LINK_MUTATION, {
        token,
      });
      return response.verifyMagicLink.user;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(['me'], user);
      setIsAuthenticated(true);
    },
    onError: (error: any) => {
      console.error('Error verifying magic link:', error);
    },
  });
}

export function useLogout() {
  const { logout } = useAuth();

  return useMutation({
    mutationFn: async () => {
      await logout();
    },
    onSuccess: async () => {
      // Additional actions if needed after logout
    },
    onError: (error) => {
      console.error('Error logging out:', error);
    },
  });
}