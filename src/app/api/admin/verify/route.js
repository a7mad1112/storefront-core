import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { email } = (await request.json().catch(() => ({}))) || {};
    const storeId = process.env.NEXT_PUBLIC_STORE_ID || 'eloria';
    const envAdminEmail = process.env.ADMIN_EMAIL;
    const allowedEmailsStr = process.env.ALLOWED_ADMIN_EMAILS || process.env.NEXT_PUBLIC_ALLOWED_ADMIN_EMAILS || envAdminEmail || '';
    const allowedEmails = allowedEmailsStr
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    // 1. If email passed (e.g. from Supabase auth session on client), check authorization
    if (email) {
      const userEmail = email.trim().toLowerCase();
      if (allowedEmails.length > 0 && !allowedEmails.includes(userEmail)) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized store access' },
          { status: 403 }
        );
      }
      return NextResponse.json({ success: true, user: { email: userEmail, role: 'admin', storeId } });
    }

    // 2. Otherwise check cookie
    const tokenCookie = request.cookies?.get?.('gb_admin_token')?.value;
    if (!tokenCookie) {
      return NextResponse.json({ success: false, error: 'No session' }, { status: 401 });
    }

    const user = JSON.parse(tokenCookie);
    if (user.storeId && user.storeId !== storeId) {
      return NextResponse.json({ success: false, error: 'Store mismatch' }, { status: 403 });
    }

    return NextResponse.json({ success: true, user });
  } catch (err) {
    console.error('[Admin Verify API Error]', err);
    return NextResponse.json({ success: false, error: 'Verification failed' }, { status: 500 });
  }
}
