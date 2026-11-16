"use client";

import { useState } from "react";
import { toast } from "sonner";
import { RequireAuth } from "@/components/auth/require-auth";
import { Modal, PageLoader, Pager, SelectField, TextField } from "@/components/ui";
import { useCreateUserMutation, useUpdateUserMutation, useUsersQuery } from "@/features/admin/api";
import { dateTime } from "@/lib/format";
import type { UserRole } from "@/lib/types";
import { errorMessage } from "@/store/api";

const ROLES: UserRole[] = ["SuperAdmin", "Admin", "Staff", "Hawker", "Delivery", "Customer"];

export default function UsersPage() {
  return (
    <RequireAuth roles={["SuperAdmin"]}>
      <Users />
    </RequireAuth>
  );
}

function Users() {
  const [page, setPage] = useState(1);
  const [role, setRole] = useState<UserRole | "">("");
  const [search, setSearch] = useState("");
  const { data, isLoading } = useUsersQuery({ page, role, search });
  const [update] = useUpdateUserMutation();
  const [create, { isLoading: creating }] = useCreateUserMutation();
  const [form, setForm] = useState<{ fullName: string; email: string; mobile: string; role: UserRole; password: string } | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Users</h1>
        <button onClick={() => setForm({ fullName: "", email: "", mobile: "", role: "Staff", password: "" })} className="btn-primary">Add user</button>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search name, email, mobile" className="input sm:max-w-sm" />
        <select value={role} onChange={(e) => { setRole(e.target.value as UserRole | ""); setPage(1); }} className="input sm:w-48" aria-label="Role">
          <option value="">All roles</option>
          {ROLES.map((r) => <option key={r}>{r}</option>)}
        </select>
      </div>
      {isLoading ? <PageLoader /> : (
        <div className="card overflow-x-auto">
          <table className="table-base">
            <thead><tr><th>Name</th><th>Contact</th><th>Role</th><th>Last login</th><th>Active</th></tr></thead>
            <tbody>
              {data?.items.map((u) => (
                <tr key={u.id}>
                  <td className="font-semibold">{u.fullName}</td>
                  <td>{u.email}<div className="text-xs text-choco-light">{u.mobile}</div></td>
                  <td>
                    <select
                      value={u.role}
                      onChange={(e) => update({ id: u.id, fullName: u.fullName, role: e.target.value as UserRole, isActive: u.isActive }).unwrap().then(() => toast.success("Role updated")).catch((err) => toast.error(errorMessage(err)))}
                      className="input py-1 text-xs"
                      aria-label={`Role of ${u.fullName}`}
                    >
                      {ROLES.map((r) => <option key={r}>{r}</option>)}
                    </select>
                  </td>
                  <td className="text-xs text-choco-light">{u.lastLoginAt ? dateTime(u.lastLoginAt) : "Never"}</td>
                  <td>
                    <input
                      type="checkbox"
                      checked={u.isActive}
                      onChange={(e) => update({ id: u.id, fullName: u.fullName, role: u.role, isActive: e.target.checked }).unwrap().catch((err) => toast.error(errorMessage(err)))}
                      className="size-4 accent-berry"
                      aria-label={`Active ${u.fullName}`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data && <Pager page={data.page} totalPages={data.totalPages} onChange={setPage} />}

      <Modal open={!!form} title="New user" onClose={() => setForm(null)}>
        {form && (
          <div className="space-y-4">
            <TextField label="Full name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <TextField label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <TextField label="Mobile" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
            </div>
            <SelectField label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}>
              {ROLES.map((r) => <option key={r}>{r}</option>)}
            </SelectField>
            <TextField label="Temporary password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} hint="8+ characters, one capital letter, one number" />
            <button
              disabled={creating}
              className="btn-primary w-full"
              onClick={async () => {
                try { await create(form).unwrap(); toast.success("User created"); setForm(null); } catch (e) { toast.error(errorMessage(e)); }
              }}
            >
              Create user
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
