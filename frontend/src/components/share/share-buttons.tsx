"use client";

import { useState } from "react";
import { Check, Link2, Mail, Share2 } from "lucide-react";
import { siFacebook, siInstagram, siPinterest, siTelegram, siWhatsapp, siX, type SimpleIcon } from "simple-icons";
import { toast } from "sonner";
import { brand } from "@/lib/brand";

interface ShareProps {
  /** Path on this site, for example /products/alphonso-mango */
  path: string;
  title: string;
  text?: string;
  /** Absolute or site relative image for Pinterest. */
  image?: string;
}

function BrandIcon({ icon }: { icon: SimpleIcon }) {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden fill="currentColor">
      <path d={icon.path} />
    </svg>
  );
}

const abs = (url: string) => (url.startsWith("http") ? url : `${brand.siteUrl}${url}`);

/**
 * Share on WhatsApp, Facebook, Instagram, X, Telegram, Pinterest, email or copy the link.
 * On phones the Share button opens the system sheet, which lists every installed app.
 */
export function ShareButtons({ path, title, text, image }: ShareProps) {
  const [copied, setCopied] = useState(false);
  const url = abs(path);
  const message = text ? `${title}: ${text}` : title;
  const e = encodeURIComponent;

  const links = [
    { name: "WhatsApp", icon: siWhatsapp, href: `https://wa.me/?text=${e(`${message} ${url}`)}` },
    { name: "Facebook", icon: siFacebook, href: `https://www.facebook.com/sharer/sharer.php?u=${e(url)}` },
    { name: "X", icon: siX, href: `https://twitter.com/intent/tweet?text=${e(message)}&url=${e(url)}` },
    { name: "Telegram", icon: siTelegram, href: `https://t.me/share/url?url=${e(url)}&text=${e(message)}` },
    {
      name: "Pinterest",
      icon: siPinterest,
      href: `https://pinterest.com/pin/create/button/?url=${e(url)}&description=${e(message)}${image ? `&media=${e(abs(image))}` : ""}`,
    },
  ];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy. Long press the address bar to copy the link.");
    }
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: message, url });
      } catch {
        /* closed by the user */
      }
      return true;
    }
    return false;
  };

  // Instagram has no web share link. Phones use the system sheet; computers copy the link.
  const instagram = async () => {
    if (await nativeShare()) return;
    await copy();
    toast.info("Paste the link in your Instagram story, post or bio.");
  };

  const pill = "flex size-10 items-center justify-center rounded-full border border-choco/10 bg-white text-choco-light transition hover:-translate-y-0.5 hover:shadow-md";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-sm font-medium text-choco-light">Share:</span>
      {links.map((l) => (
        <a
          key={l.name}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          className={pill}
          style={{ color: `#${l.icon.hex}` }}
          aria-label={`Share on ${l.name}`}
          title={`Share on ${l.name}`}
        >
          <BrandIcon icon={l.icon} />
        </a>
      ))}
      <button type="button" onClick={instagram} className={pill} style={{ color: `#${siInstagram.hex}` }} aria-label="Share on Instagram" title="Share on Instagram">
        <BrandIcon icon={siInstagram} />
      </button>
      <a href={`mailto:?subject=${e(title)}&body=${e(`${message}\n${url}`)}`} className={pill} aria-label="Share by email" title="Share by email">
        <Mail className="size-4" />
      </a>
      <button type="button" onClick={copy} className={pill} aria-label="Copy link" title="Copy link">
        {copied ? <Check className="size-4 text-mint" /> : <Link2 className="size-4" />}
      </button>
      <button
        type="button"
        onClick={async () => { if (!(await nativeShare())) await copy(); }}
        className="btn-outline btn-sm sm:hidden"
        aria-label="More sharing options"
      >
        <Share2 className="size-4" /> More
      </button>
    </div>
  );
}
