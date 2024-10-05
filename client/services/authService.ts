import { graphqlClient } from '@/lib/graphql-client';
import { gql } from 'graphql-request';
import Cookies from 'js-cookie';

const REFRESH_TOKEN_MUTATION = gql`
  mutation RefreshToken {
    refreshToken {
      accessToken
      refreshToken
    }
  }
`;

const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout
  }
`;

export const authService = {
  refreshToken: async () => {
    console.log('Refreshing token...');
    const response = await graphqlClient.request(REFRESH_TOKEN_MUTATION);
    return response.refreshToken;
  },

  logout: async () => {
    try {
      await graphqlClient.request(LOGOUT_MUTATION);
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      Cookies.remove('accessToken');
      Cookies.remove('refreshToken');
      Cookies.remove('loggedIn');
    }
  },
};