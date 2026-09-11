import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import { Fraunces, Hanken_Grotesk } from "next/font/google";

import "./globals.css";
import { Providers } from "@/components/providers/Providers";

// Body/UI face — distinct from the Geist-everywhere look most AI tools ship.
const sans = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
// Display face for real headings only (auth screen, empty state) — warm and a
// little editorial, fitting "grounded / foundational" without tipping serious.
const display = Fraunces({ subsets: ["latin"], variable: "--font-display", display: "swap" });

export const metadata: Metadata = {
  title: "Groundwork",
  description:
    "Grounded RAG over your business documents — cited answers, spreadsheet analytics and an AI next-step decision log.",
  applicationName: "Groundwork",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "Groundwork",
    description:
      "Upload PDFs, Word docs, spreadsheets and decks — ask questions and get answers with citations, run calculations over your data, and track the next steps an answer implies.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f6f3" },
    { media: "(prefers-color-scheme: dark)", color: "#121110" },
  ],
};

const NO_FLASH = `(function(){try{var t=localStorage.getItem('ekdp-theme')||(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');var r=document.documentElement;r.setAttribute('data-theme',t);r.classList.toggle('dark',t==='dark');r.style.colorScheme=t;}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${sans.variable} ${display.variable} ${GeistMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
