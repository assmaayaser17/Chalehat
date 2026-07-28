import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

/**
 * Latin/numbers pairing — prices, dates, IDs. Loaded first in the font
 * stack (see tailwind.config.ts) so Latin glyphs render here.
 */
const latinFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-latin",
  display: "swap",
});

/**
 * Arabic pairing — chalet names/descriptions and any Arabic content are
 * typed by real users. Falls through automatically for any Arabic glyph
 * `latinFont` above doesn't cover (browsers resolve per-character across
 * a font-family stack), no per-string language detection needed.
 */
const arabicFont = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "700"],
  variable: "--font-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Chalehat",
    template: "%s | Chalehat",
  },
  description: "Book the most beautiful seaside chalets and villas — browse, compare, and enjoy your stay.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" className={`${latinFont.variable} ${arabicFont.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
