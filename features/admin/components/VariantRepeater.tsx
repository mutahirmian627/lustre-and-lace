"use client";

import { Controller, type Control, type FieldErrors, type UseFormRegister } from "react-hook-form";
import { useFieldArray } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PRODUCT_ATTRIBUTES } from "@/constants/product-attributes";
import type { ProductFormInput } from "@/features/admin/types";

/**
 * Exactly one variant must be marked default (specs/13) — selecting a new
 * one clears every other row's flag, mirroring the same single-default
 * pattern already used for addresses (specs/12).
 */
export function VariantRepeater({
  control,
  register,
  errors,
}: {
  control: Control<ProductFormInput>;
  register: UseFormRegister<ProductFormInput>;
  errors: FieldErrors<ProductFormInput>;
}) {
  const { fields, append, remove, update } = useFieldArray({ control, name: "variants" });

  function handleSetDefault(index: number) {
    fields.forEach((field, i) => {
      update(i, { ...(field as ProductFormInput["variants"][number]), isDefault: i === index });
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-lg text-foreground">Variants</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            append({
              name: "",
              price: 0,
              stockQuantity: 0,
              isDefault: fields.length === 0,
            })
          }
        >
          <Plus className="size-3.5" />
          Add Variant
        </Button>
      </div>
      {errors.variants?.root && (
        <p className="text-sm text-destructive">{errors.variants.root.message}</p>
      )}

      {fields.map((field, index) => (
        <div key={field.id} className="space-y-3 rounded-lg border border-border p-4">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <Checkbox
                checked={!!field.isDefault}
                onCheckedChange={() => handleSetDefault(index)}
              />
              Default variant
            </label>
            <Button type="button" variant="ghost" size="icon-sm" aria-label="Remove variant" onClick={() => remove(index)}>
              <Trash2 className="size-4" />
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field data-invalid={!!errors.variants?.[index]?.name}>
              <FieldLabel>Variant name</FieldLabel>
              <Input {...register(`variants.${index}.name`)} placeholder="e.g. Rose Gold Plated" />
              <FieldError errors={[errors.variants?.[index]?.name]} />
            </Field>
            <Field>
              <FieldLabel>SKU (optional)</FieldLabel>
              <Input {...register(`variants.${index}.sku`)} />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Field data-invalid={!!errors.variants?.[index]?.price}>
              <FieldLabel>Price (PKR)</FieldLabel>
              <Input type="number" step="0.01" {...register(`variants.${index}.price`)} />
              <FieldError errors={[errors.variants?.[index]?.price]} />
            </Field>
            <Field>
              <FieldLabel>Compare-at price (optional)</FieldLabel>
              <Input type="number" step="0.01" {...register(`variants.${index}.compareAtPrice`)} />
            </Field>
            <Field data-invalid={!!errors.variants?.[index]?.stockQuantity}>
              <FieldLabel>Stock quantity</FieldLabel>
              <Input type="number" {...register(`variants.${index}.stockQuantity`)} />
              <FieldError errors={[errors.variants?.[index]?.stockQuantity]} />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {(["plating", "color", "size"] as const).map((attr) => (
              <Controller
                key={attr}
                control={control}
                name={`variants.${index}.${attr}`}
                render={({ field: attrField }) => (
                  <Field>
                    <FieldLabel className="capitalize">{attr}</FieldLabel>
                    <Select
                      items={[
                        { label: "— None —", value: "__none__" },
                        ...PRODUCT_ATTRIBUTES[attr].map((value) => ({ label: value, value })),
                      ]}
                      value={attrField.value || "__none__"}
                      onValueChange={(v) => attrField.onChange(v === "__none__" ? "" : v)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">— None —</SelectItem>
                        {PRODUCT_ATTRIBUTES[attr].map((value) => (
                          <SelectItem key={value} value={value}>
                            {value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
