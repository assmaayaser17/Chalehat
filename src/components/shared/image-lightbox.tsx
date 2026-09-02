"use client";

import * as React from "react";
import { X } from "lucide-react";

/** Client Component: a minimal fullscreen image viewer — click the backdrop, the X, or press Escape to close. */
export function ImageLightbox({ src, alt = "", onClose }: { src: string; alt?: string; onClose: () => void }) {
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute end-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
      >
        <X className="h-5 w-5" />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element -- fullscreen viewer over an arbitrary already-resolved URL, next/image adds nothing here */}
      <img src={src} alt={alt} className="max-h-full max-w-full object-contain" onClick={(e) => e.stopPropagation()} />
    </div>
  );
}
