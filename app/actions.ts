'use server';

import { signIn, signOut } from '@/auth';
import { AuthError } from 'next-auth';
import logger from '@/lib/logger';

export async function authenticate(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  try {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const action = formData.get('action') as string;

    if (!email || !password) {
      return 'Email and password are required.';
    }

    await signIn('credentials', {
      email,
      password,
      action: action || 'login',
      redirectTo: '/',
    });
  } catch (error) {
    if ((error as Error)?.message === 'NEXT_REDIRECT') throw error;
    if (error instanceof AuthError) {
      return (error.cause as { err?: { message?: string } })?.err?.message ?? 'Authentication failed.';
    }
    logger.error('authenticate failed', { error: error instanceof Error ? error.message : String(error) });
    return 'An unexpected error occurred. Please try again.';
  }
}

export async function handleSignOut(): Promise<void> {
  try {
    await signOut({ redirectTo: '/login' });
  } catch (error) {
    logger.error('handleSignOut failed', { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}
