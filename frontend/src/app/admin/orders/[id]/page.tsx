"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { OrderTracker } from "@/components/order/order-tracker";
import { EmptyState, Modal, PageLoader, TextArea } from "@/components/ui";
import { useAdminOrderQuery, useAssignDeliveryMutation, useChangeOrderStatusMutation, useDeliveryPartnersQuery } from "@/features/orders/api";
import { useOrderHub } from "@/hooks/use-order-hub";
import { label } from "@/lib/format";
import { ADMIN_ROLES } from "@/lib/roles";
import type { OrderStatus } from "@/lib/types";
import { errorMessage } from "@/store/api";
import { useAppSelector } from "@/store/store";

export default function AdminOrderPage() {
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading, refetch } = useAdminOrderQuery(Number(id));
  const { data: partners } = useDeliveryPartnersQuery();
  const [changeStatus, { isLoading: saving }] = useChangeOrderStatusMutation();
  const [assign, { isLoading: assigning }] = useAssignDeliveryMutation();
  const role = useAppSelector((s) => s.auth.user?.role);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [partnerId, setPartnerId] = useState("");

  useOrderHub(order?.orderNumber ?? null, { onStatus: () => void refetch(), onLocation: () => void refetch() });

  if (isLoading) return <PageLoader />;
  if (!order) return <EmptyState title="Order not found" action={<Link href="/admin/orders" className="btn-primary">Back</Link>} />;

  const move = async (status: OrderStatus, remark?: string) => {
    try {
      await changeStatus({ id: order.id, status, remark }).unwrap();
      toast.success(`Moved to ${label(status)}`);
      setCancelOpen(false);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  // With a rider assigned, delivery is confirmed by the customer's OTP in the rider app.
  const forward = order.nextStatuses.filter((s) => s !== "Cancelled" && !(s === "Delivered" && order.deliveryPartnerName));
  const canAssign = role && ADMIN_ROLES.includes(role) && ["Confirmed", "InProduction", "Packed"].includes(order.status);

  return (
    <div className="space-y-4">
      <Link href="/admin/orders" className="text-sm font-semibold text-berry">Back to orders</Link>

      <div className="card flex flex-wrap items-center gap-3 p-4">
        <span className="text-sm font-semibold">Actions:</span>
        {forward.map((s) => (
          <button key={s} disabled={saving} onClick={() => move(s)} className="btn-primary btn-sm">Mark {label(s).toLowerCase()}</button>
        ))}
        {order.nextStatuses.includes("Cancelled") && (
          <button onClick={() => setCancelOpen(true)} className="btn-outline btn-sm">Cancel order</button>
        )}
        {forward.length === 0 && !order.nextStatuses.includes("Cancelled") && <span className="text-sm text-choco-light">No further actions.</span>}

        {canAssign && (
          <div className="ml-auto flex items-center gap-2">
            <select value={partnerId} onChange={(e) => setPartnerId(e.target.value)} className="input py-1.5 text-xs" aria-label="Delivery partner">
              <option value="">{order.deliveryPartnerName ? `Rider: ${order.deliveryPartnerName}` : "Choose rider"}</option>
              {partners?.map((p) => <option key={p.id} value={p.id}>{p.fullName}</option>)}
            </select>
            <button
              disabled={!partnerId || assigning}
              onClick={async () => {
                try {
                  await assign({ id: order.id, partnerId: Number(partnerId) }).unwrap();
                  toast.success("Rider assigned. OTP shared with the customer.");
                  setPartnerId("");
                } catch (e) {
                  toast.error(errorMessage(e));
                }
              }}
              className="btn-outline btn-sm"
            >
              Assign
            </button>
          </div>
        )}
      </div>

      {order.notes && <div className="card bg-mango-light p-4 text-sm"><b>Customer note:</b> {order.notes}</div>}
      <OrderTracker order={order} live />

      <Modal open={cancelOpen} title="Cancel order" onClose={() => setCancelOpen(false)}>
        <div className="space-y-4">
          <TextArea label="Reason (shown to customer)" value={reason} onChange={(e) => setReason(e.target.value)} />
          <button disabled={!reason.trim() || saving} onClick={() => move("Cancelled", reason)} className="btn-primary w-full">Cancel order</button>
        </div>
      </Modal>
    </div>
  );
}
