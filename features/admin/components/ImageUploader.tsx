"use client";

import { useRef, useState } from "react";
import { useFieldArray, useWatch, type Control } from "react-hook-form";
import { toast } from "sonner";
import { ArrowUp, ArrowDown, Trash2, Upload } from "lucide-react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProductFormInput } from "@/features/admin/types";

/**
 * Real Cloudinary upload alongside a manual URL fallback — the fallback
 * matters because this environment's Cloudinary credentials are still
 * placeholders (specs/17's pre-launch checklist), so it's the only path
 * that's actually testable without real credentials right now.
 */
export function ImageUploader({ control }: { control: Control<ProductFormInput> }) {
  const { fields, append, remove, move, update } = useFieldArray({ control, name: "images" });
  const variants = useWatch({ control, name: "variants" });
  const [urlInput, setUrlInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function addImage(url: string) {
    if (!url.trim()) return;
    append({ url: url.trim(), altText: "", variantKey: "", isPrimary: fields.length === 0 });
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed.");
      addImage(data.url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleSetPrimary(index: number) {
    fields.forEach((field, i) => {
      update(i, { ...(field as ProductFormInput["images"][number]), isPrimary: i === index });
    });
  }

  return (
    <div className="space-y-4">
      <h3 className="font-heading text-lg text-foreground">Images</h3>

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          <Upload className="size-3.5" />
          {isUploading ? "Uploading..." : "Upload Image"}
        </Button>
        <Input
          placeholder="Or paste an image URL"
          value={urlInput}
          onValueChange={setUrlInput}
          className="max-w-xs"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            addImage(urlInput);
            setUrlInput("");
          }}
        >
          Add
        </Button>
      </div>

      {fields.map((field, index) => (
        <div key={field.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
          <div className="relative size-16 shrink-0 overflow-hidden rounded-md bg-muted">
            {field.url && (
              <Image src={field.url} alt="" fill sizes="64px" className="object-cover" unoptimized />
            )}
          </div>
          <div className="flex-1 space-y-2">
            <Input
              placeholder="Alt text (optional)"
              defaultValue={field.altText}
              onValueChange={(v) => update(index, { ...(field as ProductFormInput["images"][number]), altText: v })}
            />
            <div className="flex flex-wrap items-center gap-3">
              <Select
                items={[
                  { label: "General (all variants)", value: "__general__" },
                  ...(variants?.map((v, i) => ({ label: v.name || `Variant ${i + 1}`, value: String(i) })) ?? []),
                ]}
                value={field.variantKey || "__general__"}
                onValueChange={(v) =>
                  update(index, {
                    ...(field as ProductFormInput["images"][number]),
                    variantKey: v === "__general__" || !v ? "" : v,
                  })
                }
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__general__">General (all variants)</SelectItem>
                  {variants?.map((v, i) => (
                    <SelectItem key={i} value={String(i)}>
                      {v.name || `Variant ${i + 1}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <Checkbox checked={!!field.isPrimary} onCheckedChange={() => handleSetPrimary(index)} />
                Primary
              </label>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Move up"
              disabled={index === 0}
              onClick={() => move(index, index - 1)}
            >
              <ArrowUp className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Move down"
              disabled={index === fields.length - 1}
              onClick={() => move(index, index + 1)}
            >
              <ArrowDown className="size-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon-sm" aria-label="Remove image" onClick={() => remove(index)}>
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
