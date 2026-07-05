import { Almarai } from "next/font/google";
import { Inter } from "next/font/google";
import { notFound } from "next/navigation";
import "../globals.css";
import { CartProvider } from "../../context/CartContext";
import { DictionaryProvider } from "../../context/DictionaryContext";
import Header from "../../components/layout/Header";
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

  return (
    <html lang={lang} dir={dir} className={fontClass}>
      <body className={fontBody}>
        <CartProvider lang={lang} dict={dict}>
          <DictionaryProvider dictionary={dict} lang={lang}>
            <Header lang={lang} />
            <CartDrawer />
            <VisitTracker />
            <main style={{ flexGrow: 1 }}>{children}</main>
            <Footer lang={lang} dict={dict} />
          </DictionaryProvider>
        </CartProvider>
      </body>
    </html>
  );
}
