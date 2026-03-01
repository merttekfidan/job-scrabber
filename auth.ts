import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import authConfig from './auth.config';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';
import logger from '@/lib/logger';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        const id = (token as { id?: string }).id;
        if (typeof id === 'string') session.user.id = id;
      }
      return session;
    },
  },
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        action: { label: 'Action', type: 'text' },
      },
      async authorize(credentials) {
        try {
          const email = credentials?.email as string | undefined;
          const password = credentials?.password as string | undefined;
          const action = credentials?.action as string | undefined;

          if (!email || !password) {
            throw new Error('Email and password are required.');
          }

          const result = await query('SELECT * FROM users WHERE email = $1', [email]);
          const existingUser = result.rows[0] as { id: string; name: string; email: string; image: string | null; password_hash: string | null } | undefined;

          if (action === 'signup') {
            if (existingUser && existingUser.password_hash) {
              throw new Error('An account with this email already exists. Please sign in.');
            }

            const hashedPassword = await bcrypt.hash(password, 12);

            if (existingUser && !existingUser.password_hash) {
              await query(
                'UPDATE users SET password_hash = $1, last_login = NOW() WHERE id = $2',
                [hashedPassword, existingUser.id]
              );
              return { id: existingUser.id, name: existingUser.name, email: existingUser.email, image: existingUser.image };
            }

            const insertResult = await query(
              'INSERT INTO users (name, email, password_hash, email_verified, last_login) VALUES ($1, $2, $3, NOW(), NOW()) RETURNING *',
              [email.split('@')[0], email, hashedPassword]
            );
            const newUser = insertResult.rows[0] as { id: string; name: string; email: string; image: string | null };
            return newUser
              ? { id: newUser.id, name: newUser.name, email: newUser.email, image: newUser.image }
              : null;
          }

          if (!existingUser) {
            throw new Error('No account found with this email. Please sign up first.');
          }

          if (!existingUser.password_hash) {
            throw new Error('Your account needs a password. Please use "Sign up" to set one.');
          }

          const isValid = await bcrypt.compare(password, existingUser.password_hash);
          if (!isValid) {
            throw new Error('Invalid password. Please try again.');
          }

          await query('UPDATE users SET last_login = NOW() WHERE id = $1', [existingUser.id]);

          return { id: existingUser.id, name: existingUser.name, email: existingUser.email, image: existingUser.image };
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Authentication failed';
          logger.error('Auth authorize failed', { message: err instanceof Error ? err.message : String(err) });
          throw new Error(message);
        }
      },
    }),
  ],
});
