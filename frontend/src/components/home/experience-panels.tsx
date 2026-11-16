import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AppImage } from "@/components/ui";

const panels = [
  {
    title: "Scoops and tubs",
    text: "Belgian chocolate, Alphonso mango, classic vanilla and more, churned every morning.",
    href: "/products?category=tubs",
    image: "/images/products/belgian-chocolate.svg",
    bg: "from-[#6b3a24] to-[#a2553a]",
  },
  {
    title: "Kulfi and bars",
    text: "Slow cooked malai kulfi, kesar pista and fruity bars on a stick.",
    href: "/products?category=kulfi",
    image: "/images/products/kesar-pista-kulfi.svg",
    bg: "from-[#f4a51c] to-[#e3504f]",
  },
  {
    title: "Weddings and parties",
    text: "Live counters and kulfi carts with trained staff for 100 to 2000 guests.",
    href: "/wedding",
    image: "/images/packages/gold.svg",
    bg: "from-[#eb558f] to-[#8e3bbf]",
  },
];

/**
 * Three tall picture panels. On a computer the one under the mouse grows wide and shows its text;
 * on a phone they stack as cards with the text always visible.
 */
export function ExperiencePanels() {
  return (
    <div className="flex flex-col gap-3 md:h-[480px] md:flex-row">
      {panels.map((p) => (
        <Link
          key={p.title}
          href={p.href}
          className={`group relative flex min-h-56 flex-1 overflow-hidden rounded-[2rem] bg-gradient-to-br ${p.bg} text-white transition-[flex-grow] duration-700 ease-out md:min-h-0 md:hover:flex-[2.4] md:focus-visible:flex-[2.4]`}
        >
          <div className="absolute inset-0 transition duration-700 group-hover:scale-110">
            <AppImage src={p.image} alt="" sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
          </div>
          <div className={`absolute inset-0 bg-gradient-to-br ${p.bg} opacity-45 mix-blend-multiply`} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
          <div className="relative mt-auto flex flex-col gap-2 p-6 md:p-8">
            <h3 className="font-display text-3xl font-bold uppercase leading-none tracking-wide drop-shadow md:text-4xl">{p.title}</h3>
            <p className="max-w-sm text-sm text-white/90 md:max-h-0 md:overflow-hidden md:opacity-0 md:transition-all md:duration-500 md:group-hover:max-h-24 md:group-hover:opacity-100 md:group-focus-visible:max-h-24 md:group-focus-visible:opacity-100">
              {p.text}
            </p>
            <span className="inline-flex items-center gap-1 text-sm font-semibold uppercase tracking-wider">
              Explore <ArrowRight className="size-4 transition group-hover:translate-x-1" />
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
