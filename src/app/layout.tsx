import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BulgeBracket.ai — Investment Banking Recruiting Command Center",
  description:
    "The most powerful AI-driven investment banking recruiting platform. Real Gmail integration, AI personalization, deep research, and full pipeline automation.",
  keywords: [
    "investment banking recruiting",
    "IB networking",
    "Goldman Sachs",
    "Moelis",
    "Evercore",
    "cold email IB",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "hsl(224, 15%, 8%)",
              border: "1px solid hsl(224, 15%, 13%)",
              color: "hsl(213, 31%, 91%)",
            },
          }}
        />
      </body>
    </html>
  );
}
