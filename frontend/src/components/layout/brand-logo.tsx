import { brand } from "@/lib/brand";

/** Scoop mark plus wordmark. Pass light on dark backgrounds. */
export function BrandLogo({ light = false, size = "md" }: { light?: boolean; size?: "md" | "lg" }) {
  const mark = size === "lg" ? "size-10" : "size-8";
  return (
    <span className="flex items-center gap-2">
      <svg viewBox="0 0 40 40" className={mark} aria-hidden>
        <path d="M12 21 L20 38 L28 21 Z" fill="#e8b166" />
        <path d="M15 24 l10 0 M14 28 l9 0" stroke="#c98a3e" strokeWidth="1.5" />
        <circle cx="15" cy="17" r="7" fill="#f59ab5" />
        <circle cx="25" cy="17" r="7" fill="#fbe9b7" />
        <circle cx="20" cy="10" r="7.5" fill="#d63a6e" />
        <circle cx="17.5" cy="7.5" r="1.8" fill="#fff" opacity="0.6" />
      </svg>
      <span className={`font-display font-bold leading-none ${size === "lg" ? "text-2xl" : "text-xl"} ${light ? "text-white" : "text-choco"}`}>
        {brand.name.split(" ")[0]} <span className={light ? "text-berry-light" : "text-berry"}>{brand.name.split(" ").slice(1).join(" ")}</span>
      </span>
    </span>
  );
}
