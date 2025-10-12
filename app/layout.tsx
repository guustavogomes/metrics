import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/providers/query-provider";
import { SessionProvider } from "@/providers/session-provider";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Waffle Metrics",
    template: "%s | Waffle Metrics",
  },
  description: "Sistema de análise e métricas para newsletters Beehiiv. Acompanhe aberturas, cliques, crescimento e muito mais.",
  keywords: ["newsletter", "metrics", "analytics", "beehiiv", "email marketing", "statistics"],
  authors: [{ name: "Waffle Metrics" }],
  creator: "Waffle Metrics",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    title: "Waffle Metrics",
    description: "Sistema de análise e métricas para newsletters Beehiiv",
    siteName: "Waffle Metrics",
  },
  twitter: {
    card: "summary_large_image",
    title: "Waffle Metrics",
    description: "Sistema de análise e métricas para newsletters Beehiiv",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <SessionProvider>
          <QueryProvider>
            {children}
            <Toaster position="top-right" richColors />
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
