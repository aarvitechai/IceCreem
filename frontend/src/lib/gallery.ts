/**
 * Pictures shown on /gallery. To add a real photo, put the file in public/images/gallery/
 * and add a line here. Wide pictures look best with shape "wide", tall ones with "tall".
 */
export type GalleryTag = "Ice creams" | "Kulfi and bars" | "Events" | "Offers";

export interface GalleryItem {
  src: string;
  title: string;
  caption: string;
  tag: GalleryTag;
  shape?: "square" | "wide" | "tall";
  /** Optional page to open from the picture. */
  href?: string;
}

export const galleryTags: GalleryTag[] = ["Ice creams", "Kulfi and bars", "Events", "Offers"];

export const gallery: GalleryItem[] = [
  { src: "/images/banners/hero-1.svg", title: "Freshly churned", caption: "Every tub is made the same morning it leaves the factory.", tag: "Offers", shape: "wide", href: "/products" },
  { src: "/images/products/belgian-chocolate.svg", title: "Belgian chocolate", caption: "Dark chocolate with chocolate chips.", tag: "Ice creams", shape: "tall", href: "/products/belgian-chocolate" },
  { src: "/images/products/alphonso-mango.svg", title: "Alphonso mango", caption: "Real Alphonso pulp in every scoop.", tag: "Ice creams", href: "/products/alphonso-mango" },
  { src: "/images/packages/gold.svg", title: "Kulfi cart", caption: "Our Gold package cart at a wedding.", tag: "Events", shape: "tall", href: "/wedding" },
  { src: "/images/products/malai-kulfi.svg", title: "Malai kulfi", caption: "Slow cooked milk, set in the old way.", tag: "Kulfi and bars", href: "/products/malai-kulfi" },
  { src: "/images/banners/hero-2.svg", title: "Make your wedding sweeter", caption: "Live counters for 100 to 2000 guests.", tag: "Events", shape: "wide", href: "/events" },
  { src: "/images/products/strawberry-swirl.svg", title: "Strawberry swirl", caption: "A birthday party favourite.", tag: "Ice creams", href: "/events/birthday" },
  { src: "/images/products/orange-bar.svg", title: "Orange bar", caption: "The classic candy on a stick.", tag: "Kulfi and bars", shape: "tall", href: "/products/orange-bar" },
  { src: "/images/products/butterscotch-cone.svg", title: "Butterscotch crunch cone", caption: "Crunchy cone loaded with butterscotch bits.", tag: "Ice creams", href: "/products/butterscotch-cone" },
  { src: "/images/packages/platinum.svg", title: "Platinum counter", caption: "Kulfi cart, sundae bar and a themed counter.", tag: "Events", href: "/wedding" },
  { src: "/images/banners/offer-1.svg", title: "10 percent off your first order", caption: "Use code WELCOME10 at checkout.", tag: "Offers", shape: "wide", href: "/products" },
  { src: "/images/products/kesar-pista-kulfi.svg", title: "Kesar pista kulfi", caption: "Saffron and pistachio, a wedding favourite.", tag: "Kulfi and bars", href: "/products/kesar-pista-kulfi" },
  { src: "/images/products/classic-vanilla.svg", title: "Classic vanilla", caption: "Smooth vanilla bean, loved by everyone.", tag: "Ice creams", shape: "tall", href: "/products/classic-vanilla" },
  { src: "/images/packages/silver.svg", title: "Silver counter", caption: "Three flavours and one serving counter.", tag: "Events", href: "/wedding" },
  { src: "/images/products/chocolate-cone.svg", title: "Double chocolate cone", caption: "Chocolate ice cream in a chocolate coated cone.", tag: "Ice creams", href: "/products" },
  { src: "/images/banners/offer-2.svg", title: "Free delivery above Rs 499", caption: "Across the city, packed frozen.", tag: "Offers", shape: "wide", href: "/products" },
  { src: "/images/products/kesar-pista-family.svg", title: "Family pack", caption: "Two litres for the whole family.", tag: "Ice creams", href: "/products" },
  { src: "/images/banners/hero-3.svg", title: "Order on WhatsApp", caption: "Message us and we deliver cold.", tag: "Offers", shape: "wide", href: "/contact" },
];
