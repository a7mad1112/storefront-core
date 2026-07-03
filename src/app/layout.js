import { Almarai } from "next/font/google";
import "./globals.css";
import { CartProvider } from "../context/CartContext";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import CartDrawer from "../components/cart/CartDrawer";

const almarai = Almarai({
  subsets: ["arabic"],
  weight: ["400", "700", "800"],
  display: "swap",
  variable: "--font-almarai",
});

export const metadata = {
  title: "Eloria FASHION — متجر الموضة والأناقة والشنط الفاخرة",
  description:
    "تسوقي أفضل الشنط الفاخرة، العطور، الساعات، والاكسسوارات بأسعار مميزة وجودة عالية. توصيل سريع لجميع مناطق فلسطين.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl" className={almarai.variable}>
      <body className={almarai.className}>
        <CartProvider>
          <Header />
          <CartDrawer />
          <main style={{ flexGrow: 1 }}>{children}</main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
