import type { Config } from './config.interface';

const config: Config = {
  nest: {
    port: 8080,
  },
  cors: {
    enabled: true,
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  },
  swagger: {
    enabled: true,
    title: 'Nestjs FTW',
    description: 'The nestjs API description',
    version: '1.5',
    path: 'api',
  },
  graphql: {
    playgroundEnabled: true,
    debug: true,
    schemaDestination: './src/schema.graphql',
    sortSchema: true,
  },
  security: {
    expiresIn: '1h',
    refreshIn: '100d',
    slidingSession: true,
    bcryptSaltOrRound: 10,
  },
};

export default (): Config => config;
