import type { Metadata } from "next";
import Link from "next/link";
import { brand, telLink } from "@/lib/brand";

export const metadata: Metadata = { title: "About and FAQ" };

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
    <div className="container-page max-w-3xl space-y-10 py-10">
      <section className="space-y-3">
        <h1 className="text-4xl font-bold">About {brand.name}</h1>
        <p className="text-lg text-choco-light">
          {brand.name} is run by {brand.owner}. Every day we turn farm milk, real fruit and good sugar into tubs, cones and kulfi.
          Street vendors carry our carts, families order home delivery, and couples trust us with their wedding dessert counter.
        </p>
      </section>
      <section>
        <h2 className="mb-4 text-2xl font-bold">Frequently asked questions</h2>
        <div className="space-y-3">
          {faqs.map(([q, a]) => (
            <details key={q} className="card group p-5">
              <summary className="cursor-pointer list-none font-semibold group-open:text-berry">{q}</summary>
              <p className="mt-2 text-sm text-choco-light">{a}</p>
            </details>
          ))}
        </div>
      </section>
      <section className="card flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <h2 className="text-xl font-bold">Still have a question?</h2>
          <p className="text-sm text-choco-light">Call {brand.owner} on <a href={telLink} className="font-semibold text-berry">{brand.phoneDisplay}</a></p>
        </div>
        <Link href="/contact" className="btn-primary">Contact us</Link>
      </section>
    </div>
  );
}
