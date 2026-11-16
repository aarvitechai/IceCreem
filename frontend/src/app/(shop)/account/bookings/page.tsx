"use client";

import Link from "next/link";
import { toast } from "sonner";
import { EmptyState, PageLoader, StatusBadge } from "@/components/ui";
import { useAcceptQuoteMutation, useMyBookingsQuery } from "@/features/bookings/api";
import { date, money } from "@/lib/format";
import { errorMessage } from "@/store/api";

export default function MyBookingsPage() {
  const { data, isLoading } = useMyBookingsQuery();
  const [accept, { isLoading: accepting }] = useAcceptQuoteMutation();

  if (isLoading) return <PageLoader />;
  if (!data || data.items.length === 0) {
    return <EmptyState title="No event bookings yet" action={<Link href="/wedding/book" className="btn-primary">Book for an event</Link>} />;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {data.items.map((b) => (
        <div key={b.id} className="card space-y-3 p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm text-choco-light">{b.bookingNumber}</div>
              <h3 className="text-xl font-bold">{b.eventType} on {date(b.eventDate)}</h3>
              <div className="text-sm text-choco-light">{b.venueName} . {b.guestCount} guests . {b.packageName ?? "Custom"}</div>
            </div>
            <StatusBadge value={b.status} />
          </div>

          {b.quotedAmount > 0 ? (
            <dl className="grid grid-cols-3 gap-2 rounded-xl bg-cream p-3 text-center text-sm">
              <div><dt className="text-xs text-choco-light">Quote</dt><dd className="font-bold">{money(b.quotedAmount)}</dd></div>
              <div><dt className="text-xs text-choco-light">Paid</dt><dd className="font-bold text-emerald-700">{money(b.advancePaid)}</dd></div>
              <div><dt className="text-xs text-choco-light">Balance</dt><dd className="font-bold">{money(b.balanceAmount)}</dd></div>
            </dl>
          ) : (
            <p className="rounded-xl bg-mango-light p-3 text-sm">Our team is preparing your quote. Estimate: {money(b.estimatedAmount)}</p>
          )}

          {b.status === "Quoted" && (
            <div className="space-y-2">
              {b.adminNotes && <p className="text-sm text-choco-light">Note from team: {b.adminNotes}</p>}
              <p className="text-xs text-choco-light">Valid till {b.quoteValidTill && date(b.quoteValidTill)}. After accepting, pay {money(b.requiredAdvance)} advance to lock the date.</p>
              <button
                disabled={accepting}
                onClick={async () => {
                  try {
                    await accept(b.id).unwrap();
                    toast.success("Quote accepted. Our team will collect the advance.");
                  } catch (e) {
                    toast.error(errorMessage(e));
                  }
                }}
                className="btn-primary w-full"
              >
                Accept quote
              </button>
            </div>
          )}
          {b.status === "Confirmed" && (
            <p className="text-sm text-choco-light">Please pay the advance of {money(b.requiredAdvance)} by UPI or cash. Our team will call you.</p>
          )}
        </div>
      ))}
    </div>
  );
}
