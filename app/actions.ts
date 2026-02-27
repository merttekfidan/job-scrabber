'use server';

import { signIn, signOut } from '@/auth';
import { AuthError } from 'next-auth';
import { cookies } from 'next/headers';
import { verifyBypassPayload } from '@/lib/bypass-cookie';
import { query } from '@/lib/db';

export async function authenticate(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  try {
    const email = formData.get('email') as string;
    const code = formData.get('code') as string;
    if (!email || !code) {
      return 'Email and verification code are required.';
    }
    await signIn('credentials', {
      email,
      code,
      redirectTo: '/',
    });
  } catch (error) {
    if ((error as Error)?.message === 'NEXT_REDIRECT') throw error;
    if (error instanceof AuthError) {
      return (error.cause as { err?: { message?: string } })?.err?.message ?? 'Authentication failed.';
    }
    console.error('[authenticate] Error:', error);
    return 'An unexpected error occurred. Please try again.';
  }
}

export async function handleSignOut(): Promise<void> {
  try {
    await signOut({ redirectTo: '/login' });
  } catch (error) {
    console.error('[handleSignOut] Error:', error);
    throw error;
  }
}

export async function completeBypassLogin(email: string): Promise<string | undefined> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('bypass_pending')?.value;
    if (!token) {
      console.warn('[completeBypassLogin] No bypass_pending cookie');
      return 'Session expired. Please request a new login code.';
    }

    const payload = verifyBypassPayload(token);
    if (!payload || payload.email !== email) {
      console.warn('[completeBypassLogin] Invalid or mismatched bypass payload');
      return 'Invalid or expired bypass. Please request a new login code.';
    }

    const codeResult = await query(
      'SELECT id, email, code, used, expires_at FROM verification_codes WHERE id = $1',
      [payload.codeId]
    );
    const row = codeResult.rows[0] as { id: number; email: string; code: string; used: boolean; expires_at: Date } | undefined;
    if (!row || row.email !== email || row.used || new Date() > new Date(row.expires_at)) {
      return 'Invalid or expired bypass. Please request a new login code.';
    }

    // Don't mark code as used here — authorize() will do it after successful verification

    try {
      await signIn('credentials', {
        email,
        code: row.code,
        redirectTo: '/',
      });
    } catch (error) {
      if ((error as Error)?.message === 'NEXT_REDIRECT') throw error;
      if (error instanceof AuthError) {
        return (error.cause as { err?: { message?: string } })?.err?.message ?? 'Authentication failed.';
      }
      console.error('[completeBypassLogin] signIn error:', error);
      throw error;
    }
  } catch (error) {
    if ((error as Error)?.message === 'NEXT_REDIRECT') throw error;
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[completeBypassLogin] Error:', error);
    return msg || 'An error occurred. Please request a new login code and try again.';
  }
}
