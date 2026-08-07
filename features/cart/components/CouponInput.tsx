"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCart } from "@/features/cart/context/CartProvider";

export function CouponInput() {
  const { coupon, applyCoupon, removeCoupon } = useCart();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  async function handleApply() {
    if (!code.trim()) return;
    setIsApplying(true);
    setError(null);
    const result = await applyCoupon(code);
    setIsApplying(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setCode("");
  }

  if (coupon) {
    return (
      <div className="flex items-center justify-between rounded-md bg-accent px-3 py-2 text-sm">
        <span className="text-foreground">
          Code <strong>{coupon.code}</strong> applied
        </span>
        <button
          type="button"
          aria-label="Remove coupon"
          onClick={removeCoupon}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex gap-2">
        <Input
          placeholder="Coupon code"
          value={code}
          onValueChange={setCode}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleApply();
            }
          }}
        />
        <Button variant="outline" onClick={handleApply} disabled={isApplying || !code.trim()}>
          {isApplying ? "Applying..." : "Apply"}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
