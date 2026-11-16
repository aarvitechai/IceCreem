import type { Metadata } from "next";
import Link from "next/link";
import { CalendarCheck, ClipboardList, IceCreamCone, Wallet } from "lucide-react";
import { PageBanner } from "@/components/layout/page-banner";
import { OccasionCard } from "@/components/occasions/occasion-card";
import { brand, whatsappLink } from "@/lib/brand";
import { occasions } from "@/lib/occasions";

export const metadata: Metadata = {
  title: "Events and parties",
  description: `Ice cream counters by ${brand.name} for weddings, birthdays, anniversaries, engagements, baby showers, corporate events, festivals and kitty parties.`,
  alternates: { canonical: "/events" },
};

const steps = [
  { icon: CalendarCheck, title: "Pick a date", text: "At least 7 days before the event." },
  { icon: ClipboardList, title: "Get a quote", text: "Within a day, no payment to enquire." },
  { icon: Wallet, title: "Pay 30 percent", text: "To lock your date." },
  { icon: IceCreamCone, title: "Enjoy", text: "We set up, serve and clean up." },
];

export default function EventsPage() {
  return (
    <>
      <PageBanner title="Every celebration" text="Weddings, birthdays, anniversaries and more. Pick your occasion." />
      <div className="container-page space-y-16 py-10">
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {occasions.map((o) => <OccasionCard key={o.slug} occasion={o} />)}
        </section>

        <section className="bg-sun -mx-4 rounded-none px-4 py-10 sm:mx-0 sm:rounded-[2rem] sm:px-8">
          <div className="mb-8 flex flex-col items-center gap-2 text-center">
            <h2 className="section-title">Same easy steps for every event</h2>
            <span className="wave" aria-hidden />
          </div>
          <ol className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {steps.map(({ icon: Icon, title, text }, i) => (
              <li key={title} className="flex flex-col items-center gap-2 rounded-3xl bg-white p-5 text-center shadow-sm">
                <span className="flex size-12 items-center justify-center rounded-full bg-berry text-white"><Icon className="size-5" /></span>
                <span className="text-xs font-bold uppercase tracking-wider text-choco-light">Step {i + 1}</span>
                <h3 className="font-display text-lg font-semibold uppercase tracking-wide">{title}</h3>
                <p className="text-xs text-choco-light">{text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="flex flex-col items-center gap-4 rounded-[2rem] bg-choco p-8 text-center text-cream md:flex-row md:justify-between md:text-left">
          <div>
            <h2 className="font-display text-3xl font-bold uppercase tracking-wide">Something else in mind?</h2>
            <p className="text-sm text-cream/75">School functions, society meets, house warmings. Tell us and we will plan it.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/wedding/book?event=Party" className="btn-primary">Send an enquiry</Link>
            <a href={whatsappLink("Hi, I want an ice cream counter for my event.")} target="_blank" rel="noreferrer" className="btn bg-[#25d366] text-white hover:brightness-95">WhatsApp</a>
          </div>
        </section>
      </div>
    </>
  );
}
