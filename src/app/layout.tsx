import type { Metadata } from "next";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import GlobalRadio from "@/components/GlobalRadio";
import { BRAND, getSiteUrl } from "@/lib/brand";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: "Constellation OS - Guia animado das empresas",
  description: BRAND.appDescription,
  keywords: [
    "empresas do grupo",
    "guia visual",
    "historias empresariais",
    "informacoes publicas",
    "clientes",
    "investidores",
  ],
  openGraph: {
    title: "Constellation OS - Guia animado das empresas",
    description: BRAND.appDescription,
    siteName: BRAND.name,
    type: "website",
    locale: "pt_BR",
    images: [
      {
        url: "/og-image.png",
        alt: BRAND.ogAlt,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    creator: BRAND.xCreator,
    site: BRAND.xCreator,
  },
  authors: [{ name: "Equipe do produto", url: BRAND.xCreatorUrl }],
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-icon.png",
  },
};

const BASE_URL = getSiteUrl();

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: BRAND.name,
  description: BRAND.ogAlt,
  url: BASE_URL,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  author: {
    "@type": "Organization",
    name: "Equipe do produto",
    url: BRAND.xCreatorUrl,
  },
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Silkscreen&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-bg font-pixel text-warm" suppressHydrationWarning>
        {children}
        <GlobalRadio />
        <Analytics />
        <SpeedInsights />
        {process.env.NEXT_PUBLIC_HIMETRICA_API_KEY && (
          <>
            <Script
              src="https://cdn.himetrica.com/tracker.js"
              data-api-key={process.env.NEXT_PUBLIC_HIMETRICA_API_KEY}
              strategy="afterInteractive"
            />
            <Script
              src="https://cdn.himetrica.com/vitals.js"
              data-api-key={process.env.NEXT_PUBLIC_HIMETRICA_API_KEY}
              strategy="afterInteractive"
            />
            <Script
              src="https://cdn.himetrica.com/errors.js"
              data-api-key={process.env.NEXT_PUBLIC_HIMETRICA_API_KEY}
              strategy="afterInteractive"
            />
          </>
        )}
      </body>
    </html>
  );
}
