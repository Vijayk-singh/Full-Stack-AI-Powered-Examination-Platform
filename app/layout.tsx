import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import QueryProvider from "../components/QueryProvider";
import AuthHydrator from "../components/AuthHydrator";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "EduGauge AI | Smart AI-Powered Examination Platform",
  description: "An enterprise-grade online testing and assessment engine with automatic AI question creation, proctoring controls, and student performance insights.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} h-full antialiased dark`}
    >
      <body className="min-h-full font-sans bg-slate-950 text-slate-100 flex flex-col">
        <QueryProvider>
          <AuthHydrator />
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}

