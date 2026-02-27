import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import authConfig from './auth.config';
import { query } from '@/lib/db';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: 'jwt' },
  trustHost: true,
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
        session.user.id = token.id;
      }
      return session;
    },
  },
  providers: [
    Credentials({
      name: 'Email',
      credentials: {
        email: { label: 'Email', type: 'email' },
        code: { label: 'Code', type: 'text' },
      },
      async authorize(credentials) {
        try {
          const email = credentials?.email as string | undefined;
          const code = credentials?.code as string | undefined;

          if (!email || !code) {
            throw new Error('Please provide both email and code.');
          }

          const allCodes = await query(
          `SELECT * FROM verification_codes WHERE email = $1 ORDER BY created_at DESC LIMIT 1`,
          [email]
        );

        if (allCodes.rows.length === 0) {
          throw new Error("No code requested for this email. Please click 'Send Login Code'.");
        }

        const latestCode = allCodes.rows[0] as {
          id: string;
          code: string;
          used: boolean;
          expires_at: Date;
        };

        if (code !== latestCode.code) {
          throw new Error('Invalid 6-digit code. Please check your email and try again.');
        }

        if (latestCode.used) {
          throw new Error('This code has already been used. Please request a new one.');
        }

        if (new Date() > new Date(latestCode.expires_at)) {
          throw new Error('This code has expired. Please request a new one.');
        }

        await query('UPDATE verification_codes SET used = TRUE WHERE id = $1', [latestCode.id]);

        const result = await query('SELECT * FROM users WHERE email = $1', [email]);
        let user = result.rows[0] as { id: string; name: string; email: string; image: string | null } | undefined;

        if (!user) {
          const insertResult = await query(
            'INSERT INTO users (name, email, email_verified, image, last_login) VALUES ($1, $2, $3, $4, NOW()) RETURNING *',
            [email.split('@')[0], email, new Date(), null]
          );
          user = insertResult.rows[0] as typeof user;
        } else {
          await query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);
        }

          return user
            ? {
                id: user.id,
                name: user.name,
                email: user.email,
                image: user.image,
              }
            : null;
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Authentication failed';
          console.error('[Auth] authorize error:', err);
          throw new Error(message);
        }
      },
    }),
  ],
});
