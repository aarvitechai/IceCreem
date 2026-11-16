"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Trash2, Upload } from "lucide-react";
import { AppImage, PageLoader, SelectField, Spinner, TextArea, TextField } from "@/components/ui";
import { useAdminCategoriesQuery, useAdminProductQuery, useSaveProductMutation, useUploadImageMutation } from "@/features/admin/api";
import { errorMessage } from "@/store/api";

const variant = z.object({
  id: z.number().optional(),
  sku: z.string().trim().min(1, "Required").max(40),
  name: z.string().trim().min(1, "Required").max(80),
  mrp: z.coerce.number<number>().positive(),
  sellingPrice: z.coerce.number<number>().positive(),
  wholesalePrice: z.coerce.number<number>().min(0),
  isActive: z.boolean(),
}).refine((v) => v.mrp >= v.sellingPrice, { message: "MRP must be at least the price", path: ["mrp"] });

const schema = z.object({
  categoryId: z.coerce.number<number>().positive("Choose a category"),
  name: z.string().trim().min(2).max(150),
  shortDescription: z.string().trim().min(5).max(300),
  description: z.string().max(4000),
  ingredients: z.string().max(1000).nullable(),
  hsnCode: z.string().trim().min(1).max(10),
  gstPercent: z.coerce.number<number>().min(0).max(28),
  isVeg: z.boolean(),
  isFeatured: z.boolean(),
  isActive: z.boolean(),
  imageUrls: z.array(z.string()),
  variants: z.array(variant).min(1, "Add at least one pack"),
});

type Values = z.infer<typeof schema>;

const empty: Values = {
  categoryId: 0, name: "", shortDescription: "", description: "", ingredients: "", hsnCode: "2105", gstPercent: 18,
  isVeg: true, isFeatured: false, isActive: true, imageUrls: [],
  variants: [{ sku: "", name: "500 ml tub", mrp: 0, sellingPrice: 0, wholesalePrice: 0, isActive: true }],
};

export default function ProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === "new";
  const router = useRouter();
  const { data: product, isLoading } = useAdminProductQuery(Number(id), { skip: isNew });
  const { data: categories } = useAdminCategoriesQuery();
  const [save, { isLoading: saving }] = useSaveProductMutation();
  const [upload, { isLoading: uploading }] = useUploadImageMutation();

  const { register, control, handleSubmit, reset, setValue, formState: { errors } } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: empty });
  const variants = useFieldArray({ control, name: "variants" });
  const images = useWatch({ control, name: "imageUrls" });

  useEffect(() => {
    if (product) reset({ ...product, ingredients: product.ingredients ?? "" });
  }, [product, reset]);

  if (!isNew && isLoading) return <PageLoader />;

  const onSubmit = async (values: Values) => {
    try {
      const saved = await save({ id: isNew ? undefined : Number(id), body: values }).unwrap();
      toast.success("Product saved");
      if (isNew) router.replace(`/admin/products/${saved.id}`);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const onFile = async (file?: File) => {
    if (!file) return;
    try {
      const url = await upload(file).unwrap();
      setValue("imageUrls", [...images, url]);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/products" className="text-sm font-semibold text-berry">Back to products</Link>
          <h1 className="text-2xl font-bold">{isNew ? "Add product" : `Edit ${product?.name}`}</h1>
        </div>
        <button disabled={saving} className="btn-primary">{saving && <Spinner className="size-4 text-white" />} Save</button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <section className="card space-y-4 p-6">
            <TextField label="Name" {...register("name")} error={errors.name?.message} />
            <TextField label="Short description" {...register("shortDescription")} error={errors.shortDescription?.message} />
            <TextArea label="Description" rows={4} {...register("description")} />
            <TextArea label="Ingredients" {...register("ingredients")} />
          </section>

          <section className="card space-y-3 p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Pack sizes and prices</h2>
              <button type="button" className="btn-outline btn-sm" onClick={() => variants.append({ sku: "", name: "", mrp: 0, sellingPrice: 0, wholesalePrice: 0, isActive: true })}><Plus className="size-4" /> Add pack</button>
            </div>
            {errors.variants?.message && <p className="field-error">{errors.variants.message}</p>}
            {variants.fields.map((f, i) => {
              const v = product?.variants.find((x) => x.id === f.id);
              return (
                <div key={f.id} className="grid grid-cols-2 gap-3 rounded-2xl bg-cream p-4 sm:grid-cols-6">
                  <TextField label="SKU" {...register(`variants.${i}.sku`)} error={errors.variants?.[i]?.sku?.message} />
                  <div className="sm:col-span-2"><TextField label="Pack name" {...register(`variants.${i}.name`)} error={errors.variants?.[i]?.name?.message} /></div>
                  <TextField label="MRP" type="number" step="0.01" {...register(`variants.${i}.mrp`)} error={errors.variants?.[i]?.mrp?.message} />
                  <TextField label="Price" type="number" step="0.01" {...register(`variants.${i}.sellingPrice`)} />
                  <TextField label="Wholesale" type="number" step="0.01" {...register(`variants.${i}.wholesalePrice`)} />
                  <div className="col-span-2 flex items-center justify-between sm:col-span-6">
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...register(`variants.${i}.isActive`)} className="accent-berry" /> Active</label>
                    {v && <span className="text-xs text-choco-light">Stock {v.stockQty} . Reserved {v.reservedQty}</span>}
                    <button type="button" onClick={() => variants.remove(i)} className="btn-ghost btn-sm text-red-600"><Trash2 className="size-4" /> Remove</button>
                  </div>
                </div>
              );
            })}
            <p className="text-xs text-choco-light">Stock changes through production batches or Inventory, not here.</p>
          </section>
        </div>

        <div className="space-y-6">
          <section className="card space-y-4 p-6">
            <SelectField label="Category" {...register("categoryId")} error={errors.categoryId?.message}>
              <option value={0}>Choose</option>
              {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </SelectField>
            <div className="grid grid-cols-2 gap-3">
              <TextField label="HSN code" {...register("hsnCode")} />
              <TextField label="GST %" type="number" {...register("gstPercent")} />
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...register("isVeg")} className="accent-berry" /> Vegetarian</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...register("isFeatured")} className="accent-berry" /> Featured on home page</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...register("isActive")} className="accent-berry" /> Visible in shop</label>
          </section>

          <section className="card space-y-3 p-6">
            <h2 className="font-semibold">Images</h2>
            <div className="grid grid-cols-3 gap-2">
              {images.map((url, i) => (
                <div key={url + i} className="group relative aspect-square overflow-hidden rounded-xl bg-cream-dark">
                  <AppImage src={url} alt="" sizes="100px" />
                  {i === 0 && <span className="absolute left-1 top-1 rounded bg-berry px-1.5 text-[10px] font-bold text-white">Main</span>}
                  <button type="button" onClick={() => setValue("imageUrls", images.filter((_, j) => j !== i))} className="absolute right-1 top-1 rounded-full bg-white/90 p-1 opacity-0 group-hover:opacity-100" aria-label="Remove image"><Trash2 className="size-3" /></button>
                </div>
              ))}
            </div>
            <label className="btn-outline w-full cursor-pointer">
              {uploading ? <Spinner className="size-4" /> : <Upload className="size-4" />} Upload image
              <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            </label>
            <p className="text-xs text-choco-light">JPG, PNG, WebP or SVG, up to 2 MB. First image is the main one.</p>
          </section>
        </div>
      </div>
    </form>
  );
}
