"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { OrderTracker } from "@/components/order/order-tracker";
import { EmptyState, Modal, PageLoader, TextArea } from "@/components/ui";
import { useCancelOrderMutation, useOrderQuery } from "@/features/orders/api";
import { useOrderHub } from "@/hooks/use-order-hub";
import { errorMessage } from "@/store/api";

export default function MyOrderPage() {
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading, refetch } = useOrderQuery(Number(id));
  const [cancel, { isLoading: cancelling }] = useCancelOrderMutation();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");

  useOrderHub(order?.orderNumber ?? null, { onStatus: () => void refetch(), onLocation: () => void refetch() });

  if (isLoading) return <PageLoader />;
  if (!order) return <EmptyState title="Order not found" action={<Link href="/account/orders" className="btn-primary">Back to orders</Link>} />;

  const canCancel = order.nextStatuses.includes("Cancelled");

  const submit = async () => {
    try {
      await cancel({ id: order.id, reason }).unwrap();
      toast.success("Order cancelled");
      setOpen(false);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link href="/account/orders" className="text-sm font-semibold text-berry">Back to orders</Link>
        {canCancel && <button onClick={() => setOpen(true)} className="btn-outline btn-sm">Cancel order</button>}
      </div>
      <OrderTracker order={order} live />
      <Modal open={open} title="Cancel this order?" onClose={() => setOpen(false)}>
        <div className="space-y-4">
          <TextArea label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ordered by mistake, change of plan..." />
          <button onClick={submit} disabled={!reason.trim() || cancelling} className="btn-primary w-full">Cancel order</button>
        </div>
      </Modal>
    </div>
  );
}
