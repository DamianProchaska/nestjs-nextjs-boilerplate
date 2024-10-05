// src/hooks/useUser.ts

'use client';

import { useQuery } from '@tanstack/react-query';
import { graphqlClient } from '@/lib/graphql-client';
import { gql, ClientError } from 'graphql-request';
import { useAuth } from '@/context/AuthContext';

const ME_QUERY = gql`
  query Me {
    me {
      id
      email
      firstname
      lastname
    }
  }
`;

type User = {
  id: string;
  email: string;
  firstname?: string;
  lastname?: string;
};

export function useUser() {
  const { refreshToken, logout } = useAuth();

  return useQuery<User>({
    queryKey: ['me'],
    queryFn: async () => {
      try {
        const data = await graphqlClient.request<{ me: User }>(ME_QUERY);
        return data.me;
      } catch (error) {
        if (error instanceof ClientError) {
          const isUnauthenticated = error.response.errors.some(
            (err) => err.extensions?.code === 'UNAUTHENTICATED',
          );

          if (isUnauthenticated) {
            try {
              console.log('0.unauthorized');
              console.log('Calling refreshToken function...');

              await refreshToken();

              console.log('Refresh token success');
              // Retry fetching user data after refreshing token
              const data = await graphqlClient.request<{ me: User }>(ME_QUERY);
              return data.me;
            } catch (refreshError) {
              // If refresh fails, logout the user
              await logout();
              throw refreshError;
            }
          }
        }
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  });
}