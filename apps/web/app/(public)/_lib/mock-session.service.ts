'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SAMPLE_ACCOUNTS } from './sample-accounts.constant';

// TODO(kritpavin, #70): replace with the auth provider's session once Google sign-in is real.

const COOKIE_NAME = 'thrive_mock_account';

export type MockAccount = { email: string };

/**
 * Stands in for Google redirecting back. The cookie has no expiry, so it lasts until the
 * browser closes: a refresh keeps you on the step, and nothing outlives the visit.
 */
export async function signIn(): Promise<void> {
  const [account] = SAMPLE_ACCOUNTS;
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, account.email, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
  redirect('/register/introduce-yourself');
}

export async function signOut(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  redirect('/login');
}

/**
 * The cookie is unsigned, so anyone can write one. Accepting only an email from the sample
 * list means a hand-made cookie still gets nobody in.
 */
export async function readMockAccount(): Promise<MockAccount | null> {
  const cookieStore = await cookies();
  const email = cookieStore.get(COOKIE_NAME)?.value;
  const account = SAMPLE_ACCOUNTS.find((sample) => sample.email === email);
  return account ? { email: account.email } : null;
}
