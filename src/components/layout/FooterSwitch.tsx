"use client";

import { usePathname } from "next/navigation";

interface FooterSwitchProps {
  /** Rendered on the homepage. */
  home: React.ReactNode;
  /** Rendered on every other route. */
  standard: React.ReactNode;
}

/**
 * Footer is a server component, so it cannot read the route itself. This thin
 * client shim picks between the two server-rendered footers by pathname.
 */
export function FooterSwitch({ home, standard }: FooterSwitchProps) {
  const pathname = usePathname();
  return <>{pathname === "/" ? home : standard}</>;
}
