/**
 * Edge-safe auth for middleware only.
 * Do not import @/auth here — it pulls in Node (db, bcrypt, crypto).
 * Use this file only in middleware.ts.
 */
import NextAuth from 'next-auth';
import authConfig from './auth.config';

export const { auth } = NextAuth(authConfig);
