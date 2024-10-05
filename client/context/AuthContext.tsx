'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import Cookies from 'js-cookie';
import { authService } from '@/services/authService';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { graphqlClient } from '@/lib/graphql-client';
import { gql } from 'graphql-request';
import { useRouter } from 'next/navigation';

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

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  refreshToken: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  isLoading: true,
  refreshToken: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ['me'],
    queryFn: async () => {
      try {
        const data = await graphqlClient.request<{ me: User }>(ME_QUERY);
        return data.me;
      } catch (error) {
        if (error.response?.errors?.some(err => err.extensions?.code === 'UNAUTHENTICATED')) {
          throw new Error('UNAUTHENTICATED');
        }
        throw error;
      }
    },
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const refreshToken = async () => {
    try {
      await authService.refreshToken();
      // Invalidate and refetch user data
      await queryClient.invalidateQueries({ queryKey: ['me'] });
    } catch (error) {
      console.error('Error refreshing token:', error);
      await logout();
    }
  };

  const logout = async () => {
    await authService.logout();
    setIsAuthenticated(false);
    queryClient.setQueryData(['me'], null);
    // router.push('/login');
  };

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        setIsAuthenticated(true);
        Cookies.set('loggedIn', '1');
      } else {
        setIsAuthenticated(false);
        Cookies.remove('loggedIn');
      }
    }
  }, [user, isLoading]);

  useEffect(() => {
    if (error?.message === 'UNAUTHENTICATED') {
      refreshToken();
    }
  }, [error]);

  const value = {
    isAuthenticated,
    user,
    isLoading,
    refreshToken,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};