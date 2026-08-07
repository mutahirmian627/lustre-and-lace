import { Controller, type Control } from "react-hook-form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { CheckoutInput } from "@/features/checkout/types";

export function PaymentMethodSelector({ control }: { control: Control<CheckoutInput> }) {
  return (
    <div className="space-y-4">
      <h2 className="font-heading text-xl text-foreground">Payment Method</h2>
      <Controller
        control={control}
        name="paymentMethod"
        render={({ field }) => (
          <RadioGroup value={field.value} onValueChange={field.onChange} className="space-y-3">
            <label className="flex items-center gap-3 rounded-md border border-border p-3">
              <RadioGroupItem value="cod" />
              <span>
                <span className="block font-medium text-foreground">Cash on Delivery</span>
                <span className="block text-sm text-muted-foreground">
                  Pay in cash when your order arrives.
                </span>
              </span>
            </label>
            <label className="flex items-center gap-3 rounded-md border border-border p-3">
              <RadioGroupItem value="manual_transfer" />
              <span>
                <span className="block font-medium text-foreground">
                  Bank Transfer (EasyPaisa / JazzCash)
                </span>
                <span className="block text-sm text-muted-foreground">
                  We&apos;ll show account numbers and a WhatsApp link after you place your order.
                </span>
              </span>
            </label>
          </RadioGroup>
        )}
      />
    </div>
  );
}
