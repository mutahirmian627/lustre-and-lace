"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowUp, ArrowDown, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CategoryFormDialog } from "@/features/admin/components/CategoryFormDialog";
import { deleteCategory, moveCategory } from "@/actions/admin/categories.actions";
import type { categories } from "@/db/schema";

type Category = typeof categories.$inferSelect;

export function CategoriesList({ categories: allCategories }: { categories: Category[] }) {
  const router = useRouter();
  const topLevel = allCategories.filter((c) => !c.parentId);
  const topLevelForSelect = topLevel.map((c) => ({ id: c.id, name: c.name }));

  async function handleDelete(id: string) {
    const result = await deleteCategory(id);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success("Category deleted.");
    router.refresh();
  }

  async function handleMove(id: string, direction: "up" | "down") {
    const result = await moveCategory(id, direction);
    if ("error" in result) toast.error(result.error);
    else router.refresh();
  }

  function Row({ category, indent }: { category: Category; indent: boolean }) {
    return (
      <div className={`flex items-center justify-between gap-3 border-b border-border py-3 ${indent ? "pl-8" : ""}`}>
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground">
            {indent && "— "}
            {category.name}
          </span>
          <span className="text-xs text-muted-foreground">/{category.slug}</span>
          {!category.isActive && <Badge variant="secondary">Inactive</Badge>}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" aria-label="Move up" onClick={() => handleMove(category.id, "up")}>
            <ArrowUp className="size-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Move down" onClick={() => handleMove(category.id, "down")}>
            <ArrowDown className="size-4" />
          </Button>
          <CategoryFormDialog
            category={category}
            topLevelCategories={topLevelForSelect}
            trigger={
              <Button variant="ghost" size="icon-sm" aria-label="Edit">
                <Pencil className="size-4" />
              </Button>
            }
          />
          <Button variant="ghost" size="icon-sm" aria-label="Delete" onClick={() => handleDelete(category.id)}>
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border px-4">
      {topLevel.map((parent) => (
        <div key={parent.id}>
          <Row category={parent} indent={false} />
          {allCategories
            .filter((c) => c.parentId === parent.id)
            .map((child) => (
              <Row key={child.id} category={child} indent />
            ))}
        </div>
      ))}
    </div>
  );
}
