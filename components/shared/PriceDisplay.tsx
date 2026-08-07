import { formatCurrency } from "@/utils/format-currency";
import { cn } from "@/lib/utils";

export function PriceDisplay({
  price,
  compareAtPrice,
  className,
  size = "default",
}: {
  price: number | string;
  compareAtPrice?: number | string | null;
  className?: string;
  size?: "default" | "lg";
}) {
  const hasDiscount =
    compareAtPrice != null && Number(compareAtPrice) > Number(price);

  return (
    <span className={cn("inline-flex items-baseline gap-2", className)}>
      <span
        className={cn(
          "font-medium text-primary",
          size === "lg" ? "text-2xl" : "text-base"
        )}
      >
        {formatCurrency(price)}
      </span>
      {hasDiscount && (
        <span className="text-sm text-muted-foreground line-through">
          {formatCurrency(compareAtPrice)}
        </span>
      )}
    </span>
  );
}
