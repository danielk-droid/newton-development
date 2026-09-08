"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type ProjectImage = {
  src: string;
  alt: string;
  priority?: boolean;
};

type ProjectGalleryProps = {
  projectName: string;
  images: ProjectImage[];
};

export default function ProjectGallery({ projectName, images }: ProjectGalleryProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    if (activeIndex === null) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setActiveIndex(null);
      if (event.key === "ArrowLeft") {
        setActiveIndex((current) => current === null ? null : (current - 1 + images.length) % images.length);
      }
      if (event.key === "ArrowRight") {
        setActiveIndex((current) => current === null ? null : (current + 1) % images.length);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeIndex, images.length]);

  if (images.length === 0) return null;

  const activeImage = activeIndex === null ? null : images[activeIndex];

  return (
    <>
      <section className="mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]" aria-labelledby="project-gallery-heading">
        <div className="border-b border-slate-200 px-6 py-5 md:px-7">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Project imagery</p>
              <h2 id="project-gallery-heading" className="mt-1 text-xl font-bold tracking-tight text-slate-950">{projectName}</h2>
            </div>
            <p className="text-sm text-slate-500">{images.length} {images.length === 1 ? "image" : "images"} · Select to enlarge</p>
          </div>
        </div>

        <div className={`grid gap-3 p-3 ${images.length === 1 ? "md:grid-cols-1" : "md:grid-cols-2"}`}>
          {images.map((image, index) => (
            <button
              key={image.src}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`group relative overflow-hidden rounded-2xl bg-slate-100 text-left focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 ${index === 0 && images.length >= 3 ? "md:col-span-2" : ""}`}
              aria-label={`Open image ${index + 1} of ${images.length}: ${image.alt}`}
            >
              <div className={`relative w-full ${index === 0 && images.length >= 3 ? "aspect-[16/7]" : "aspect-[16/10]"}`}>
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  priority={image.priority}
                  sizes={index === 0 && images.length >= 3 ? "(max-width: 768px) 100vw, 1152px" : "(max-width: 768px) 100vw, 576px"}
                  className="object-cover transition duration-500 group-hover:scale-[1.02]"
                />
                <span className="absolute bottom-3 right-3 rounded-lg bg-black/65 px-3 py-1.5 text-xs font-bold text-white opacity-0 backdrop-blur-sm transition group-hover:opacity-100 group-focus-visible:opacity-100">View image</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {activeImage && activeIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`${projectName} image viewer`}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setActiveIndex(null);
          }}
        >
          <div className="relative flex h-full w-full max-w-7xl items-center justify-center">
            <button
              type="button"
              onClick={() => setActiveIndex(null)}
              className="absolute right-0 top-0 z-10 rounded-full bg-white/10 px-4 py-2 text-2xl font-light text-white backdrop-blur transition hover:bg-white/20 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/40"
              aria-label="Close image viewer"
            >
              ×
            </button>

            <button
              type="button"
              onClick={() => setActiveIndex((activeIndex - 1 + images.length) % images.length)}
              className="absolute left-0 z-10 rounded-full bg-white/10 px-4 py-3 text-2xl text-white backdrop-blur transition hover:bg-white/20 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/40"
              aria-label="Previous image"
            >
              ←
            </button>

            <div className="relative h-[80vh] w-[calc(100%-7rem)]">
              <Image src={activeImage.src} alt={activeImage.alt} fill sizes="90vw" className="object-contain" priority />
            </div>

            <button
              type="button"
              onClick={() => setActiveIndex((activeIndex + 1) % images.length)}
              className="absolute right-0 z-10 rounded-full bg-white/10 px-4 py-3 text-2xl text-white backdrop-blur transition hover:bg-white/20 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/40"
              aria-label="Next image"
            >
              →
            </button>

            <p className="absolute bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-black/45 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
              {activeIndex + 1} / {images.length} · Use ← → or Escape
            </p>
          </div>
        </div>
      )}
    </>
  );
}
