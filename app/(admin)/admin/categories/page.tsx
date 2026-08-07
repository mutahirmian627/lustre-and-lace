import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { getAdminCategories, getTopLevelCategoriesForSelect } from "@/actions/admin/categories.actions";
import { CategoriesList } from "@/features/admin/components/CategoriesList";
import { CategoryFormDialog } from "@/features/admin/components/CategoryFormDialog";

export const metadata: Metadata = { title: "Admin — Categories" };

export default async function AdminCategoriesPage() {
  const [categories, topLevelCategories] = await Promise.all([
    getAdminCategories(),
    getTopLevelCategoriesForSelect(),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-2xl text-foreground">Categories</h2>
        <CategoryFormDialog
          topLevelCategories={topLevelCategories}
          trigger={<Button>+ New Category</Button>}
        />
      </div>
      <CategoriesList categories={categories} />
    </div>
  );
}
