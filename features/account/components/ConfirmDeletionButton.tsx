"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { confirmAccountDeletion } from "@/actions/account.actions";
import { signOut } from "@/lib/auth-client";

export function ConfirmDeletionButton({ token }: { token: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleConfirm() {
    setIsDeleting(true);
    const result = await confirmAccountDeletion(token);
    setIsDeleting(false);

    if ("error" in result) {
      toast.error(result.error);
      return;
    }

    setDone(true);
    // The user row (and its session, via cascade) is already gone server-side —
    // this just clears client-side session state before leaving the account area.
    await signOut();
    router.push("/shop");
  }

  if (done) {
    return <p className="text-sm text-muted-foreground">Your account has been deleted.</p>;
  }

  return (
    <Button variant="destructive" onClick={handleConfirm} disabled={isDeleting}>
      {isDeleting ? "Deleting..." : "Yes, delete my account"}
    </Button>
  );
}
