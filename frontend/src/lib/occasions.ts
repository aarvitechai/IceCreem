import type { EventType } from "@/lib/types";

/**
 * Every occasion we cater for, in one place. Pages, the booking form and menus read this list.
 * eventType must match the API enum. icon is a lucide icon name picked in components/occasions.
 */
export interface Occasion {
  slug: string;
  eventType: EventType;
  title: string;
  short: string;
  tagline: string;
  description: string;
  ideas: string[];
  guests: string;
  defaultGuests: number;
  image: string;
  /** Tailwind gradient classes for the card and hero. */
  gradient: string;
}

export const occasions: Occasion[] = [
  {
    slug: "wedding",
    eventType: "Wedding",
    title: "Weddings",
    short: "Wedding",
    tagline: "The sweetest counter at your celebration",
    description: "Kulfi carts, live scoop counters and sundae bars served by our trained team, from the haldi to the reception.",
    ideas: ["Kulfi cart with matka kulfi", "Live sundae bar with toppings", "Themed counter that matches your decor"],
    guests: "100 to 2000 guests",
    defaultGuests: 200,
    image: "/images/packages/gold.svg",
    gradient: "from-pink via-berry to-[#f4a51c]",
  },
  {
    slug: "birthday",
    eventType: "Birthday",
    title: "Birthday parties",
    short: "Birthday",
    tagline: "Scoops, cones and smiles for every age",
    description: "From a first birthday to a fiftieth, we bring a colourful counter with kid friendly cones and grown up flavours.",
    ideas: ["Cone counter with sprinkles and toppings", "Ice cream cake add on", "Fruit bars and kulfi for the little ones"],
    guests: "25 to 300 guests",
    defaultGuests: 50,
    image: "/images/products/strawberry-swirl.svg",
    gradient: "from-[#f59ab5] via-pink to-[#8e3bbf]",
  },
  {
    slug: "anniversary",
    eventType: "Anniversary",
    title: "Anniversaries",
    short: "Anniversary",
    tagline: "Celebrate the years with something sweet",
    description: "An elegant dessert counter for silver and golden jubilees, family dinners and surprise parties.",
    ideas: ["Kesar pista and malai kulfi platter", "Belgian chocolate sundae station", "Personalised counter board with your names"],
    guests: "25 to 500 guests",
    defaultGuests: 80,
    image: "/images/products/kesar-pista-kulfi.svg",
    gradient: "from-berry via-[#c63d3d] to-[#6b3a24]",
  },
  {
    slug: "engagement",
    eventType: "Engagement",
    title: "Engagements and ring ceremonies",
    short: "Engagement",
    tagline: "A sweet start to forever",
    description: "Live counters and kulfi carts for roka, sagai and ring ceremonies, sized for family and close friends.",
    ideas: ["Matka kulfi served on the spot", "Two flavour live counter", "Ice cream shots for welcome drinks"],
    guests: "50 to 800 guests",
    defaultGuests: 150,
    image: "/images/products/malai-kulfi.svg",
    gradient: "from-[#f4a51c] via-berry to-pink",
  },
  {
    slug: "baby-shower",
    eventType: "BabyShower",
    title: "Baby showers and naming ceremonies",
    short: "Baby shower",
    tagline: "Soft colours, softer scoops",
    description: "Gentle flavours and pastel counters for godh bharai, baby showers and naming ceremonies.",
    ideas: ["Pastel cone counter", "Strawberry and vanilla favourites", "Eggless, pure veg menu"],
    guests: "25 to 200 guests",
    defaultGuests: 50,
    image: "/images/products/classic-vanilla.svg",
    gradient: "from-[#7fc8f8] via-[#b39ddb] to-[#f59ab5]",
  },
  {
    slug: "corporate",
    eventType: "Corporate",
    title: "Corporate events",
    short: "Corporate",
    tagline: "Treat the team, impress the guests",
    description: "Office parties, product launches, annual days and Friday treats with one invoice and GST bill.",
    ideas: ["Branded cups and counter", "Quick serve cone station", "Bulk tubs for the office freezer"],
    guests: "30 to 2000 guests",
    defaultGuests: 100,
    image: "/images/products/belgian-chocolate.svg",
    gradient: "from-choco via-[#6b3a24] to-berry",
  },
  {
    slug: "festival",
    eventType: "Festival",
    title: "Festivals and pujas",
    short: "Festival",
    tagline: "Diwali, Holi, Eid, Christmas and more",
    description: "Festive counters for society events, temple and community gatherings, and family get togethers.",
    ideas: ["Thandai and kesar kulfi for Holi", "Dry fruit kulfi for Diwali", "Big family packs for the whole society"],
    guests: "25 to 2000 guests",
    defaultGuests: 150,
    image: "/images/products/kesar-pista-family.svg",
    gradient: "from-sun via-[#f4a51c] to-berry",
  },
  {
    slug: "kitty-party",
    eventType: "KittyParty",
    title: "Kitty parties and get togethers",
    short: "Kitty party",
    tagline: "Small group, big flavours",
    description: "A compact counter or a box of family packs for kitty parties, reunions and house parties.",
    ideas: ["Mini sundae bar", "Flavour tasting flight", "Family packs delivered cold"],
    guests: "25 to 100 guests",
    defaultGuests: 30,
    image: "/images/products/alphonso-mango.svg",
    gradient: "from-[#2fa58b] via-[#1f8a73] to-[#f4a51c]",
  },
];

export const occasionBySlug = (slug: string) => occasions.find((o) => o.slug === slug);
export const occasionByType = (type: string) => occasions.find((o) => o.eventType === type);

/** Labels for the booking form, including types that have no landing page of their own. */
export const eventTypeOptions: { value: EventType; label: string }[] = [
  ...occasions.map((o) => ({ value: o.eventType, label: o.short })),
  { value: "Reception", label: "Reception" },
  { value: "Party", label: "Other party" },
];
