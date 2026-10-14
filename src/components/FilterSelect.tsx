"use client";

import { useEffect, useId, useRef, useState } from "react";
import FilterPopover from "./FilterPopover";

export interface FilterSelectOption {
  value: string;
  label: string;
}

interface FilterSelectProps {
  "aria-label": string;
  value: string;
  options: readonly FilterSelectOption[];
  onChange: (value: string) => void;
  wrapperClassName?: string;
}

const TYPEAHEAD_TIMEOUT_MS = 500;

/**
 * A single-select dropdown that reuses the genre popover's item styling. The
 * native <select> it replaces could not be styled, which is why the sidebar's
 * filters looked different from the genre control.
 */
export default function FilterSelect({
  "aria-label": ariaLabel,
  value,
  options,
  onChange,
  wrapperClassName = "",
}: FilterSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const listboxId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const typeahead = useRef<{ buffer: string; timer: ReturnType<typeof setTimeout> | null }>({
    buffer: "",
    timer: null,
  });

  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const selected = options.find((option) => option.value === value);

  // Set here rather than in an effect: an `isOpen` effect that sets state trips
  // the react-hooks/set-state-in-effect rule.
  const open = () => {
    setActiveIndex(selectedIndex);
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  // Keep the highlighted row visible. DOM only — no state is set here.
  useEffect(() => {
    if (!isOpen) return;
    document
      .getElementById(`${listboxId}-opt-${activeIndex}`)
      ?.scrollIntoView({ block: "nearest" });
  }, [isOpen, activeIndex, listboxId]);

  useEffect(
    () => () => {
      if (typeahead.current.timer) clearTimeout(typeahead.current.timer);
    },
    [],
  );

  const moveActive = (next: number) => {
    setActiveIndex(Math.min(Math.max(next, 0), options.length - 1));
  };

  const selectActive = () => {
    const option = options[activeIndex];
    if (!option) return;
    onChange(option.value);
    close();
  };

  const handleTypeahead = (key: string) => {
    const state = typeahead.current;
    if (state.timer) clearTimeout(state.timer);
    state.buffer += key.toLowerCase();
    state.timer = setTimeout(() => {
      state.buffer = "";
    }, TYPEAHEAD_TIMEOUT_MS);

    const buffer = state.buffer;
    // A single repeated character cycles through matches instead of sticking.
    const start = activeIndex + (buffer.length === 1 ? 1 : 0);
    for (let i = 0; i < options.length; i++) {
      const index = (start + i) % options.length;
      if (options[index].label.toLowerCase().startsWith(buffer)) {
        setActiveIndex(index);
        return;
      }
    }
  };

  const handleTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    const { key } = event;

    if (!isOpen) {
      if (
        key === "Enter" ||
        key === " " ||
        key === "ArrowDown" ||
        key === "ArrowUp"
      ) {
        event.preventDefault();
        open();
      }
      return;
    }

    switch (key) {
      case "ArrowDown":
        event.preventDefault();
        moveActive(activeIndex + 1);
        break;
      case "ArrowUp":
        event.preventDefault();
        moveActive(activeIndex - 1);
        break;
      case "Home":
        event.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        event.preventDefault();
        setActiveIndex(options.length - 1);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        selectActive();
        break;
      case "Tab":
        // Let focus move on naturally; options are not focusable.
        setIsOpen(false);
        break;
      default:
        if (
          key.length === 1 &&
          !event.altKey &&
          !event.ctrlKey &&
          !event.metaKey
        ) {
          handleTypeahead(key);
        }
    }
  };

  if (options.length === 0) {
    return (
      <div className={`relative ${wrapperClassName}`}>
        <button
          type="button"
          disabled
          className="hn-filter-control w-full flex items-center justify-between gap-2 text-left opacity-50"
        >
          <span className="truncate">{ariaLabel}</span>
        </button>
      </div>
    );
  }

  return (
    <FilterPopover
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      ariaLabel={ariaLabel}
      label={selected?.label ?? value}
      panelId={listboxId}
      activeDescendantId={`${listboxId}-opt-${activeIndex}`}
      onTriggerKeyDown={handleTriggerKeyDown}
      triggerRef={triggerRef}
      className={wrapperClassName}
    >
      {({ close: closeFromChrome }) => (
        <>
          {options.map((option, index) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                id={`${listboxId}-opt-${index}`}
                role="option"
                aria-selected={isSelected}
                tabIndex={-1}
                onClick={() => {
                  onChange(option.value);
                  closeFromChrome();
                  triggerRef.current?.focus();
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left cursor-pointer hover:bg-hn-elevated active:bg-hn-border select-none"
              >
                <span
                  className="w-4 h-4 shrink-0 flex items-center justify-center"
                  aria-hidden="true"
                >
                  {isSelected && (
                    <svg
                      className="w-4 h-4 text-hn-accent"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </span>
                <span className="text-sm">{option.label}</span>
              </button>
            );
          })}
        </>
      )}
    </FilterPopover>
  );
}
