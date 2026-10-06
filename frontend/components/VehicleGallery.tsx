"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { CarIllustration } from "@/components/illustrations/CarIllustration";

interface VehicleGalleryProps {
  images: string[];
  alt: string;
}

export function VehicleGallery({ images, alt }: VehicleGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-[16/10] w-full flex-col items-center justify-center gap-2 rounded-2xl bg-slate-100 text-slate-300">
        <CarIllustration className="h-20 w-auto" />
        <span className="text-sm text-slate-400">Photo à venir</span>
      </div>
    );
  }

  return (
    <div>
      <div className="aspect-[16/10] w-full overflow-hidden rounded-2xl bg-slate-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[activeIndex]} alt={alt} className="h-full w-full object-cover" />
      </div>

      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((url, index) => (
            <button
              key={url}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={cn(
                "h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg ring-2 transition",
                index === activeIndex ? "ring-blue-600" : "ring-transparent opacity-70 hover:opacity-100"
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
