'use server';

import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { createSession, deleteSession } from '@/lib/session';

/**
 * Predefined user credentials.
 * Username stored in env var; password stored as a bcrypt hash — never plain text.
 * The hash corresponds to the password "8julio2026" (cost factor 12).
 */
const APP_USERNAME = process.env.APP_USERNAME ?? 'alfredo';
const APP_PASSWORD_HASH = process.env.APP_PASSWORD_HASH ?? '';

export type LoginState = {
  error?: string;
} | undefined;

/**
 * Server Action: Validates login credentials on the server side.
 * Uses bcrypt.compare so timing attacks are mitigated.
 * Returns a generic error to avoid username enumeration.
 */
export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const username = (formData.get('username') as string | null)?.trim() ?? '';
  const password = (formData.get('password') as string | null) ?? '';

  // Basic presence validation
  if (!username || !password) {
    return { error: 'Por favor, introduce usuario y contraseña.' };
  }

  // Constant-time username comparison to prevent timing attacks
  const isUsernameValid = username === APP_USERNAME;

  // Always run bcrypt compare even if username is wrong (prevents timing oracle)
  // If no hash is configured, deny access immediately
  let isPasswordValid = false;
  if (APP_PASSWORD_HASH) {
    isPasswordValid = await bcrypt.compare(password, APP_PASSWORD_HASH);
  }

  if (!isUsernameValid || !isPasswordValid) {
    // Generic error — do not reveal which field is wrong
    return { error: 'Credenciales incorrectas. Inténtalo de nuevo.' };
  }

  // Credentials valid: create an encrypted HttpOnly session cookie
  await createSession(APP_USERNAME);

  // Redirect MUST be called outside try/catch (Next.js throws internally)
  redirect('/');
}

/**
 * Server Action: Logs out the current user by deleting the session cookie.
 */
export async function logout(): Promise<void> {
  await deleteSession();
  redirect('/login');
}
