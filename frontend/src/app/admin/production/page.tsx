"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Modal, PageLoader, SelectField, StatusBadge, TextField } from "@/components/ui";
import {
  type Batch, type RecipeLine, useBatchesQuery, useCompleteBatchMutation, useCreateBatchMutation, useFinishedStockQuery,
  useRawMaterialsQuery, useRecipeQuery, useSaveRecipeMutation, useStartBatchMutation,
} from "@/features/admin/api";
import { dateTime } from "@/lib/format";
import { errorMessage } from "@/store/api";

export default function ProductionPage() {
  const { data: batches, isLoading } = useBatchesQuery();
  const { data: packs } = useFinishedStockQuery();
  const [create, { isLoading: creating }] = useCreateBatchMutation();
  const [start] = useStartBatchMutation();
  const [variantId, setVariantId] = useState("");
  const [qty, setQty] = useState("100");
  const [completing, setCompleting] = useState<Batch | null>(null);
  const [recipeFor, setRecipeFor] = useState<number | null>(null);

  const run = async (work: () => Promise<unknown>, ok: string) => {
    try { await work(); toast.success(ok); } catch (e) { toast.error(errorMessage(e)); }
  };

  if (isLoading) return <PageLoader />;

  const columns: { status: Batch["status"]; title: string }[] = [
    { status: "Planned", title: "Planned" },
    { status: "Running", title: "Running" },
    { status: "Completed", title: "Completed" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Production</h1>

      <section className="card flex flex-wrap items-end gap-3 p-5">
        <div className="min-w-56 flex-1">
          <SelectField label="Product pack" value={variantId} onChange={(e) => setVariantId(e.target.value)}>
            <option value="">Choose</option>
            {packs?.map((p) => <option key={p.variantId} value={p.variantId}>{p.productName} . {p.variantName}</option>)}
          </SelectField>
        </div>
        <div className="w-32"><TextField label="Planned units" type="number" value={qty} onChange={(e) => setQty(e.target.value)} /></div>
        <button disabled={!variantId} onClick={() => setRecipeFor(Number(variantId))} className="btn-outline">Recipe</button>
        <button
          disabled={!variantId || !Number(qty) || creating}
          onClick={() => run(() => create({ variantId: Number(variantId), plannedQty: Number(qty) }).unwrap(), "Batch planned")}
          className="btn-primary"
        >
          Plan batch
        </button>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        {columns.map((col) => {
          const list = batches?.items.filter((b) => b.status === col.status) ?? [];
          return (
            <section key={col.status} className="rounded-2xl bg-cream-dark/60 p-3">
              <h2 className="mb-3 flex items-center justify-between px-2 font-semibold">{col.title} <span className="text-sm text-choco-light">{list.length}</span></h2>
              <div className="space-y-2">
                {list.map((b) => (
                  <div key={b.id} className="card space-y-2 p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs">{b.batchNo}</span>
                      <StatusBadge value={b.status} />
                    </div>
                    <div className="font-semibold">{b.productName} <span className="font-normal text-choco-light">{b.variantName}</span></div>
                    <div className="text-sm text-choco-light">
                      Planned {b.plannedQty}
                      {b.status === "Completed" && <> . Made <b className="text-choco">{b.producedQty}</b> . Waste {b.wastageQty}</>}
                    </div>
                    <div className="text-xs text-choco-light">{dateTime(b.completedAt ?? b.startedAt ?? b.createdAt)}</div>
                    {b.status === "Planned" && <button onClick={() => run(() => start(b.id).unwrap(), "Batch started, raw material deducted")} className="btn-primary btn-sm w-full">Start batch</button>}
                    {b.status === "Running" && <button onClick={() => setCompleting(b)} className="btn-primary btn-sm w-full">Complete</button>}
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {completing && <CompleteModal batch={completing} onClose={() => setCompleting(null)} />}
      {recipeFor && <RecipeModal variantId={recipeFor} onClose={() => setRecipeFor(null)} />}
    </div>
  );
}

function CompleteModal({ batch, onClose }: { batch: Batch; onClose: () => void }) {
  const [complete, { isLoading }] = useCompleteBatchMutation();
  const [produced, setProduced] = useState(String(batch.plannedQty));
  const [waste, setWaste] = useState("0");
  return (
    <Modal open title={`Complete ${batch.batchNo}`} onClose={onClose}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Units produced" type="number" value={produced} onChange={(e) => setProduced(e.target.value)} />
          <TextField label="Units wasted" type="number" value={waste} onChange={(e) => setWaste(e.target.value)} />
        </div>
        <p className="text-xs text-choco-light">Produced units are added to finished stock right away.</p>
        <button
          disabled={isLoading}
          className="btn-primary w-full"
          onClick={async () => {
            try {
              await complete({ id: batch.id, producedQty: Number(produced), wastageQty: Number(waste) }).unwrap();
              toast.success("Batch completed");
              onClose();
            } catch (e) {
              toast.error(errorMessage(e));
            }
          }}
        >
          Complete batch
        </button>
      </div>
    </Modal>
  );
}

function RecipeModal({ variantId, onClose }: { variantId: number; onClose: () => void }) {
  const { data: recipe, isLoading } = useRecipeQuery(variantId);
  return (
    <Modal open title={`Recipe: ${recipe?.variantName ?? ""}`} onClose={onClose}>
      {isLoading || !recipe ? <PageLoader /> : (
        <RecipeEditor
          variantId={variantId}
          initial={recipe.items.map((i) => ({ rawMaterialId: i.rawMaterialId, qtyPerUnit: i.qtyPerUnit }))}
          onDone={onClose}
        />
      )}
    </Modal>
  );
}

function RecipeEditor({ variantId, initial, onDone }: { variantId: number; initial: RecipeLine[]; onDone: () => void }) {
  const { data: materials } = useRawMaterialsQuery();
  const [save, { isLoading: saving }] = useSaveRecipeMutation();
  const [lines, setLines] = useState<RecipeLine[]>(initial);

  return (
        <div className="space-y-3">
          <p className="text-xs text-choco-light">Raw material needed to make one unit.</p>
          {lines.map((l, i) => (
            <div key={i} className="flex items-end gap-2">
              <div className="flex-1">
                <SelectField label="Material" value={l.rawMaterialId} onChange={(e) => setLines(lines.map((x, j) => (j === i ? { ...x, rawMaterialId: Number(e.target.value) } : x)))}>
                  <option value={0}>Choose</option>
                  {materials?.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>)}
                </SelectField>
              </div>
              <div className="w-28"><TextField label="Per unit" type="number" step="0.001" value={l.qtyPerUnit} onChange={(e) => setLines(lines.map((x, j) => (j === i ? { ...x, qtyPerUnit: Number(e.target.value) } : x)))} /></div>
              <button onClick={() => setLines(lines.filter((_, j) => j !== i))} className="btn-ghost btn-sm mb-1 text-red-600" aria-label="Remove"><Trash2 className="size-4" /></button>
            </div>
          ))}
          <button onClick={() => setLines([...lines, { rawMaterialId: 0, qtyPerUnit: 0 }])} className="btn-outline btn-sm"><Plus className="size-4" /> Add material</button>
          <button
            disabled={saving || lines.some((l) => !l.rawMaterialId || l.qtyPerUnit <= 0)}
            className="btn-primary w-full"
            onClick={async () => {
              try { await save({ variantId, items: lines }).unwrap(); toast.success("Recipe saved"); onDone(); } catch (e) { toast.error(errorMessage(e)); }
            }}
          >
            Save recipe
          </button>
        </div>
  );
}
