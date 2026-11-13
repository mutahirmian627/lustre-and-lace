import type { Metadata } from "next";
import { headers } from "next/headers";
import { Heart } from "lucide-react";
import { auth } from "@/lib/auth";
import { getWishlist } from "@/actions/wishlist.actions";
import { WishlistItem } from "@/features/wishlist/components/WishlistItem";
import { AddAllToCartButton } from "@/features/wishlist/components/AddAllToCartButton";
import { EmptyState } from "@/components/shared/EmptyState";

export const metadata: Metadata = { title: "Wishlist" };

export default async function WishlistPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-center font-heading text-3xl text-foreground">Wishlist</h1>
        <EmptyState
          icon={Heart}
          title="Sign in to see your saved items"
          description="Your wishlist is tied to your account, so it follows you on any device."
          actionLabel="Sign in"
          actionHref={`/shop/login?redirect=${encodeURIComponent("/shop/wishlist")}`}
        />
      </div>
    );
  }

  const items = await getWishlist();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl text-foreground">Wishlist</h1>
          <p className="text-sm text-muted-foreground">{items.length} items</p>
        </div>
        {items.length > 0 && <AddAllToCartButton />}
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Your wishlist is empty"
          description="Save items you love so you can find them again later."
          actionLabel="Browse Products"
          actionHref="/shop/products"
        />
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <WishlistItem key={item.id} product={item.product} />
          ))}
        </div>
      )}
    </div>
  );
}
