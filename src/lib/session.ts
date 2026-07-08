import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const secretKey = process.env.SESSION_SECRET;

function getEncodedKey(): Uint8Array {
  if (!secretKey) {
    throw new Error('SESSION_SECRET environment variable is not set.');
  }
  return new TextEncoder().encode(secretKey);
}

export interface SessionPayload {
  userId: string;
  expiresAt: Date;
}

/**
 * Encrypts a session payload into a signed JWT.
 */
export async function encrypt(payload: SessionPayload): Promise<string> {
  return new SignJWT({ userId: payload.userId, expiresAt: payload.expiresAt.toISOString() })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(getEncodedKey());
}

/**
 * Decrypts and verifies a JWT session token.
 * Returns null if invalid or expired.
 */
export async function decrypt(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getEncodedKey(), {
      algorithms: ['HS256'],
    });
    return {
      userId: payload.userId as string,
      expiresAt: new Date(payload.expiresAt as string),
    };
  } catch {
    // Invalid or expired token — intentionally silent
    return null;
  }
}

/**
 * Creates a session cookie after successful login.
 * Sets HttpOnly, Secure, SameSite=lax to prevent XSS and CSRF attacks.
 */
export async function createSession(userId: string): Promise<void> {
  const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 hours
  const session = await encrypt({ userId, expiresAt });
  const cookieStore = await cookies();

  cookieStore.set('session', session, {
    httpOnly: true,
    // Let the browser/Next.js infer secure flag based on connection protocol, 
    // to fix Safari dropping it on http://localhost
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  });
}

/**
 * Deletes the session cookie on logout.
 */
export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}

/**
 * Returns the current session payload, or null if not authenticated.
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  return await decrypt(token);
}
