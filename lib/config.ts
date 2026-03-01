/**
 * Centralized environment configuration.
 * All external URLs, feature flags, and env-dependent settings in one place.
 */

const isProduction = process.env.NODE_ENV === 'production';

const config = {
  env: process.env.NODE_ENV || 'development',
  isProduction,

  appUrl: process.env.NEXT_PUBLIC_APP_URL || (isProduction ? 'https://huntiq.work' : 'http://localhost:3000'),
  databaseUrl: process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL,
  authSecret: process.env.AUTH_SECRET,
  groqApiKey: process.env.GROQ_API_KEY,
  sessionCookieName: isProduction ? '__Secure-authjs.session-token' : 'authjs.session-token',
  secureCookies: isProduction,
} as const;

export default config;
