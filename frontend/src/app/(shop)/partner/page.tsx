import type { Metadata } from "next";
import { Building2, Handshake, Hotel, Store, Truck } from "lucide-react";
import { PageBanner } from "@/components/layout/page-banner";
import { PartnerForm } from "@/components/partner/partner-form";
import { brand, telLink } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Partner with us",
  description: `Open a ${brand.name} outlet, become a distributor or get bulk supply for your hotel, restaurant or office.`,
  alternates: { canonical: "/partner" },
};

const ways = [
  { icon: Store, title: "Franchise outlet", text: "Run your own ice cream parlour with our flavours, branding and training." },
  { icon: Truck, title: "Distributor", text: "Supply retail shops in your area from our cold chain." },
  { icon: Hotel, title: "Hotels and restaurants", text: "Bulk tubs and desserts for menus, buffets and room service." },
  { icon: Building2, title: "Corporate and bulk", text: "Office parties, festivals and gifting with one invoice." },
];

const steps = ["Send the enquiry", "We call you back", "Visit, tasting and site check", "Sign up and start selling"];

export default function PartnerPage() {
  return (
    <>
      <PageBanner title="Partner with us" text="Grow with a fresh ice cream brand. Outlets, distribution and bulk supply." />
      <div className="container-page space-y-16 py-10">
        <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {ways.map(({ icon: Icon, title, text }) => (
            <div key={title} className="group flex flex-col items-center gap-3 rounded-3xl bg-white p-5 text-center shadow-sm ring-1 ring-choco/5 transition hover:-translate-y-1 hover:shadow-md sm:p-6">
              <span className="flex size-14 items-center justify-center rounded-full bg-sun text-choco transition group-hover:rotate-12 group-hover:scale-110">
                <Icon className="size-6" />
              </span>
              <h2 className="font-display text-lg font-semibold uppercase tracking-wide">{title}</h2>
              <p className="text-sm text-choco-light">{text}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          <div className="space-y-6">
            <div>
              <h2 className="section-title">How it works</h2>
              <span className="wave mt-2 block" aria-hidden />
            </div>
            <ol className="space-y-3">
              {steps.map((s, i) => (
                <li key={s} className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-choco/5">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-berry font-display text-lg font-bold text-white">{i + 1}</span>
                  <span className="font-medium">{s}</span>
                </li>
              ))}
            </ol>
            <div className="flex items-center gap-4 rounded-3xl bg-choco p-6 text-cream">
              <Handshake className="size-10 shrink-0 text-sun" />
              <div>
                <p className="font-display text-xl font-semibold uppercase tracking-wide">Talk to the owner</p>
                <a href={telLink} className="text-sm text-cream/80 hover:text-white">{brand.owner}, {brand.phoneDisplay}</a>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-choco/5 sm:p-8">
            <h2 className="mb-1 font-display text-2xl font-semibold uppercase tracking-wide">Partner enquiry</h2>
            <p className="mb-6 text-sm text-choco-light">Takes one minute. No charges to enquire.</p>
            <PartnerForm />
          </div>
        </section>
      </div>
    </>
  );
}
