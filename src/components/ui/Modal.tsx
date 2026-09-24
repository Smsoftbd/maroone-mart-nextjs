"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  /** No header bar: a square close button sits on the top-right corner and the body scrolls. */
  bare?: boolean;
}

export function Modal({ isOpen, onClose, title, children, className, bare = false }: ModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);
  // Portal to <body>: a transformed ancestor (Swiper slides, card hover
  // effects) would otherwise trap `fixed` inside the card or carousel.
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            ref={backdropRef}
            className="absolute inset-0 bg-[var(--color-misc-overlay,rgba(0,0,0,0.4))] backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className={cn(
              "relative bg-surface rounded-xl shadow-lg max-w-lg w-full max-h-[90vh]",
              bare ? "flex flex-col" : "overflow-y-auto",
              className
            )}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            {bare ? (
              <>
                <button
                  onClick={onClose}
                  className="absolute -right-3 -top-3 z-10 flex h-9 w-9 items-center justify-center bg-black text-white transition-colors hover:bg-[var(--color-brand-500)] sm:-right-5 sm:-top-5"
                  aria-label="Close modal"
                >
                  <X className="h-5 w-5" />
                </button>
                <div className="overflow-y-auto overscroll-contain">{children}</div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between p-5 border-b border-surface-100">
                  {title && (
                    <h2 className="font-display text-lg font-semibold">{title}</h2>
                  )}
                  <button
                    onClick={onClose}
                    className="ml-auto p-1.5 rounded-full hover:bg-surface-100 transition-colors"
                    aria-label="Close modal"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="p-5">{children}</div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

const noopSubscribe = () => () => {};
