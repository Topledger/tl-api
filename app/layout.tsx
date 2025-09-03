import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/Providers/SessionProvider";
import { WalletProviderComponent } from "@/components/Providers/WalletProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Top Ledger APIs",
  description: "Powerful Solana blockchain APIs for developers. Access comprehensive blockchain data, DeFi protocols, and trading insights through our robust API infrastructure.",
  keywords: ["Solana", "API", "blockchain", "DeFi", "crypto", "trading", "developer tools"],
  authors: [{ name: "Top Ledger" }],
  creator: "Top Ledger",
  publisher: "Top Ledger",
  metadataBase: new URL("https://api.topledger.xyz"),
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "https://api.topledger.xyz/favicon.svg",
    shortcut: "https://api.topledger.xyz/favicon.svg",
    apple: "https://api.topledger.xyz/favicon.svg",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://api.topledger.xyz",
    title: "Top Ledger APIs for developers",
    description: "End to end developer platform offering scalable Solana data APIs for applications",
    siteName: "Top Ledger APIs",
    images: [
      {
        url: "https://api.topledger.xyz/tlapis.png",
        width: 1200,
        height: 630,
        alt: "Top Ledger APIs - Solana Blockchain Developer Tools",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Top Ledger APIs for developers",
    description: "End to end developer platform offering scalable Solana data APIs for applications",
    creator: "@ledger_top",
    site: "@ledger_top",
    images: [
      {
        url: "https://api.topledger.xyz/tlapis.png",
        alt: "Top Ledger APIs - Solana Blockchain Developer Tools",
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.variable} font-sans antialiased h-full`}>
        <WalletProviderComponent>
          <SessionProvider>
            {children}
          </SessionProvider>
        </WalletProviderComponent>
      </body>
    </html>
  );
}
