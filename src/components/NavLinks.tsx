"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/random", label: "Random" },
  { href: "/rip", label: "RIP" },
] as const;

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-4">
      {NAV_LINKS.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={
            pathname === href ? "hn-nav-link hn-nav-link-active" : "hn-nav-link"
          }
        >
          {label}
        </Link>
      ))}
    </div>
  );
}
