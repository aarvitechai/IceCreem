import { brand } from "@/lib/brand";

const messages = [
  "Free delivery on orders above Rs 499",
  "Same day delivery for orders before 7 PM",
  `Order on WhatsApp ${brand.phoneDisplay}`,
  "Live ice cream counters for weddings and parties",
  "Made fresh every morning",
];

/** Thin scrolling offer strip on top of every shop page. */
export function AnnouncementBar() {
  const row = [...messages, ...messages];
  return (
    <div className="marquee overflow-hidden bg-berry py-2 text-cream" aria-label="Offers">
      <ul className="announce-track flex w-max gap-10 px-4 text-xs font-semibold uppercase tracking-wider sm:text-sm">
        {row.map((m, i) => (
          <li key={i} aria-hidden={i >= messages.length} className="flex items-center gap-10 whitespace-nowrap">
            {m}
            <span className="text-sun" aria-hidden>✦</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
