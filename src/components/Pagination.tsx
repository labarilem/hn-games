"use client";
import Link from "next/link";
import { Fragment } from "react";
import { usePathname } from "next/navigation";

export default function Pagination({
  pagination,
  currentPage,
  searchParams,
}: {
  pagination: {
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
  currentPage: number;
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const pathname = usePathname();
  if (pagination.totalPages <= 1) return null;
  const pages = Array.from(
    new Set([
      1,
      currentPage - 1,
      currentPage,
      currentPage + 1,
      pagination.totalPages,
    ]),
  )
    .filter((page) => page >= 1 && page <= pagination.totalPages)
    .sort((a, b) => a - b);
  function pageUrl(page: number) {
    const next = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => {
      if (key !== "page" && value)
        (Array.isArray(value) ? value : [value]).forEach((entry) =>
          next.append(key, entry),
        );
    });
    next.set("page", String(page));
    return `${pathname}?${next}#catalog`;
  }
  return (
    <nav className="catalog-pagination" aria-label="Catalog pages">
      {pagination.hasPreviousPage ? (
        <Link href={pageUrl(currentPage - 1)} aria-label="Previous page">
          ← <span>Previous</span>
        </Link>
      ) : (
        <span className="page-disabled">
          ← <span>Previous</span>
        </span>
      )}
      <span className="page-position">
        PAGE <strong>{currentPage}</strong> / {pagination.totalPages}
      </span>
      <div className="page-numbers">
        {pages.map((page, index) => (
          <Fragment key={page}>
            {index > 0 && page - pages[index - 1] > 1 && (
              <span aria-hidden="true">…</span>
            )}
            <Link
              href={pageUrl(page)}
              aria-label={`Page ${page}`}
              aria-current={page === currentPage ? "page" : undefined}
            >
              {page}
            </Link>
          </Fragment>
        ))}
      </div>
      {pagination.hasNextPage ? (
        <Link href={pageUrl(currentPage + 1)} aria-label="Next page">
          <span>Next</span> →
        </Link>
      ) : (
        <span className="page-disabled">
          <span>Next</span> →
        </span>
      )}
    </nav>
  );
}
