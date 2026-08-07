"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { toggleWishlist } from "@/actions/wishlist.actions";

interface WishlistContextValue {
  isWishlisted: (productId: string) => boolean;
  count: number;
  toggle: (productId: string) => void;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({
  initialProductIds,
  isLoggedIn,
  children,
}: {
  initialProductIds: string[];
  isLoggedIn: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [productIds, setProductIds] = useState(() => new Set(initialProductIds));
  // Guards against a rapid double-click firing two conflicting toggle requests per product.
  const pending = useRef(new Set<string>());

  const isWishlisted = useCallback((productId: string) => productIds.has(productId), [productIds]);

  const toggle = useCallback(
    (productId: string) => {
      if (!isLoggedIn) {
        toast("Sign in to save items to your wishlist", {
          action: {
            label: "Sign in",
            onClick: () => router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`),
          },
        });
        return;
      }

      if (pending.current.has(productId)) return;
      pending.current.add(productId);

      const wasWishlisted = productIds.has(productId);
      setProductIds((prev) => {
        const next = new Set(prev);
        if (wasWishlisted) next.delete(productId);
        else next.add(productId);
        return next;
      });

      toggleWishlist(productId)
        .then((result) => {
          if ("error" in result) {
            setProductIds((prev) => {
              const next = new Set(prev);
              if (wasWishlisted) next.add(productId);
              else next.delete(productId);
              return next;
            });
            toast.error("Couldn't update your wishlist. Please try again.");
            return;
          }
          toast.success(result.wishlisted ? "Added to wishlist" : "Removed from wishlist");
        })
        .finally(() => {
          pending.current.delete(productId);
        });
    },
    [isLoggedIn, productIds, router]
  );

  return (
    <WishlistContext.Provider value={{ isWishlisted, count: productIds.size, toggle }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) throw new Error("useWishlist must be used within a WishlistProvider");
  return context;
}
