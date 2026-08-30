import type { Metadata } from "next";
import { Crimson_Pro, Public_Sans } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { BRAND, getSiteUrl } from "@/lib/brand";
import "./globals.css";

const publicSans = Public_Sans({ subsets: ["latin"], variable: "--font-public-sans", display: "swap" });
const crimsonPro = Crimson_Pro({ subsets: ["latin"], variable: "--font-crimson-pro", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "Grupo Maia — 29 empresas",
    template: "%s | Grupo Maia",
  },
  description: BRAND.appDescription,
  keywords: [
    "Grupo Maia",
    "holding empresarial",
    "portfólio de empresas",
    "ecossistema empresarial",
    "empresas Grupo Maia",
  ],
  alternates: {
    canonical: "/",
    languages: { "pt-BR": "/" },
  },
  openGraph: {
    title: "Grupo Maia — 29 empresas",
    description: BRAND.appDescription,
    siteName: BRAND.name,
    type: "website",
    locale: "pt_BR",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: BRAND.ogAlt,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Grupo Maia — 29 empresas",
    description: BRAND.appDescription,
    images: ["/opengraph-image"],
    creator: BRAND.xCreator,
    site: BRAND.xCreator,
  },
  authors: [{ name: "Grupo Maia", url: "https://grupomaia.me" }],
  creator: "Grupo Maia",
  publisher: "Grupo Maia",
  category: "Business",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-icon.png",
  },
};

const BASE_URL = getSiteUrl();

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: BRAND.name,
  description: BRAND.ogAlt,
  url: BASE_URL,
  inLanguage: "pt-BR",
  isPartOf: {
    "@type": "WebSite",
    name: "Grupo Maia",
    url: "https://grupomaia.me",
  },
  publisher: {
    "@type": "Organization",
    name: "Grupo Maia",
    url: "https://grupomaia.me",
    logo: `${BASE_URL}/brand/grupo-maia-symbol-reverse.svg`,
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
      </head>
      <body className={`${publicSans.variable} ${crimsonPro.variable} bg-bg text-warm`} suppressHydrationWarning>
        {children}
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
