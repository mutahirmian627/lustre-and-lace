import Link from "next/link";
import { formatCurrency } from "@/utils/format-currency";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function EasyPaisaJazzCashInstructions({
  orderReference,
  totalAmount,
  easypaisaNumber,
  jazzcashNumber,
  whatsappLink,
}: {
  orderReference: string;
  totalAmount: string;
  easypaisaNumber: string;
  jazzcashNumber: string;
  whatsappLink: string;
}) {
  return (
    <div className="space-y-4 rounded-lg bg-accent p-6">
      <h2 className="font-heading text-xl text-foreground">Complete Your Payment</h2>
      <p className="text-muted-foreground">
        Send the exact amount below via EasyPaisa or JazzCash, quoting your order reference{" "}
        <strong className="text-foreground">{orderReference}</strong>.
      </p>
      <p className="text-center font-heading text-4xl text-primary">
        {formatCurrency(totalAmount)}
      </p>
      <div className="space-y-1 text-center text-sm">
        <p className="text-foreground">
          <strong>EasyPaisa:</strong> {easypaisaNumber}
        </p>
        <p className="text-foreground">
          <strong>JazzCash:</strong> {jazzcashNumber}
        </p>
      </div>
      <Link
        href={whatsappLink}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(buttonVariants(), "w-full")}
      >
        Send Payment Screenshot on WhatsApp
      </Link>
      <p className="text-center text-xs text-muted-foreground">
        Your order will be processed once payment is verified.
      </p>
    </div>
  );
}
