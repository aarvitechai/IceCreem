"use client";

import { useState } from "react";
import { toast } from "sonner";
import { EmptyState, Modal, PageLoader, Pager, StatusBadge, TextArea, TextField } from "@/components/ui";
import {
  useAdminBookingsQuery, useChangeBookingStatusMutation, useQuoteBookingMutation, useRecordBookingPaymentMutation,
} from "@/features/bookings/api";
import { date, label, money } from "@/lib/format";
import type { Booking, BookingStatus } from "@/lib/types";
import { errorMessage } from "@/store/api";

const STATUSES: BookingStatus[] = ["Enquiry", "Quoted", "Confirmed", "AdvancePaid", "Scheduled", "Delivered", "Closed", "Cancelled"];

export default function AdminBookingsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<BookingStatus | "">("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Booking | null>(null);
  const { data, isLoading } = useAdminBookingsQuery({ page, status, search });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Event bookings</h1>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search booking, name, mobile or venue" className="input sm:max-w-sm" />
        <select value={status} onChange={(e) => { setStatus(e.target.value as BookingStatus | ""); setPage(1); }} className="input sm:w-56" aria-label="Status">
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}
        </select>
      </div>

      {isLoading ? <PageLoader /> : !data?.items.length ? <EmptyState title="No bookings found" /> : (
        <div className="card overflow-x-auto">
          <table className="table-base">
            <thead><tr><th>Event date</th><th>Booking</th><th>Customer</th><th>Guests</th><th>Status</th><th className="text-right">Quote / Paid</th><th /></tr></thead>
            <tbody>
              {data.items.map((b) => (
                <tr key={b.id} className="hover:bg-cream/60">
                  <td className="font-semibold">{date(b.eventDate)}<div className="text-xs font-normal text-choco-light">{b.eventType}</div></td>
                  <td>{b.bookingNumber}<div className="text-xs text-choco-light">{b.venueName}</div></td>
                  <td>{b.contactName}<div className="text-xs text-choco-light">{b.mobile}</div></td>
                  <td>{b.guestCount}<div className="text-xs text-choco-light">{b.packageName ?? "Custom"}</div></td>
                  <td><StatusBadge value={b.status} /></td>
                  <td className="text-right">{b.quotedAmount ? money(b.quotedAmount) : <span className="text-choco/40">est. {money(b.estimatedAmount)}</span>}<div className="text-xs text-emerald-700">{b.advancePaid ? money(b.advancePaid) : ""}</div></td>
                  <td><button onClick={() => setSelected(b)} className="btn-outline btn-sm">Manage</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data && <Pager page={data.page} totalPages={data.totalPages} onChange={setPage} />}
      {selected && <ManageBooking booking={data?.items.find((b) => b.id === selected.id) ?? selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function ManageBooking({ booking: b, onClose }: { booking: Booking; onClose: () => void }) {
  const [quote, { isLoading: quoting }] = useQuoteBookingMutation();
  const [pay, { isLoading: paying }] = useRecordBookingPaymentMutation();
  const [move, { isLoading: moving }] = useChangeBookingStatusMutation();
  const [amount, setAmount] = useState(String(b.quotedAmount || b.estimatedAmount || ""));
  const [validTill, setValidTill] = useState(() => new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10));
  const [notes, setNotes] = useState(b.adminNotes ?? "");
  const [payment, setPayment] = useState(String(b.status === "Confirmed" ? b.requiredAdvance : b.balanceAmount || ""));

  const run = async (work: () => Promise<unknown>, ok: string) => {
    try {
      await work();
      toast.success(ok);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const nextStatus: Partial<Record<BookingStatus, BookingStatus>> = { AdvancePaid: "Scheduled", Scheduled: "Delivered", Delivered: "Closed" };
  const next = nextStatus[b.status];
  const canCancel = !["Delivered", "Closed", "Cancelled"].includes(b.status);

  return (
    <Modal open title={`${b.bookingNumber} . ${b.contactName}`} onClose={onClose}>
      <div className="space-y-5 text-sm">
        <div className="flex items-center justify-between">
          <StatusBadge value={b.status} />
          <span>{date(b.eventDate)} . {b.guestCount} guests</span>
        </div>
        <p className="text-choco-light">{b.venueName}, {b.venueAddress}{b.eventTimeSlot ? ` . ${b.eventTimeSlot}` : ""}</p>
        {b.specialRequest && <p className="rounded-xl bg-mango-light p-3">Request: {b.specialRequest}</p>}

        {(b.status === "Enquiry" || b.status === "Quoted") && (
          <div className="space-y-3 rounded-2xl border border-choco/10 p-4">
            <h4 className="font-semibold">{b.status === "Quoted" ? "Update quote" : "Send quote"}</h4>
            <div className="grid grid-cols-2 gap-3">
              <TextField label="Amount (Rs)" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
              <TextField label="Valid till" type="date" value={validTill} onChange={(e) => setValidTill(e.target.value)} />
            </div>
            <TextArea label="Note to customer" value={notes} onChange={(e) => setNotes(e.target.value)} />
            <button disabled={quoting || !Number(amount)} className="btn-primary w-full" onClick={() => run(() => quote({ id: b.id, amount: Number(amount), validTill, notes }).unwrap(), "Quote sent")}>Send quote</button>
          </div>
        )}

        {["Confirmed", "AdvancePaid", "Scheduled", "Delivered"].includes(b.status) && b.balanceAmount > 0 && (
          <div className="space-y-3 rounded-2xl border border-choco/10 p-4">
            <h4 className="font-semibold">Record payment received</h4>
            <p className="text-xs text-choco-light">Quote {money(b.quotedAmount)} . Paid {money(b.advancePaid)} . Balance {money(b.balanceAmount)}{b.status === "Confirmed" ? ` . Minimum advance ${money(b.requiredAdvance)}` : ""}</p>
            <TextField label="Amount (Rs)" type="number" value={payment} onChange={(e) => setPayment(e.target.value)} />
            <button disabled={paying || !Number(payment)} className="btn-primary w-full" onClick={() => run(() => pay({ id: b.id, amount: Number(payment) }).unwrap(), "Payment recorded")}>Save payment</button>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {next && <button disabled={moving} className="btn-primary btn-sm" onClick={() => run(() => move({ id: b.id, status: next }).unwrap(), `Moved to ${label(next)}`)}>Mark {label(next).toLowerCase()}</button>}
          {canCancel && <button disabled={moving} className="btn-outline btn-sm" onClick={() => confirm("Cancel this booking?") && run(() => move({ id: b.id, status: "Cancelled" }).unwrap(), "Booking cancelled")}>Cancel booking</button>}
        </div>
      </div>
    </Modal>
  );
}
