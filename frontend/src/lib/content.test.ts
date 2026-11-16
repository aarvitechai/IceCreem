import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { posts, readMinutes } from "./blog";
import { addressText, brand, mapsLink, whatsappLink } from "./brand";
import { gallery, galleryTags } from "./gallery";
import { eventTypeOptions, occasions } from "./occasions";
import { reviewOccasions } from "@/features/reviews/api";

const root = join(__dirname, "..", "..");
const publicFile = (src: string) => join(root, "public", src);
const backend = (path: string) => readFileSync(join(root, "..", "backend", path), "utf8");

describe("brand", () => {
  it("builds WhatsApp and map links", () => {
    expect(whatsappLink("Hi & bye")).toBe(`https://wa.me/${brand.whatsapp}?text=Hi%20%26%20bye`);
    expect(addressText).toBe("Bhopapur, Premnagar, Varanasi");
    expect(mapsLink).toContain(encodeURIComponent("Varanasi"));
  });
});

describe("occasions", () => {
  it("have unique slugs and event types", () => {
    expect(new Set(occasions.map((o) => o.slug)).size).toBe(occasions.length);
    expect(new Set(eventTypeOptions.map((o) => o.value)).size).toBe(eventTypeOptions.length);
  });

  it("use event types the API knows", () => {
    const block = backend("src/IceCream.Domain/Enums/Enums.cs").match(/enum EventType\s*\{([^}]*)\}/)![1];
    const apiTypes = [...block.matchAll(/(\w+)\s*=\s*\d+/g)].map((m) => m[1]).sort();
    expect(eventTypeOptions.map((o) => o.value).sort()).toEqual(apiTypes);
  });

  it("have pictures that exist", () => {
    for (const o of occasions) expect(existsSync(publicFile(o.image)), o.image).toBe(true);
  });
});

describe("reviews", () => {
  it("offer the same topics the API accepts", () => {
    const list = backend("src/IceCream.Application/Features/Reviews/ReviewService.cs").match(/Occasions\s*=\s*\[([^\]]*)\]/)![1];
    const apiTopics = [...list.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
    expect([...reviewOccasions]).toEqual(apiTopics);
  });
});

describe("blog", () => {
  it("has unique slugs, newest first, with real covers and local links", () => {
    expect(new Set(posts.map((p) => p.slug)).size).toBe(posts.length);
    const dates = posts.map((p) => p.date);
    expect([...dates].sort().reverse()).toEqual(dates);
    for (const p of posts) {
      expect(existsSync(publicFile(p.cover)), p.cover).toBe(true);
      expect(p.cta.href.startsWith("/")).toBe(true);
      expect(readMinutes(p)).toBeGreaterThanOrEqual(1);
    }
  });
});

describe("gallery", () => {
  it("only uses known tags and pictures that exist", () => {
    for (const g of gallery) {
      expect(galleryTags).toContain(g.tag);
      expect(existsSync(publicFile(g.src)), g.src).toBe(true);
    }
    expect(new Set(gallery.map((g) => g.src)).size).toBe(gallery.length);
  });
});
