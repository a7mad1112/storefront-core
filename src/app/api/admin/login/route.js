import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';

function getEnvValue(key, fallback = '') {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  try {
    const { getCloudflareContext } = require('@opennextjs/cloudflare');
    const ctx = getCloudflareContext();
    if (ctx && ctx.env && ctx.env[key]) {
      return ctx.env[key];
    }
  } catch (e) {
    // Ignore outside Cloudflare Workers context
  }
  return fallback;
}

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'يرجى إدخال البريد الإلكتروني وكلمة المرور' },
        { status: 400 }
      );
    }

    const storeId = getEnvValue('NEXT_PUBLIC_STORE_ID', 'eloria');
    const envAdminEmail = getEnvValue('ADMIN_EMAIL');
    const envAdminPassword = getEnvValue('ADMIN_PASSWORD');
    const allowedEmailsStr = getEnvValue('ALLOWED_ADMIN_EMAILS') || getEnvValue('NEXT_PUBLIC_ALLOWED_ADMIN_EMAILS') || envAdminEmail || '';
    const allowedEmails = allowedEmailsStr
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    const inputEmail = email.trim().toLowerCase();

    // 1. Direct environment variable credentials check
    // Matches if input email equals ADMIN_EMAIL OR is in ALLOWED_ADMIN_EMAILS, and password matches ADMIN_PASSWORD
    const isEmailAllowed = (envAdminEmail && inputEmail === envAdminEmail.trim().toLowerCase()) || allowedEmails.includes(inputEmail);

    if (envAdminPassword && isEmailAllowed && password === envAdminPassword) {
      const user = {
        email: inputEmail,
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
