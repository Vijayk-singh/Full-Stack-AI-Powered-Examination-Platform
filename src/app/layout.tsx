import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import QueryProvider from "../components/QueryProvider";
import AuthHydrator from "../components/AuthHydrator";
import GlobalToast from "../components/GlobalToast";
import ReduxProvider from "../components/ReduxProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Solvekar AI | Smart AI-Powered Examination Platform",
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
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans bg-[#f8f9fa] text-slate-800 flex flex-col">
        <ReduxProvider>
          <QueryProvider>
            <AuthHydrator />
            <GlobalToast />
            {children}
          </QueryProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}

