import { NextResponse } from 'next/server';

const locales = ['ar', 'en', 'he'];
const defaultLocale = 'ar';

function getLocaleFromHeaders(request) {
  // 1. Check cookie preference
  const cookieLocale = request.cookies.get('preferred_locale')?.value;
  if (cookieLocale && locales.includes(cookieLocale)) {
    return cookieLocale;
  }

  // 2. Check Accept-Language header
  const acceptLang = request.headers.get('accept-language') || '';
  for (const locale of locales) {
    if (acceptLang.includes(locale)) {
      return locale;
    }
  }

  // 3. Default
  return defaultLocale;
}

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Skip internal paths, API routes, static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.') // static files (images, css, etc.)
  ) {
    return;
  }

  // Check if pathname already has a locale prefix
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) return;

  // Redirect to locale-prefixed path
  const locale = getLocaleFromHeaders(request);
  request.nextUrl.pathname = `/${locale}${pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  matcher: [
    // Match all paths except _next, api, and static files
    '/((?!_next|api|favicon\\.ico|.*\\.).*)',
  ],
};
