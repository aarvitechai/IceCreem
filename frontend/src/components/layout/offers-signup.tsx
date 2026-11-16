"use client";

import { Send } from "lucide-react";
import { brand, whatsappLink } from "@/lib/brand";

/** Joins the offers list on WhatsApp. No email list to manage, the owner just saves the number. */
export function OffersSignup() {
  const join = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const name = new FormData(e.currentTarget).get("name")?.toString().trim() || "there";
    window.open(whatsappLink(`Hi, I am ${name}. Please add me to the ${brand.name} offers list.`), "_blank", "noopener");
  };

  return (
    <form onSubmit={join} className="flex gap-2">
      <input name="name" placeholder="Your name" aria-label="Your name" className="input rounded-full border-white/30 bg-white/15 text-white placeholder:text-white/70" />
      <button type="submit" className="btn shrink-0 bg-choco text-white hover:bg-black" aria-label="Join offers on WhatsApp">
        <Send className="size-4" /> Join
      </button>
    </form>
  );
}
