import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ivoire Agents AI",
  description: "Plateforme d'agents IA pour les entreprises ivoiriennes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" style={{ fontFamily: 'var(--font-inter), Inter, -apple-system, sans-serif', fontFeatureSettings: '"cv02","cv03","cv04","cv11"', WebkitFontSmoothing: 'antialiased' }}>{children}</body>
    </html>
  );
}
