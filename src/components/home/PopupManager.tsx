"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Modal } from "@/components/ui/Modal";
import type { Popup } from "@/lib/api/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;
const PUBLIC_KEY = process.env.NEXT_PUBLIC_API_KEY!;

export function PopupManager() {
  const [popup, setPopup] = useState<Popup | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem("popup-dismissed");
    if (dismissed) return;

    fetch(`${BASE_URL}/popups`, {
      headers: { "X-Api-Key": PUBLIC_KEY, Accept: "application/json" },
      cache: "no-store",
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.data?.[0]) {
          setPopup(data.data[0]);
          setOpen(true);
        }
      })
      .catch(() => {});
  }, []);

  const handleClose = () => {
    setOpen(false);
    sessionStorage.setItem("popup-dismissed", "1");
  };

  if (!popup) return null;

  return (
    <Modal isOpen={open} onClose={handleClose} title={popup.title}>
      {popup.link ? (
        <Link href={popup.link} onClick={handleClose}>
          <Image
            src={popup.image}
            alt={popup.title || "Promotion"}
            width={480}
            height={320}
            className="rounded-lg w-full object-cover"
          />
        </Link>
      ) : (
        <Image
          src={popup.image}
          alt={popup.title || "Promotion"}
          width={480}
          height={320}
          className="rounded-lg w-full object-cover"
        />
      )}
    </Modal>
  );
}
