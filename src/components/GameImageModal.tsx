"use client";

import { useEffect, useRef } from "react";

export default function GameImageModal({
  imageUrl,
  name,
}: {
  imageUrl: string;
  name: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const previousOverflow = useRef("");
  function close() {
    dialog.current?.close();
  }
  useEffect(() => {
    const element = dialog.current;
    return () => {
      if (element?.open)
        document.body.style.overflow = previousOverflow.current;
    };
  }, []);
  return (
    <>
      <button
        ref={trigger}
        className="screenshot-trigger"
        aria-label={`Enlarge ${name} screenshot`}
        onClick={() => {
          previousOverflow.current = document.body.style.overflow;
          document.body.style.overflow = "hidden";
          dialog.current?.showModal();
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={`${name} screenshot`}
          width={1280}
          height={720}
          fetchPriority="high"
        />
        <span aria-hidden="true">View screenshot ↗</span>
      </button>
      <dialog
        ref={dialog}
        className="image-dialog"
        aria-label={`${name} screenshot`}
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
        onClose={() => {
          document.body.style.overflow = previousOverflow.current;
          trigger.current?.focus();
        }}
      >
        <div>
          <div className="image-dialog-bar">
            <span>{name}</span>
            <button onClick={close} aria-label="Close screenshot">
              ×
            </button>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={`${name} enlarged screenshot`}
            width={1280}
            height={720}
          />
        </div>
      </dialog>
    </>
  );
}
