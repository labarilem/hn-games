"use client";
import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

interface PaginationProps {
  pagination: {
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
  currentPage: number;
  searchParams: { [key: string]: string | string[] | undefined };
}

const Pagination: React.FC<PaginationProps> = ({
  pagination,
  currentPage,
  searchParams,
}) => {
  const pathname = usePathname();
  const [maxPages, setMaxPages] = useState(10);

  // Helper function to build URL with all search parameters preserved
  const buildPageUrl = (pageNumber: number) => {
    const params = new URLSearchParams();
    params.set('page', pageNumber.toString());
    
    // Preserve all existing search parameters
    if (searchParams.search) params.set('search', searchParams.search as string);
    if (searchParams.platform) params.set('platform', searchParams.platform as string);
    if (searchParams.genre) params.set('genre', searchParams.genre as string);
    if (searchParams.sortBy) params.set('sortBy', searchParams.sortBy as string);
    if (searchParams.playerModes) params.set('playerModes', searchParams.playerModes as string);
    if (searchParams.pricing) params.set('pricing', searchParams.pricing as string);
    if (searchParams.license) params.set('license', searchParams.license as string);
    if (searchParams.author) params.set('author', searchParams.author as string);
    
    return `${pathname}?${params.toString()}`;
  };
  useEffect(() => {
    const checkMobile = () => {
      setMaxPages(window.innerWidth < 768 ? 1 : 10);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (pagination.totalPages <= 1) return null;

  const totalPages = pagination.totalPages;
  const pages: (number | "...")[] = [];

  if (totalPages <= maxPages) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    const left = Math.max(1, currentPage - Math.floor((maxPages - 1) / 2));
    const right = Math.min(totalPages, left + maxPages - 1);

    if (left > 1) {
      pages.push(1);
      if (left > 2) pages.push("...");
    }

    for (let i = left; i <= right; i++) {
      pages.push(i);
    }

    if (right < totalPages) {
      if (right < totalPages - 1) pages.push("...");
      pages.push(totalPages);
    }
  }

  return (
    <div className="flex justify-center gap-2 mt-8">
      {pagination.hasPreviousPage && (
        <a
          href={buildPageUrl(currentPage - 1)}
          className="px-4 py-2 rounded-lg bg-[#242424] text-gray-300 hover:bg-[#646cff] hover:text-white transition-colors flex items-center justify-center"
          aria-label="Previous page"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </a>
      )}
      {pages.map((page, idx) =>
        typeof page === "number" ? (
          <a
            key={page}
            href={buildPageUrl(page)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              currentPage === page
                ? "bg-[#646cff] text-white"
                : "bg-[#242424] text-gray-300 hover:bg-[#646cff] hover:text-white"
            }`}
          >
            {page}
          </a>
        ) : (
          <span
            key={`ellipsis-${idx}`}
            className="px-4 py-2 rounded-lg text-gray-400 select-none"
          >
            ...
          </span>
        )
      )}
      {pagination.hasNextPage && (
        <a
          href={buildPageUrl(currentPage + 1)}
          className="px-4 py-2 rounded-lg bg-[#242424] text-gray-300 hover:bg-[#646cff] hover:text-white transition-colors flex items-center justify-center"
          aria-label="Next page"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </a>
      )}
    </div>
  );
};

export default Pagination;
