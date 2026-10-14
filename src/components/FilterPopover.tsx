"use client";

import { useEffect, useId, useRef, type ReactNode, type RefObject } from "react";

interface FilterPopoverProps {
  /** Controlled open state — the caller owns it so it can also close the panel. */
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;

  /** Accessible name, used for both the trigger and the panel. */
  ariaLabel: string;
  /** Visible trigger text. */
  label: ReactNode;

  /** "dialog" is for a panel of independent controls rather than a list of options. */
  role?: "listbox" | "dialog";
  panelId?: string;
  /** Points the trigger at the active descendant while the panel is open. */
  activeDescendantId?: string;
  onTriggerKeyDown?: (event: React.KeyboardEvent<HTMLButtonElement>) => void;
  /** Exposes the trigger so the caller can return focus from its own handlers. */
  triggerRef?: RefObject<HTMLButtonElement | null>;
  className?: string;

  children: (helpers: { close: () => void }) => ReactNode;
}

/**
 * The button-and-panel chrome shared by the catalog dropdowns: trigger, rotating
 * chevron, outside-click and Escape handling. Only the chrome lives here — the
 * caller owns the open state and the panel contents.
 */
export default function FilterPopover({
  isOpen,
  onOpenChange,
  ariaLabel,
  label,
  role = "listbox",
  panelId,
  activeDescendantId,
  onTriggerKeyDown,
  triggerRef,
  className = "",
  children,
}: FilterPopoverProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const internalTriggerRef = useRef<HTMLButtonElement>(null);
  const generatedId = useId();
  const id = panelId ?? generatedId;

  const setTriggerRef = (node: HTMLButtonElement | null) => {
    internalTriggerRef.current = node;
    if (triggerRef) triggerRef.current = node;
  };

  // Kept free of ref reads: this runs during render inside the render prop, and
  // the react-hooks/refs rule rejects a ref-reading closure there.
  const close = () => onOpenChange(false);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        onOpenChange(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false);
        internalTriggerRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onOpenChange]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        ref={setTriggerRef}
        type="button"
        role={role === "listbox" ? "combobox" : undefined}
        aria-haspopup={role}
        aria-expanded={isOpen}
        aria-controls={id}
        aria-label={ariaLabel}
        aria-activedescendant={
          isOpen && role === "listbox" ? activeDescendantId : undefined
        }
        onClick={() => onOpenChange(!isOpen)}
        onKeyDown={onTriggerKeyDown}
        className="hn-filter-control w-full flex items-center justify-between gap-2 text-left"
      >
        <span className="truncate">{label}</span>
        <svg
          className={`w-4 h-4 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
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
      </button>

      {isOpen && (
        <div
          id={id}
          role={role}
          aria-label={ariaLabel}
          className="filter-popover absolute z-50 mt-1 w-full min-w-[220px] max-h-[min(320px,50vh)] overflow-y-auto overscroll-contain bg-hn-surface border border-hn-border rounded shadow-xl"
        >
          {children({ close })}
        </div>
      )}
    </div>
  );
}
