# Shared layouts

## Root layout — `src/app/layout.tsx`

Next.js root document. It applies global tokens, analytics, speed insights, SEO metadata, and optional Himetrica scripts. Visual shell is intentionally page-owned.

```tsx
import type { Metadata } from "next";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { BRAND, getSiteUrl } from "@/lib/brand";
import "./globals.css";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body className="bg-bg text-warm" suppressHydrationWarning>{children}<Analytics /><SpeedInsights /></body></html>;
}
```

## Editorial shell — `src/components/EditorialPageShell.tsx`

Shared institutional shell with MAIA wordmark, compact primary navigation, content column, and legal footer. Full source is recorded in `components.md`.
