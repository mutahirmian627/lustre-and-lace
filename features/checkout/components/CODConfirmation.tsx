import { CheckCircle2 } from "lucide-react";

export function CODConfirmation() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg bg-accent p-6 text-center">
      <CheckCircle2 className="size-10 text-success" />
      <h2 className="font-heading text-xl text-foreground">Your order has been placed!</h2>
      <p className="text-muted-foreground">Pay in cash when it arrives.</p>
    </div>
  );
}
