"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface AnnouncementBarProps {
  message?: string;
}

export function AnnouncementBar({ message }: AnnouncementBarProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (sessionStorage.getItem("announcement-dismissed")) {
      setVisible(false);
    }
  }, []);

  const dismiss = () => {
    setVisible(false);
    sessionStorage.setItem("announcement-dismissed", "1");
  };

  if (!visible || !message) return null;

  return (
    <div className="bg-surface-900 text-white text-sm py-2 px-4 text-center relative">
      <p>{message}</p>
      <button
        onClick={dismiss}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:opacity-70 transition-opacity"
        aria-label="Dismiss announcement"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
