"use client";

import { useEffect, useRef, useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createCategory, updateCategory } from "@/actions/admin/categories.actions";
import { categoryFormSchema, type CategoryFormInput } from "@/features/admin/types";
import { slugify } from "@/utils/slugify";
import type { categories } from "@/db/schema";

type Category = typeof categories.$inferSelect;

export function CategoryFormDialog({
  category,
  topLevelCategories,
  trigger,
}: {
  category?: Category;
  topLevelCategories: { id: string; name: string }[];
  trigger: React.ReactElement;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const slugManuallyEdited = useRef(!!category);

  function buildDefaultValues(): CategoryFormInput {
    return category
      ? {
          name: category.name,
          slug: category.slug,
          description: category.description ?? "",
          imageUrl: category.imageUrl ?? "",
          parentId: category.parentId ?? "",
          displayOrder: category.displayOrder,
          isActive: category.isActive,
        }
      : { name: "", slug: "", description: "", imageUrl: "", parentId: "", displayOrder: 0, isActive: true };
  }

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormInput>({
    // Same z.coerce.number() vs zodResolver generic mismatch as ProductForm.
    resolver: zodResolver(categoryFormSchema) as Resolver<CategoryFormInput>,
    defaultValues: buildDefaultValues(),
  });

  useEffect(() => {
    if (open) {
      slugManuallyEdited.current = !!category;
      reset(buildDefaultValues());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const name = watch("name");
  useEffect(() => {
    if (!slugManuallyEdited.current) setValue("slug", slugify(name || ""));
  }, [name, setValue]);

  async function onSubmit(data: CategoryFormInput) {
    const result = category ? await updateCategory(category.id, data) : await createCategory(data);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success(category ? "Category updated." : "Category created.");
    setOpen(false);
    router.refresh();
  }

  // Two-level cap (specs/06): only top-level categories are valid parents,
  // which structurally prevents ever creating a third nesting level.
  const parentOptions = topLevelCategories.filter((c) => c.id !== category?.id);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{category ? "Edit Category" : "New Category"}</DialogTitle>
          <DialogDescription>
            {category ? "Update this category's details." : "Categories nest at most two levels deep."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
            <FieldLabel>Description (optional)</FieldLabel>
            <Textarea rows={3} {...register("description")} />
          </Field>
          <Field>
            <FieldLabel>Image URL (optional)</FieldLabel>
            <Input {...register("imageUrl")} />
          </Field>
          <Controller
            control={control}
            name="parentId"
            render={({ field }) => (
              <Field>
                <FieldLabel>Parent Category (optional)</FieldLabel>
                <Select
                  items={[{ label: "— None (top-level) —", value: "__none__" }, ...parentOptions.map((c) => ({ label: c.name, value: c.id }))]}
                  value={field.value || "__none__"}
                  onValueChange={(v) => field.onChange(v === "__none__" || !v ? "" : v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— None (top-level) —</SelectItem>
                    {parentOptions.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
          />
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
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Saving..." : category ? "Save Changes" : "Create Category"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
