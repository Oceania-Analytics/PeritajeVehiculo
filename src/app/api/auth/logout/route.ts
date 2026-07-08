import { NextResponse } from 'next/server';
import { deleteSession } from '@/lib/session';

/**
 * GET /api/auth/logout
 * Deletes the session cookie and redirects to the login page.
 * Using GET for simplicity (triggered via a link/form POST also works).
 */
export async function GET() {
  await deleteSession();
  return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'));
}

/**
 * POST /api/auth/logout
 * Same behavior — supports both GET and POST for form action compatibility.
 */
export async function POST() {
  await deleteSession();
  return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'));
}
