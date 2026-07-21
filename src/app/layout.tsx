import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Chalehat",
    template: "%s | Chalehat",
  },
  description: "Book the most beautiful seaside chalets and villas — browse, compare, and enjoy your stay.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <body className="font-sans">{children}</body>
    </html>
  );
}
