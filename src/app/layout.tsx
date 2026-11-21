import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import CustomCursor from "@/components/CustomCursor";

/* ──────────────────────────────────────────────
   FONTS
   next/font self-hosts these and generates size-adjusted fallbacks,
   so there is no layout shift when they swap in.
   ────────────────────────────────────────────── */
const serifDisplay = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-editorial",
  display: "swap",
});

const sansPrimary = Inter({
  subsets: ["latin"],
  variable: "--font-primary",
  display: "swap",
});

const monoTech = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-technical",
  display: "swap",
  preload: false, // technical labels are rarely above the fold
});

/* ──────────────────────────────────────────────
   SITE CONSTANTS
   Set NEXT_PUBLIC_SITE_URL in your env (e.g. https://yourdomain.com)
   ────────────────────────────────────────────── */
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const SITE_NAME = "Dahir Media";
const SITE_DESCRIPTION =
  "A luxury photography and film studio. Event and studio photography, videography, documentary film production and post-production, based in Northern Nigeria and commissioned worldwide.";

/* ──────────────────────────────────────────────
   METADATA
   ────────────────────────────────────────────── */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | Luxury Photography & Cinema`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "luxury photographer Nigeria",
    "event photography",
    "studio photography",
    "videography",
    "documentary film production",
    "post production",
    "wedding photography Northern Nigeria",
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: "/",
    siteName: SITE_NAME,
    title: `${SITE_NAME} | Luxury Photography & Cinema`,
    description: SITE_DESCRIPTION,
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | Luxury Photography & Cinema`,
    description: SITE_DESCRIPTION,
    images: ["/og.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#080808",
  colorScheme: "dark",
};

/* ──────────────────────────────────────────────
   STRUCTURED DATA (helps Google show the studio properly)
   ────────────────────────────────────────────── */
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: SITE_NAME,
  url: SITE_URL,
  image: `${SITE_URL}/og.jpg`,
  logo: `${SITE_URL}/branding/logo.webp`,
  description: SITE_DESCRIPTION,
  areaServed: "Worldwide",
  address: { "@type": "PostalAddress", addressCountry: "NG" },
  makesOffer: [
    "Event Photography",
    "Studio Photography",
    "Videography",
    "Documentary Film Production",
    "Post Production",
  ].map((service) => ({
    "@type": "Offer",
    itemOffered: { "@type": "Service", name: service },
  })),
};

/* ──────────────────────────────────────────────
   ROOT LAYOUT
   ────────────────────────────────────────────── */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${serifDisplay.variable} ${sansPrimary.variable} ${monoTech.variable} font-sans bg-obsidian text-parchment antialiased`}
      >
        {/* Skip link: invisible until a keyboard user tabs to it */}
        <a
          href="#main"
          className="fixed left-4 top-4 z-[110] -translate-y-24 bg-champagne px-5 py-3 font-mono text-xs uppercase tracking-[0.2em] text-obsidian transition-transform duration-300 focus:translate-y-0"
        >
          Skip to content
        </a>

        <SmoothScroll>
          <CustomCursor />
          {children}
        </SmoothScroll>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
      </body>
    </html>
  );
}