"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { AppImage } from "@/components/ui";
import { galleryTags, type GalleryItem, type GalleryTag } from "@/lib/gallery";

const span = { square: "", wide: "sm:col-span-2", tall: "row-span-2" } as const;

/** Filterable picture wall with a full screen viewer (arrow keys, swipe and Esc work). */
export function GalleryGrid({ items }: { items: GalleryItem[] }) {
  const [tag, setTag] = useState<GalleryTag | "All">("All");
  const [open, setOpen] = useState<number | null>(null);
  const shown = tag === "All" ? items : items.filter((i) => i.tag === tag);

  return (
    <>
      <div className="-mx-4 mb-8 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:justify-center sm:px-0" role="group" aria-label="Filter pictures">
        {(["All", ...galleryTags] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTag(t)}
            aria-pressed={tag === t}
            className={`shrink-0 whitespace-nowrap rounded-full border-2 px-5 py-2 font-display text-sm font-semibold uppercase tracking-wider transition ${tag === t ? "border-berry bg-berry text-white shadow-md" : "border-choco/10 bg-white text-choco hover:border-berry hover:text-berry"}`}
          >
            {t} <span className={tag === t ? "text-white/80" : "text-choco/40"}>{t === "All" ? items.length : items.filter((i) => i.tag === t).length}</span>
          </button>
        ))}
      </div>

      <ul className="grid auto-rows-[180px] grid-flow-dense grid-cols-2 gap-3 sm:auto-rows-[220px] sm:gap-4 lg:grid-cols-4">
        {shown.map((item, i) => (
          <li key={item.src} className={span[item.shape ?? "square"]}>
            <button
              type="button"
              onClick={() => setOpen(i)}
              className="group relative block size-full overflow-hidden rounded-3xl bg-pink-light text-left shadow-sm ring-1 ring-choco/5 focus-visible:ring-4 focus-visible:ring-berry/50"
              aria-label={`Open picture: ${item.title}`}
            >
              <AppImage src={item.src} alt={item.title} sizes="(max-width: 640px) 50vw, 25vw" className="object-cover transition duration-700 group-hover:scale-110" />
              <span className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80 transition group-hover:opacity-100" />
              <span className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full bg-white/85 text-choco opacity-0 transition group-hover:opacity-100">
                <Expand className="size-4" />
              </span>
              <span className="absolute inset-x-0 bottom-0 p-4 text-white">
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-sun">{item.tag}</span>
                <span className="block font-display text-lg font-semibold uppercase leading-tight tracking-wide drop-shadow">{item.title}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      {open !== null && shown[open] && (
        <Viewer items={shown} index={open} onIndex={setOpen} onClose={() => setOpen(null)} />
      )}
    </>
  );
}

function Viewer({ items, index, onIndex, onClose }: { items: GalleryItem[]; index: number; onIndex: (i: number) => void; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const touch = useRef<number | null>(null);
  const item = items[index];
  const go = (step: number) => onIndex((index + step + items.length) % items.length);

  // A native dialog gives focus trapping and Esc for free. No close() on cleanup: removing the
  // element closes it, and calling close() there would fire onClose and shut the viewer at once.
  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(1);
        if (e.key === "ArrowLeft") go(-1);
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      onTouchStart={(e) => { touch.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touch.current === null) return;
        const dx = e.changedTouches[0].clientX - touch.current;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
        touch.current = null;
      }}
      aria-label={item.title}
      className="m-auto w-[min(92vw,960px)] max-w-none overflow-visible bg-transparent p-0 backdrop:bg-choco/85 backdrop:backdrop-blur-sm"
    >
      <figure className="overflow-hidden rounded-[2rem] bg-white shadow-2xl">
        <div className="relative aspect-[4/3] bg-pink-light sm:aspect-[16/10]">
          <AppImage src={item.src} alt={item.title} sizes="90vw" className="object-contain" priority />
          <button type="button" onClick={() => go(-1)} className="absolute left-3 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-choco shadow hover:bg-white" aria-label="Previous picture">
            <ChevronLeft className="size-5" />
          </button>
          <button type="button" onClick={() => go(1)} className="absolute right-3 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-choco shadow hover:bg-white" aria-label="Next picture">
            <ChevronRight className="size-5" />
          </button>
          <button type="button" onClick={onClose} className="absolute right-3 top-3 flex size-10 items-center justify-center rounded-full bg-choco text-white shadow hover:bg-black" aria-label="Close">
            <X className="size-5" />
          </button>
          <span className="absolute bottom-3 left-3 rounded-full bg-black/55 px-3 py-1 text-xs font-semibold text-white">{index + 1} / {items.length}</span>
        </div>
        <figcaption className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-berry">{item.tag}</span>
            <h2 className="font-display text-2xl font-semibold uppercase tracking-wide">{item.title}</h2>
            <p className="text-sm text-choco-light">{item.caption}</p>
          </div>
          {item.href && (
            <Link href={item.href} onClick={onClose} className="btn-primary shrink-0">
              Explore <ArrowRight className="size-4" />
            </Link>
          )}
        </figcaption>
      </figure>
    </dialog>
  );
}
