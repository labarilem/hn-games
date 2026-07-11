"use client";

import { forwardRef, useState } from "react";

type FilterSelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  wrapperClassName?: string;
};

const FilterSelect = forwardRef<HTMLSelectElement, FilterSelectProps>(
  function FilterSelect(
    {
      className = "",
      wrapperClassName = "",
      children,
      onFocus,
      onBlur,
      onChange,
      onMouseDown,
      ...props
    },
    ref
  ) {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className={`relative ${wrapperClassName}`}>
        <select
          ref={ref}
          className={`hn-filter-control w-full appearance-none pr-10 ${className}`}
          onFocus={(e) => {
            setIsOpen(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsOpen(false);
            onBlur?.(e);
          }}
          onMouseDown={(e) => {
            setIsOpen(true);
            onMouseDown?.(e);
          }}
          onChange={(e) => {
            onChange?.(e);
            setIsOpen(false);
          }}
          {...props}
        >
          {children}
        </select>
        <svg
          className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 shrink-0 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    );
  }
);

export default FilterSelect;
