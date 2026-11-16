/**
 * Blog posts live here, newest first. To add one, copy a post, change the slug and write the blocks.
 * Block types: p (paragraph), h (sub heading), list (bullets), tip (highlighted box).
 */
export type BlogCategory = "Tips" | "Events" | "Flavours" | "Behind the scenes";

export type Block =
  | { type: "p"; text: string }
  | { type: "h"; text: string }
  | { type: "list"; items: string[] }
  | { type: "tip"; title: string; text: string };

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: BlogCategory;
  /** ISO date, for example 2026-11-10 */
  date: string;
  cover: string;
  /** Page the post points readers to at the end. */
  cta: { label: string; href: string };
  body: Block[];
}

export const blogCategories: BlogCategory[] = ["Tips", "Events", "Flavours", "Behind the scenes"];

export const posts: BlogPost[] = [
  {
    slug: "how-much-ice-cream-for-a-wedding",
    title: "How much ice cream do you need for a wedding?",
    excerpt: "A simple way to plan quantity, flavours and counters for 100 to 2000 guests, so nobody misses out and nothing goes to waste.",
    category: "Events",
    date: "2026-11-12",
    cover: "/images/packages/gold.svg",
    cta: { label: "See wedding packages", href: "/wedding" },
    body: [
      { type: "p", text: "Dessert is the last thing guests remember about a wedding dinner, so it is worth planning well. The good news: you only need three numbers to get it right." },
      { type: "h", text: "1. Count the guests who will eat dessert" },
      { type: "p", text: "Start with your final guest count. At most Indian weddings almost everyone visits the dessert counter, so plan for the full number rather than guessing that some will skip it." },
      { type: "h", text: "2. Plan two servings for most guests" },
      { type: "p", text: "Many guests come back for a second kulfi or a different flavour. A live counter with two or three flavours keeps the line moving and lets people try more than one." },
      { type: "list", items: ["Up to 150 guests: one counter, three flavours", "150 to 500 guests: one counter plus a kulfi cart", "500 guests and more: two counters at opposite ends of the hall"] },
      { type: "h", text: "3. Match flavours to the season" },
      { type: "p", text: "In summer, fruit flavours like mango and orange disappear first. In winter, kesar pista kulfi and Belgian chocolate are the favourites. Keep one plain vanilla for kids and elders." },
      { type: "tip", title: "Our tip", text: "Tell us your guest count and the time of serving. We send a quote with the right number of counters and staff, so you do not have to calculate anything." },
    ],
  },
  {
    slug: "store-ice-cream-at-home",
    title: "How to store ice cream at home so it stays creamy",
    excerpt: "Five small habits that stop ice crystals, sticky lids and freezer smells from spoiling your tub.",
    category: "Tips",
    date: "2026-11-05",
    cover: "/images/products/classic-vanilla.svg",
    cta: { label: "Order a fresh tub", href: "/products?category=tubs" },
    body: [
      { type: "p", text: "Ice cream is happiest when it stays at one steady, very cold temperature. Most problems at home come from the tub warming up and freezing again." },
      { type: "list", items: [
        "Keep it at the back of the freezer, not in the door, where the temperature changes every time it opens.",
        "Put it in the freezer as soon as it arrives. Even ten minutes on the counter starts melting the edges.",
        "Press a piece of butter paper on the surface before closing the lid. It stops crystals forming on top.",
        "Scoop with a dry spoon. Water drops turn into ice crystals.",
        "Close the lid tightly. Ice cream picks up smells from onions and curries nearby.",
      ] },
      { type: "h", text: "Too hard to scoop?" },
      { type: "p", text: "Leave the tub in the fridge section for five to eight minutes before serving. Do not microwave it, the outside melts while the middle stays hard." },
      { type: "tip", title: "Good to know", text: "Melted and refrozen ice cream turns icy and loses its smooth texture. If a tub has fully melted, it is better to use it in a shake the same day." },
    ],
  },
  {
    slug: "kulfi-vs-ice-cream",
    title: "Kulfi vs ice cream: what is the difference?",
    excerpt: "Both are frozen and both are delicious, but they are made in very different ways. Here is what sets them apart.",
    category: "Flavours",
    date: "2026-10-28",
    cover: "/images/products/malai-kulfi.svg",
    cta: { label: "Try our kulfi", href: "/products?category=kulfi" },
    body: [
      { type: "p", text: "Kulfi is India's own frozen dessert. Ice cream came later, but today most families love both. The difference starts in the pan." },
      { type: "h", text: "How kulfi is made" },
      { type: "p", text: "Milk is slowly cooked until it thickens and turns slightly caramel in colour. It is then flavoured, often with saffron, cardamom and pistachio, and frozen in moulds without stirring." },
      { type: "h", text: "How ice cream is made" },
      { type: "p", text: "Ice cream starts from a milk and cream mix that is churned while it freezes. The churning adds air, which makes it light and soft enough to scoop." },
      { type: "list", items: ["Kulfi: dense, rich, slow to melt, served on a stick or in a matka", "Ice cream: light, smooth, scoopable, served in cups and cones"] },
      { type: "tip", title: "Which one for your event?", text: "Kulfi carts feel festive and traditional, perfect for weddings and pujas. Scoop counters are great when you want many flavours and toppings. Many of our customers book both." },
    ],
  },
  {
    slug: "birthday-party-ice-cream-ideas",
    title: "6 ice cream ideas for a birthday party kids will love",
    excerpt: "From a sprinkle station to a make your own sundae bar, easy ideas that turn dessert into the best part of the party.",
    category: "Events",
    date: "2026-10-20",
    cover: "/images/products/strawberry-swirl.svg",
    cta: { label: "Plan a birthday counter", href: "/events/birthday" },
    body: [
      { type: "p", text: "Children remember the cake, the games and the ice cream. Here are simple ways to make the ice cream part special." },
      { type: "list", items: [
        "Sprinkle station: plain cones and a tray of colourful sprinkles.",
        "Make your own sundae: two flavours, chocolate sauce and crushed biscuits.",
        "Fruit bar corner for kids who want something light.",
        "Theme colours: pick flavours that match the party colours, like strawberry for pink.",
        "Mini cups for the youngest guests, so less melts on clothes.",
        "A flavour vote: let kids vote for the next scoop.",
      ] },
      { type: "tip", title: "Keep it easy", text: "For parties of 25 to 50 guests, family packs and cones delivered cold often work as well as a counter. For bigger parties, our staff serve so parents can relax." },
    ],
  },
  {
    slug: "festival-desserts-guide",
    title: "Frozen desserts for every festival",
    excerpt: "Thandai kulfi for Holi, dry fruit kulfi for Diwali and more. A quick guide to festive flavours.",
    category: "Flavours",
    date: "2026-10-10",
    cover: "/images/products/kesar-pista-family.svg",
    cta: { label: "Book for a festival", href: "/events/festival" },
    body: [
      { type: "p", text: "Festivals bring families together, and a cold dessert is always welcome after a heavy festive meal." },
      { type: "list", items: [
        "Holi: thandai flavoured kulfi and cooling fruit bars.",
        "Diwali: kesar pista and dry fruit kulfi to go with the sweets.",
        "Eid: rich malai kulfi and rose flavours.",
        "Christmas and New Year: Belgian chocolate and butterscotch crunch.",
        "Society pujas: big family packs that are easy to serve to many people.",
      ] },
      { type: "tip", title: "Order early", text: "Festival weeks are our busiest. Book counters at least 7 days ahead and order family packs two or three days before the festival. Seasonal flavours depend on the season, so ask us what is available when you enquire." },
    ],
  },
  {
    slug: "how-we-make-our-ice-cream",
    title: "A morning at our factory",
    excerpt: "What happens between fresh milk arriving at dawn and a cold tub reaching your door.",
    category: "Behind the scenes",
    date: "2026-09-30",
    cover: "/images/products/belgian-chocolate.svg",
    cta: { label: "Read our story", href: "/about" },
    body: [
      { type: "p", text: "Our day starts early. Fresh milk arrives, and the first batches are planned around the day's orders and events." },
      { type: "h", text: "From milk to tub" },
      { type: "list", items: [
        "Milk and cream are mixed with sugar and the base for each flavour.",
        "The mix is churned and frozen, then real fruit pulp, nuts or chocolate chips are added.",
        "Tubs and cones are filled, sealed and moved straight to cold storage.",
        "Every batch is recorded, so we know which raw material went into which tub.",
      ] },
      { type: "h", text: "Cold all the way" },
      { type: "p", text: "Orders are packed frozen and delivered in insulated boxes. Our delivery partners share a live location so you can see when it will arrive." },
      { type: "tip", title: "Come and see", text: "Planning a big event or a franchise? Ask us for a visit and a tasting when you enquire." },
    ],
  },
];

export const postBySlug = (slug: string) => posts.find((p) => p.slug === slug);

/** Rough reading time at 200 words a minute. */
export function readMinutes(post: BlogPost) {
  const words = post.body
    .map((b) => (b.type === "list" ? b.items.join(" ") : b.type === "tip" ? `${b.title} ${b.text}` : b.text))
    .join(" ")
    .split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

export const postDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
