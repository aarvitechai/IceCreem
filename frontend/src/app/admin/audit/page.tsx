"use client";

import { useState } from "react";
import { RequireAuth } from "@/components/auth/require-auth";
import { PageLoader, Pager } from "@/components/ui";
import { useAuditLogsQuery } from "@/features/admin/api";
import { dateTime } from "@/lib/format";

const ENTITIES = ["Order", "Booking", "Product", "ProductVariant", "User", "RawMaterial", "ProductionBatch", "Hawker", "HawkerStockIssue", "Coupon", "Category"];

export default function AuditPage() {
  return (
    <RequireAuth roles={["SuperAdmin"]}>
      <Audit />
    </RequireAuth>
  );
}

function Audit() {
  const [page, setPage] = useState(1);
  const [entity, setEntity] = useState("");
  const { data, isLoading } = useAuditLogsQuery({ page, entity });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Audit log</h1>
      <select value={entity} onChange={(e) => { setEntity(e.target.value); setPage(1); }} className="input max-w-xs" aria-label="Entity">
        <option value="">All records</option>
        {ENTITIES.map((e) => <option key={e}>{e}</option>)}
      </select>
      {isLoading ? <PageLoader /> : (
        <div className="card overflow-x-auto">
          <table className="table-base">
            <thead><tr><th>When</th><th>User</th><th>Action</th><th>Record</th><th>Changes</th></tr></thead>
            <tbody>
              {data?.items.map((a) => (
                <tr key={a.id}>
                  <td className="whitespace-nowrap text-xs">{dateTime(a.at)}</td>
                  <td>{a.userName ?? <span className="text-choco-light">System or guest</span>}</td>
                  <td className="font-semibold">{a.action}</td>
                  <td>{a.entityName} #{a.entityId}</td>
                  <td><code className="block max-w-md truncate text-xs text-choco-light" title={a.changes ?? ""}>{a.changes}</code></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data && <Pager page={data.page} totalPages={data.totalPages} onChange={setPage} />}
    </div>
  );
}
