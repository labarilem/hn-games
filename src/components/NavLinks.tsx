"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Discover" },
  { href: "/random", label: "Surprise me" },
  { href: "/rip", label: "The archive" },
  { href: "/about", label: "About" },
];
export default function NavLinks() {
  const pathname = usePathname();
  return (
    <nav className="main-nav" aria-label="Main navigation">
      {links.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          aria-current={pathname === href ? "page" : undefined}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
