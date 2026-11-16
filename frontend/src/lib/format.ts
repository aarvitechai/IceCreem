const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
const inrShort = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export const money = (value: number) => (Number.isInteger(value) ? inrShort.format(value) : inr.format(value));

/**
 * The API stores times in UTC but sends them without a zone ("2026-11-16T10:59:00").
 * Browsers read that as local time, which shifts every time by the viewer's offset, so mark it as UTC.
 * Date only values ("2026-11-16") are left alone.
 */
export const toDate = (value: string | Date) =>
  value instanceof Date ? value : new Date(/T\d{2}:\d{2}/.test(value) && !/(Z|[+-]\d{2}:?\d{2})$/.test(value) ? `${value}Z` : value);

// The business runs in India, so every screen shows India time whatever the viewer's device says.
const TZ = "Asia/Kolkata";

export const date = (value: string | Date) =>
  toDate(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: TZ });

export const dateTime = (value: string | Date) =>
  toDate(value).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: TZ });

/** "OutForDelivery" becomes "Out for delivery". */
export const label = (value: string) =>
  value.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase()).replace(/ (\w)/g, (_, c: string) => ` ${c.toLowerCase()}`);

export const discountPercent = (mrp: number, price: number) => (mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0);
