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
    trustHost: true,
    ...authConfig,
    cookies: {
        sessionToken: {
            name: process.env.NODE_ENV === 'production'
                ? '__Secure-authjs.session-token'
                : 'authjs.session-token',
            options: {
                httpOnly: true,
                sameSite: 'none',
                path: '/',
                secure: true,
                domain: process.env.NODE_ENV === 'production' ? '.huntiq.work' : undefined,
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

                if (!email || !code) throw new Error("Please provide both email and code.");

                try {
                    // Check if code exists for this email regardless of validity
                    const allCodes = await pool.query(
                        `SELECT * FROM verification_codes WHERE email = $1 ORDER BY created_at DESC LIMIT 1`,
                        [email]
                    );

                    if (allCodes.rows.length === 0) {
                        throw new Error("No code requested for this email. Please click 'Send Login Code'.");
                    }

                    const latestCode = allCodes.rows[0];

                    if (code !== latestCode.code) {
                        throw new Error("Invalid 6-digit code. Please check your email and try again.");
                    }

                    if (latestCode.used) {
                        throw new Error("This code has already been used. Please request a new one.");
                    }

                    if (new Date() > new Date(latestCode.expires_at)) {
                        throw new Error("This code has expired. Please request a new one.");
                    }
                    // Mark code as used
                    await pool.query(
                        'UPDATE verification_codes SET used = TRUE WHERE id = $1',
                        [latestCode.id]
                    );

                    // Check if user exists
                    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
                    let user = result.rows[0];

                    if (!user) {
                        // Create new user (Auto-Register)
                        const insertResult = await pool.query(
                            'INSERT INTO users (name, email, email_verified, image, last_login) VALUES ($1, $2, $3, $4, NOW()) RETURNING *',
                            [email.split('@')[0], email, new Date(), null]
                        );
                        user = insertResult.rows[0];
                    } else {
                        // Update last_login for existing user
                        await pool.query(
                            'UPDATE users SET last_login = NOW() WHERE id = $1',
                            [user.id]
                        );
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
