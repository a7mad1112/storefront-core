import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'يرجى إدخال البريد الإلكتروني وكلمة المرور' },
        { status: 400 }
      );
    }

    const storeId = process.env.NEXT_PUBLIC_STORE_ID || 'eloria';
    const envAdminEmail = process.env.ADMIN_EMAIL;
    const envAdminPassword = process.env.ADMIN_PASSWORD;
    const allowedEmailsStr = process.env.ALLOWED_ADMIN_EMAILS || process.env.NEXT_PUBLIC_ALLOWED_ADMIN_EMAILS || envAdminEmail || '';
    const allowedEmails = allowedEmailsStr
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    // 1. Direct environment variable credentials check
    if (envAdminEmail && envAdminPassword && email.trim().toLowerCase() === envAdminEmail.trim().toLowerCase() && password === envAdminPassword) {
      const user = {
        email: envAdminEmail,
        role: 'admin',
        storeId,
      };

      const response = NextResponse.json({ success: true, user });
      response.cookies.set('gb_admin_token', JSON.stringify(user), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 30 * 24 * 60 * 60, // 30 days
      });
      return response;
    }

    // 2. Supabase Auth authentication check
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData?.session?.user) {
      return NextResponse.json(
        { success: false, error: 'خطأ في تسجيل الدخول: تأكد من البريد الإلكتروني وكلمة المرور' },
        { status: 401 }
      );
    }

    const userEmail = (authData.session.user.email || '').toLowerCase();

    // Verify if this user email is authorized for this specific store instance
    if (allowedEmails.length > 0 && !allowedEmails.includes(userEmail)) {
      // Unauthorized for this store! Sign them out immediately.
      await supabase.auth.signOut();
      return NextResponse.json(
        { success: false, error: 'حسابك لا يملك صلاحية إدارة هذا المتجر. يرجى تسجيل الدخول بحساب مسؤول المتجر الصحيح.' },
        { status: 403 }
      );
    }

    const user = {
      email: userEmail,
      role: 'admin',
      storeId,
    };

    const response = NextResponse.json({ success: true, user });
    response.cookies.set('gb_admin_token', JSON.stringify(user), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });
    return response;
  } catch (err) {
    console.error('[Admin Login API Error]', err);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ غير متوقع أثناء تسجيل الدخول' },
      { status: 500 }
    );
  }
}
