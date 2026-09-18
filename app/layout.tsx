import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

import { CookieConsent } from "@/components/ui/cookie-consent";
import { LOGO_SRC } from "@/lib/constants/brand";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Primo Invest | Dashboard",
  description: "Dashboard institucional da PRIMO INVEST",
  icons: { icon: LOGO_SRC },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${manrope.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
