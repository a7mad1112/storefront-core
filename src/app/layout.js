import "./globals.css";

export const metadata = {
  title: "GB Store — متجر الهدايا والاكسسوارات",
  description:
    "تسوق أفضل الهدايا، الشنط، العطور، والاكسسوارات بأسعار مميزة. توصيل لجميع مناطق فلسطين.",
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
      <body>{children}</body>
    </html>
  );
}
