"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VariantRepeater } from "@/features/admin/components/VariantRepeater";
import { ImageUploader } from "@/features/admin/components/ImageUploader";
import { createProduct, updateProduct } from "@/actions/admin/products.actions";
import { productFormSchema, type ProductFormInput } from "@/features/admin/types";
import { slugify } from "@/utils/slugify";
import type { getProductForEdit } from "@/actions/admin/products.actions";

type ProductWithRelations = Awaited<ReturnType<typeof getProductForEdit>>;

export function ProductForm({
  product,
  categories,
}: {
  product?: ProductWithRelations;
  categories: { id: string; name: string; parentId: string | null }[];
}) {
  const router = useRouter();
  const slugManuallyEdited = useRef(!!product);

  const defaultValues: ProductFormInput = product
    ? {
        name: product.name,
        slug: product.slug,
        description: product.description ?? "",
        categoryId: product.categoryId,
        compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : "",
        sku: product.sku ?? "",
        isFeatured: product.isFeatured,
        isTrending: product.isTrending,
        isActive: product.isActive,
        variants: product.variants.map((v) => ({
          id: v.id,
          name: v.name,
          sku: v.sku ?? "",
          price: Number(v.price),
          compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : "",
          stockQuantity: v.stockQuantity,
          plating: v.attributes.plating ?? "",
          color: v.attributes.color ?? "",
          size: v.attributes.size ?? "",
          isDefault: v.isDefault,
        })),
        images: product.images.map((img) => ({
          id: img.id,
          url: img.url,
          altText: img.altText ?? "",
          variantKey: img.variantId
            ? String(product.variants.findIndex((v) => v.id === img.variantId))
            : "",
          isPrimary: img.isPrimary,
        })),
      }
    : {
        name: "",
        slug: "",
        description: "",
        categoryId: "",
        sku: "",
        isFeatured: false,
        isTrending: false,
        isActive: true,
        variants: [{ name: "", price: 0, stockQuantity: 0, isDefault: true }],
        images: [],
      };

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormInput>({
    // zod's z.coerce.number() fields make the resolver's *input* type
    // technically `unknown` (any coercible value), which trips up
    // zodResolver's inferred generic against a single-generic useForm<T> —
    // this cast just tells TS what's already true at runtime: parsed
    // output matches ProductFormInput.
    resolver: zodResolver(productFormSchema) as Resolver<ProductFormInput>,
    defaultValues,
  });

  const name = watch("name");
  useEffect(() => {
    if (!slugManuallyEdited.current) {
      setValue("slug", slugify(name || ""));
    }
  }, [name, setValue]);

  async function onSubmit(data: ProductFormInput) {
    const result = product ? await updateProduct(product.id, data) : await createProduct(data);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success(product ? "Product updated." : "Product created.");
    router.push("/admin/products");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="space-y-4 rounded-lg border border-border p-4">
        <h3 className="font-heading text-lg text-foreground">Basic Info</h3>
        <Field data-invalid={!!errors.name}>
          <FieldLabel>Name</FieldLabel>
          <Input {...register("name")} />
          <FieldError errors={[errors.name]} />
        </Field>
        <Field data-invalid={!!errors.slug}>
          <FieldLabel>Slug</FieldLabel>
          <Input
            {...register("slug")}
            onChange={(e) => {
              slugManuallyEdited.current = true;
              setValue("slug", e.target.value);
            }}
          />
          <FieldError errors={[errors.slug]} />
        </Field>
        <Field>
          <FieldLabel>Description</FieldLabel>
          <Textarea rows={4} {...register("description")} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Controller
            control={control}
            name="categoryId"
            render={({ field }) => (
              <Field data-invalid={!!errors.categoryId}>
                <FieldLabel>Category</FieldLabel>
                <Select
                  items={categories.map((c) => ({
                    label: c.parentId ? `— ${c.name}` : c.name,
                    value: c.id,
                  }))}
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.parentId ? `— ${c.name}` : c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError errors={[errors.categoryId]} />
              </Field>
            )}
          />
          <Field>
            <FieldLabel>SKU (optional)</FieldLabel>
            <Input {...register("sku")} />
          </Field>
        </div>
        <Field>
          <FieldLabel>Compare-at price (optional)</FieldLabel>
          <Input type="number" step="0.01" {...register("compareAtPrice")} />
        </Field>
        <div className="flex flex-wrap gap-6">
          <Controller
            control={control}
            name="isActive"
            render={({ field }) => (
              <label className="flex items-center gap-2 text-sm text-foreground">
                <Checkbox checked={!!field.value} onCheckedChange={field.onChange} />
                Active
              </label>
            )}
          />
          <Controller
            control={control}
            name="isFeatured"
            render={({ field }) => (
              <label className="flex items-center gap-2 text-sm text-foreground">
                <Checkbox checked={!!field.value} onCheckedChange={field.onChange} />
                Featured
              </label>
            )}
          />
          <Controller
            control={control}
            name="isTrending"
            render={({ field }) => (
              <label className="flex items-center gap-2 text-sm text-foreground">
                <Checkbox checked={!!field.value} onCheckedChange={field.onChange} />
                Trending
              </label>
            )}
          />
        </div>
      </div>

      <div className="rounded-lg border border-border p-4">
        <VariantRepeater control={control} register={register} errors={errors} />
      </div>

      <div className="rounded-lg border border-border p-4">
        <ImageUploader control={control} />
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : product ? "Save Changes" : "Create Product"}
      </Button>
    </form>
  );
}
