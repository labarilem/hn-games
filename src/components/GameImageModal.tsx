'use client';

import Image from "next/image";
import { useState, useEffect } from "react";

interface GameImageModalProps {
  imageUrl: string;
  name: string;
}

export default function GameImageModal({ imageUrl, name }: GameImageModalProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (isModalOpen) {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") setIsModalOpen(false);
      };
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isModalOpen]);

  return (
    <>
      <div 
        className="aspect-video w-full cursor-pointer"
        onClick={() => setIsModalOpen(true)}
      >
        <Image
          src={imageUrl}
          alt={name}
          className="w-full h-full object-fill"
          priority
          width={1280}
          height={720}
        />
      </div>

      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setIsModalOpen(false)}
        >
          <div className="h-[70vh] relative">
            <Image
              src={imageUrl}
              alt={name}
              className="w-auto h-full object-contain max-w-[90vw]"
              onClick={(e) => e.stopPropagation()}
              width={1920}
              height={1080}
              priority
            />
          </div>
        </div>
      )}
    </>
  );
}
