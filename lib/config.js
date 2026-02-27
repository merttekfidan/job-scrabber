/**
 * Centralized environment configuration.
 * All external URLs, feature flags, and env-dependent settings in one place.
 * Replaces scattered process.env lookups and hardcoded URLs.
 */

const isProduction = process.env.NODE_ENV === 'production';

const config = {
    env: process.env.NODE_ENV || 'development',
    isProduction,

    // App
    appUrl: process.env.NEXT_PUBLIC_APP_URL || (isProduction ? 'https://huntiq.work' : 'http://localhost:3000'),

    // Database
    databaseUrl: process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL,

    // Auth
    authSecret: process.env.AUTH_SECRET,

    // AI
    groqApiKey: process.env.GROQ_API_KEY,

    // Security
    sessionCookieName: isProduction ? '__Secure-authjs.session-token' : 'authjs.session-token',
    secureCookies: isProduction,
};

export default config;
