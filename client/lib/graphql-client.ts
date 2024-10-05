// src/lib/graphql-client.ts

import { GraphQLClient } from 'graphql-request';

export const graphqlClient = new GraphQLClient(process.env.NEXT_PUBLIC_API_URL as string, {
  credentials: 'include', // Include cookies for authentication
  mode: 'cors',
});