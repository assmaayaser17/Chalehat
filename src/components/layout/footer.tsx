import { Logo } from "@/components/layout/logo";

export function Footer() {
  return (
    <footer className="border-t border-border bg-primary-900 text-primary-50">
      <div className="container flex flex-col items-center gap-4 py-10 text-center md:flex-row md:justify-between md:text-start">
        <div className="[&_span]:text-primary-50 [&_svg_path]:stroke-primary-50">
          <Logo />
        </div>
        <p className="text-sm text-primary-200">
          © {new Date().getFullYear()} Chalehat — All rights reserved.
        </p>
      </div>
    </footer>
  );
}
