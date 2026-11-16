"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Search } from "lucide-react";
import { Spinner } from "@/components/ui";

/** Filters live in the URL, so results are shareable and server rendered. */
export function ProductFilters({ categories }: { categories: { slug: string; name: string }[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState(params.get("search") ?? "");

  const update = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    startTransition(() => router.push(`${pathname}?${next.toString()}`, { scroll: false }));
  };

  // Debounced search so we do not hit the server on every key press.
  useEffect(() => {
    const current = params.get("search") ?? "";
    if (search === current) return;
    const t = setTimeout(() => update("search", search.trim() || null), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const active = params.get("category");

  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">Search</span>
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-choco/40" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search vanilla, kulfi, mango..." className="input pl-10" />
        </label>
        <select value={params.get("sort") ?? ""} onChange={(e) => update("sort", e.target.value || null)} className="input sm:w-52" aria-label="Sort">
          <option value="">Featured first</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
          <option value="newest">Newest</option>
          <option value="name">Name</option>
        </select>
        <select value={params.get("maxPrice") ?? ""} onChange={(e) => update("maxPrice", e.target.value || null)} className="input sm:w-44" aria-label="Price">
          <option value="">Any price</option>
          <option value="50">Under Rs 50</option>
          <option value="200">Under Rs 200</option>
          <option value="500">Under Rs 500</option>
        </select>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Chip active={!active} onClick={() => update("category", null)}>All</Chip>
        {categories.map((c) => (
          <Chip key={c.slug} active={active === c.slug} onClick={() => update("category", c.slug)}>{c.name}</Chip>
        ))}
        {pending && <Spinner className="ml-2 size-4" />}
      </div>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${active ? "border-berry bg-berry text-white" : "border-choco/15 bg-white hover:border-berry hover:text-berry"}`}
    >
      {children}
    </button>
  );
}
