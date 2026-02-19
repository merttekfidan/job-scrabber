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
            },
            async authorize(credentials) {
                const email = credentials.email;
                const code = credentials.code;

                if (!email || !code) return null;

                // MOCK OTP VERIFICATION
                if (code !== '123456') return null;

                try {
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
