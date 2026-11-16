import Link from "next/link";

const flavours = [
  { name: "Classic Vanilla", color: "#fbe9b7", slug: "classic-vanilla" },
  { name: "Belgian Chocolate", color: "#6b3a24", slug: "belgian-chocolate" },
  { name: "Alphonso Mango", color: "#f6b33c", slug: "alphonso-mango" },
  { name: "Strawberry Swirl", color: "#f59ab5", slug: "strawberry-swirl" },
  { name: "Butterscotch Crunch", color: "#e9b56a", slug: "butterscotch-cone" },
  { name: "Malai Kulfi", color: "#f3e3c3", slug: "malai-kulfi" },
  { name: "Kesar Pista", color: "#f1c45a", slug: "kesar-pista-kulfi" },
  { name: "Orange Candy", color: "#f7922f", slug: "orange-bar" },
];

/** A slow moving strip of flavours under the hero. Pauses on hover. */
export function FlavourMarquee() {
  const row = [...flavours, ...flavours];
  return (
    <div className="marquee overflow-hidden rounded-full border border-choco/10 bg-white py-3" aria-label="Our flavours">
      <ul className="marquee-track flex w-max gap-8 px-4">
        {row.map((f, i) => (
          <li key={i} aria-hidden={i >= flavours.length}>
            <Link
              href={`/products/${f.slug}`}
              tabIndex={i >= flavours.length ? -1 : undefined}
              className="flex items-center gap-2 whitespace-nowrap font-display text-lg font-semibold text-choco hover:text-berry"
            >
              <span className="size-4 rounded-full ring-2 ring-white shadow" style={{ background: f.color }} />
              {f.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
