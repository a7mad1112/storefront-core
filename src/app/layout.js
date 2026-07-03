import "./globals.css";
import { CartProvider } from "../context/CartContext";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import CartDrawer from "../components/cart/CartDrawer";

export const metadata = {
  title: "GB Store — متجر الهدايا والاكسسوارات والشنط",
  description:
    "تسوق أفضل الشنط الفاخرة، العطور، الساعات، والاكسسوارات بأسعار مميزة. توصيل سريع لجميع مناطق فلسطين.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Almarai:wght@400;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
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
