/** Business identity in one place. Change here and the whole site follows. */
export const brand = {
  /** Same as Order:FreeDeliveryAbove in the API settings. */
  freeDeliveryAbove: 499,
  name: "Desired Ice Cream",
  tagline: "Freshly churned ice cream, delivered cold",
  owner: "Rakesh Singh",
  phoneDisplay: "+91 78608 27264",
  phoneE164: "+917860827264",
  whatsapp: "917860827264",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "https://desiredicecream.redstarvibe.com",
} as const;

/** True on test sites (staging): search engines are told not to index them. */
export const noIndex = process.env.NEXT_PUBLIC_NOINDEX === "true";

export const telLink = `tel:${brand.phoneE164}`;
export const whatsappLink = (text = `Hi ${brand.name}, I want to place an order.`) =>
  `https://wa.me/${brand.whatsapp}?text=${encodeURIComponent(text)}`;
