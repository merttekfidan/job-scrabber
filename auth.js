import NextAuth from "next-auth"
import PostgreAdapter from "@auth/pg-adapter"
import Credentials from "next-auth/providers/credentials"
import { Pool } from "pg"
import authConfig from "./auth.config"

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: PostgreAdapter(pool),
    session: { strategy: "jwt" },
    ...authConfig,
    cookies: {
        sessionToken: {
            name: process.env.NODE_ENV === 'production'
                ? '__Secure-authjs.session-token'
                : 'authjs.session-token',
            options: {
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                secure: process.env.NODE_ENV === 'production',
            },
        },
    },
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
        }
    },
    providers: [
        Credentials({
            name: 'Email',
            credentials: {
                email: { label: "Email", type: "email" },
                code: { label: "Code", type: "text" },
            },
            async authorize(credentials) {
                const email = credentials.email;
                const code = credentials.code;

                if (!email || !code) return null;

                try {
                    // Verify OTP from database
                    const codeResult = await pool.query(
                        `SELECT * FROM verification_codes 
                         WHERE email = $1 AND code = $2 AND used = FALSE AND expires_at > NOW()
                         ORDER BY created_at DESC LIMIT 1`,
                        [email, code]
                    );

                    if (codeResult.rows.length === 0) {
                        // Invalid or expired code
                        return null;
                    }

                    // Mark code as used
                    await pool.query(
                        'UPDATE verification_codes SET used = TRUE WHERE id = $1',
                        [codeResult.rows[0].id]
                    );

                    // Check if user exists
                    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
                    let user = result.rows[0];

                    if (!user) {
                        // Create new user (Auto-Register)
                        const insertResult = await pool.query(
                            'INSERT INTO users (name, email, email_verified, image) VALUES ($1, $2, $3, $4) RETURNING *',
                            [email.split('@')[0], email, new Date(), null]
                        );
                        user = insertResult.rows[0];
                    }

                    return user;
                } catch (error) {
                    console.error('Auth error:', error);
                    return null;
                }
            }
        })
    ],
})
