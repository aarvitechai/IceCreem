import type { Metadata } from "next";
import Link from "next/link";
import { Heart, Leaf, Plus, Snowflake } from "lucide-react";
import { SpinStamp } from "@/components/home/spin-stamp";
import { PageBanner } from "@/components/layout/page-banner";
import { AppImage } from "@/components/ui";
import { addressText, brand, telLink, whatsappLink } from "@/lib/brand";

export const metadata: Metadata = {
  title: "About and FAQ",
  description: `The story of ${brand.name}, how we make our ice cream and answers to common questions.`,
  alternates: { canonical: "/about" },
};

const values = [
  { icon: Snowflake, title: "Fresh every morning", text: "We churn daily and keep it in our own cold storage, so it reaches you fresh." },
  { icon: Leaf, title: "Real ingredients", text: "Farm milk, real fruit, pure saffron and nuts. No shortcuts on taste." },
  { icon: Heart, title: "Made with love", text: "A family business that treats every order like one for our own home." },
];

const faqs = [
  ["How fresh is the ice cream?", "We churn every morning and keep it in our own cold storage. Most packs reach you within 24 hours of making."],
  ["Do you deliver?", "Yes. Delivery is free above Rs 499, otherwise Rs 40. Our riders carry insulated boxes so it arrives frozen."],
  ["How do I pay?", "Cash or UPI on delivery for home orders. For events, 30 percent advance after you accept the quote."],
  ["How early should I book for a wedding?", "At least 7 days before the event. Wedding season dates fill fast, so book early."],
  ["Can I cancel an order?", "Yes, from My orders, until the order is packed. Or call us."],
  ["Are your products vegetarian?", "All our ice creams and kulfi are vegetarian. Look for the green mark on each product."],
];

export default function AboutPage() {
  return (
    <>
      <PageBanner title="Our story" text="Fresh ice cream, made with care for every family and every celebration." />
      <div className="space-y-16 py-12 sm:space-y-20">
        <section className="container-page grid items-center gap-10 md:grid-cols-2">
          <div className="relative mx-auto w-full max-w-md">
            <div className="relative aspect-square overflow-hidden rounded-[2.5rem] bg-pink-light shadow-xl ring-8 ring-white">
              <AppImage src="/images/products/strawberry-swirl.svg" alt="A tub of strawberry ice cream" className="object-cover" />
            </div>
            <SpinStamp className="absolute -bottom-6 right-0 sm:-right-4" />
          </div>
          <div className="space-y-4">
            <h2 className="section-title">Hello from {brand.name}</h2>
            <span className="wave block" aria-hidden />
            <p className="text-lg text-choco-light">
              {brand.name} is run by {brand.owner} from {addressText}. Every day we turn farm milk, real fruit and good sugar into tubs, cones and kulfi.
            </p>
            <p className="text-choco-light">
              Street vendors carry our carts, families order home delivery, and couples trust us with their wedding dessert counter.
              Whatever the size of the order, it gets the same care.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link href="/products" className="btn-primary">Taste our flavours</Link>
              <Link href="/wedding" className="btn-outline">Plan an event</Link>
            </div>
          </div>
        </section>

        <section className="bg-sun py-12">
          <div className="container-page grid gap-4 md:grid-cols-3">
            {values.map(({ icon: Icon, title, text }) => (
              <div key={title} className="group flex flex-col items-center gap-3 rounded-3xl bg-white p-6 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                <span className="flex size-14 items-center justify-center rounded-full bg-berry text-white transition group-hover:rotate-12 group-hover:scale-110"><Icon className="size-6" /></span>
                <h3 className="font-display text-xl font-semibold uppercase tracking-wide">{title}</h3>
                <p className="text-sm text-choco-light">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="container-page max-w-3xl">
          <div className="mb-8 flex flex-col items-center gap-2 text-center">
            <h2 className="section-title">Questions? Answered</h2>
            <span className="wave" aria-hidden />
          </div>
          <div className="space-y-3">
            {faqs.map(([q, a]) => (
              <details key={q} className="surface group p-5 open:ring-2 open:ring-berry/30">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-lg font-semibold uppercase tracking-wide group-open:text-berry [&::-webkit-details-marker]:hidden">
                  {q}
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-berry-light text-berry transition group-open:rotate-45 group-open:bg-berry group-open:text-white">
                    <Plus className="size-4" />
                  </span>
                </summary>
                <p className="mt-3 text-choco-light">{a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="container-page max-w-3xl">
          <div className="flex flex-col items-center gap-4 rounded-[2rem] bg-choco p-8 text-center text-cream sm:flex-row sm:justify-between sm:text-left">
            <div>
              <h2 className="font-display text-2xl font-bold uppercase tracking-wide">Still have a question?</h2>
              <p className="text-sm text-cream/75">Call {brand.owner} on <a href={telLink} className="font-semibold text-sun hover:underline">{brand.phoneDisplay}</a></p>
            </div>
            <a href={whatsappLink()} target="_blank" rel="noreferrer" className="btn shrink-0 bg-[#25d366] text-white hover:brightness-95">WhatsApp us</a>
          </div>
        </section>
      </div>
    </>
  );
}
