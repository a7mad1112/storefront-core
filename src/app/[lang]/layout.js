import { Almarai } from "next/font/google";
import { Inter } from "next/font/google";
import { notFound } from "next/navigation";
import "../globals.css";
import { CartProvider } from "../../context/CartContext";
import { SupplierProvider } from "../../context/SupplierContext";
import { DictionaryProvider } from "../../context/DictionaryContext";
import Header from "../../components/layout/Header";
import SupplierSwitcher from "../../components/layout/SupplierSwitcher";
import Footer from "../../components/layout/Footer";
import CartDrawer from "../../components/cart/CartDrawer";
import VisitTracker from "../../components/analytics/VisitTracker";
import { getDictionary, getDirection, hasLocale, locales } from "./dictionaries";

const almarai = Almarai({
  subsets: ["arabic"],
  weight: ["400", "700", "800"],
  display: "swap",
  variable: "--font-almarai",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "700", "800"],
  display: "swap",
  variable: "--font-inter",
});

export async function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  const STORE_NAME = process.env.NEXT_PUBLIC_STORE_NAME || 'Eloria FASHION';

  return {
    title: `${STORE_NAME} — ${dict.meta.homeTitle}`,
    description: dict.meta.homeDesc,
  };
}

export default async function LangLayout({ children, params }) {
  const { lang } = await params;

  if (!hasLocale(lang)) {
    notFound();
  }

  const dict = await getDictionary(lang);
  const dir = getDirection(lang);
  const isRtl = dir === 'rtl';

  // Choose font based on locale
  const fontClass = lang === 'en' ? inter.variable : almarai.variable;
  const fontBody = lang === 'en' ? inter.className : almarai.className;

  // Dynamic Environment Colors for White-Label Multi-Tenancy
  const themeAccent = process.env.NEXT_PUBLIC_THEME_ACCENT_COLOR || '#C59850';
  const themeAccentHover = process.env.NEXT_PUBLIC_THEME_ACCENT_HOVER || '#AD823E';
  const themeAccentSoft = process.env.NEXT_PUBLIC_THEME_ACCENT_SOFT || 'rgba(197, 152, 80, 0.15)';
  const themeBgPrimary = process.env.NEXT_PUBLIC_THEME_BG_PRIMARY || '#FDFBF7';
  const themeBgSecondary = process.env.NEXT_PUBLIC_THEME_BG_SECONDARY || '#F5F2EC';
  const themeTextPrimary = process.env.NEXT_PUBLIC_THEME_TEXT_PRIMARY || '#111111';

  return (
    <html lang={lang} dir={dir} className={fontClass}>
      <body className={fontBody}>
        <style
          id="env-theme-vars"
          dangerouslySetInnerHTML={{
            __html: `
              :root {
                --color-accent: ${themeAccent};
                --color-primary: ${themeAccent};
                --color-accent-hover: ${themeAccentHover};
                --color-accent-soft: ${themeAccentSoft};
                --color-bg-primary: ${themeBgPrimary};
                --color-bg-secondary: ${themeBgSecondary};
                --color-text-primary: ${themeTextPrimary};
              }
            `,
          }}
        />
        <CartProvider lang={lang} dict={dict}>
          <SupplierProvider>
            <DictionaryProvider dictionary={dict} lang={lang}>
              <Header lang={lang} />
              <SupplierSwitcher lang={lang} />
              <CartDrawer />
              <VisitTracker />
              <main style={{ flexGrow: 1 }}>{children}</main>
              <Footer lang={lang} dict={dict} />
            </DictionaryProvider>
          </SupplierProvider>
        </CartProvider>
      </body>
    </html>
  );
}
