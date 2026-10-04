import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";

import { Providers } from "@/components/providers";
import { getCurrentUser } from "@/lib/session";

import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "NaijaFresh | Fresh Nigerian Ingredients & Ready-to-Cook Meals",
    template: "%s | NaijaFresh",
  },
  description:
    "Shop fresh Nigerian foodstuff, local spices and ready-to-cook meal kits delivered to your door.",
  keywords: [
    "Nigerian food delivery",
    "meal kits Nigeria",
    "foodstuff delivery Lagos",
    "Afang soup kit",
    "Egusi soup kit",
    "buy crayfish online",
  ],
  openGraph: {
    type: "website",
    siteName: "NaijaFresh",
    title: "NaijaFresh | Fresh Nigerian Ingredients & Ready-to-Cook Meals",
    description:
      "Fresh ingredients, local spices and ready-to-cook meals delivered to your door.",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "NaijaFresh",
    description:
      "Fresh ingredients, local spices and ready-to-cook meals delivered to your door.",
  },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser().catch(() => null);

  return (
    <html lang="en" className={`${jakarta.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-cream-100 text-ink">
        <Providers initialUser={user}>{children}</Providers>
      </body>
    </html>
  );
}
