import { Mail, Share2 } from "lucide-react";
import { Logo } from "@/components/layout/logo";

const links = [
  { href: "#", label: "About Us" },
  { href: "#", label: "Terms of Service" },
  { href: "#", label: "Privacy Policy" },
  { href: "#", label: "Contact Support" },
];

export function Footer() {
  return (
    <footer className="border-t border-primary-700 bg-primary-800 text-primary-50">
      <div className="container flex flex-col items-center gap-8 py-10 md:flex-row md:justify-between">
        <div className="flex flex-col items-center gap-1 md:items-start">
          <div className="[&_span]:text-accent-300 [&_svg_circle]:fill-accent-400 [&_svg_path]:stroke-white">
            <Logo />
          </div>
          <p className="text-xs text-primary-200">© {new Date().getFullYear()} Chalehat — All rights reserved.</p>
        </div>

        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm text-primary-100/80 underline-offset-4 transition-colors hover:text-accent-300 hover:underline"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex gap-3">
          <a
            href="#"
            aria-label="Share"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-accent-400 hover:text-primary-900"
          >
            <Share2 className="h-4 w-4" />
          </a>
          <a
            href="#"
            aria-label="Email"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-accent-400 hover:text-primary-900"
          >
            <Mail className="h-4 w-4" />
          </a>
        </div>
      </div>
    </footer>
  );
}
