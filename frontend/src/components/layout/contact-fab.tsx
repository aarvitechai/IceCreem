import { MessageCircle, Phone } from "lucide-react";
import { brand, telLink, whatsappLink } from "@/lib/brand";

/** Floating WhatsApp and call buttons, the way most local food businesses take orders. */
export function ContactFab() {
  return (
    <div className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] right-[calc(1rem+env(safe-area-inset-right,0px))] z-40 flex flex-col gap-3">
      <a
        href={whatsappLink()}
        target="_blank"
        rel="noreferrer"
        className="flex size-14 items-center justify-center rounded-full bg-[#25d366] text-white shadow-lg transition hover:scale-105"
        aria-label={`Order on WhatsApp ${brand.phoneDisplay}`}
        title="Order on WhatsApp"
      >
        <MessageCircle className="size-6" />
      </a>
      <a
        href={telLink}
        className="flex size-14 items-center justify-center rounded-full bg-berry text-white shadow-lg transition hover:scale-105"
        aria-label={`Call ${brand.phoneDisplay}`}
        title={`Call ${brand.phoneDisplay}`}
      >
        <Phone className="size-6" />
      </a>
    </div>
  );
}
