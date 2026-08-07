"use client";

import { useEffect, useMemo, useState } from "react";
import type { ProductVariant } from "@/features/products/types";

/**
 * Resolves attribute picks to a specific variant row, disables combinations
 * that don't exist, and mirrors the resolved variant to `?variant=` via
 * history.replaceState — deliberately bypassing the Next.js router so
 * switching variants never triggers a server round-trip (specs/06: "no
 * page reload").
 */
export function useVariantSelection(
  variants: ProductVariant[],
  initialVariantId?: string
) {
  const attributeKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const variant of variants) {
      for (const key of Object.keys(variant.attributes)) keys.add(key);
    }
    return [...keys];
  }, [variants]);

  const initialVariant =
    variants.find((v) => v.id === initialVariantId) ??
    variants.find((v) => v.isDefault) ??
    variants[0];

  const [selected, setSelected] = useState<Record<string, string>>(
    initialVariant?.attributes ?? {}
  );

  const selectedVariant = useMemo(
    () =>
      variants.find((variant) =>
        attributeKeys.every((key) => variant.attributes[key] === selected[key])
      ),
    [variants, selected, attributeKeys]
  );

  useEffect(() => {
    if (!selectedVariant) return;
    const url = new URL(window.location.href);
    url.searchParams.set("variant", selectedVariant.id);
    window.history.replaceState(null, "", url.toString());
  }, [selectedVariant]);

  function isValueAvailable(key: string, value: string) {
    const otherKeys = attributeKeys.filter((k) => k !== key);
    return variants.some(
      (variant) =>
        variant.attributes[key] === value &&
        otherKeys.every((k) => variant.attributes[k] === selected[k])
    );
  }

  function selectAttribute(key: string, value: string) {
    setSelected((prev) => ({ ...prev, [key]: value }));
  }

  return {
    attributeKeys,
    selected,
    selectedVariant,
    isValueAvailable,
    selectAttribute,
  };
}
