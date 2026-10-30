"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { promoteToAdmin, demoteAdmin, revokeUserSessions } from "@/actions/super-admin/users.actions";

type Kind = "promote" | "demote" | "signout";

const COPY: Record<Kind, { button: string; title: (name: string) => string; body: string; success: string; destructive: boolean }> = {
  promote: {
    button: "Make admin",
    title: (name) => `Make ${name} an admin?`,
    body: "They will be able to manage products, orders, customers, coupons and settings. They can't promote anyone else.",
    success: "Promoted to admin.",
    destructive: false,
  },
  demote: {
    button: "Remove admin",
    title: (name) => `Remove admin access from ${name}?`,
    body: "They become a regular customer and are signed out on every device.",
    success: "Admin access removed.",
    destructive: true,
  },
  signout: {
    button: "Sign out everywhere",
    title: (name) => `Sign ${name} out on every device?`,
    body: "They'll need to sign in again. Use this if an account may have been compromised.",
    success: "Signed out on every device.",
    destructive: true,
  },
};

const ACTIONS = { promote: promoteToAdmin, demote: demoteAdmin, signout: revokeUserSessions } as const;

/** One confirm dialog for every super-admin account action, so none of them fire from a stray click. */
export function RoleActionButton({
  kind,
  userId,
  name,
  size = "sm",
  variant = "outline",
}: {
  kind: Kind;
  userId: string;
  name: string;
  size?: "sm" | "default";
  variant?: "outline" | "ghost";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const copy = COPY[kind];

  function confirm() {
    startTransition(async () => {
      const result = await ACTIONS[kind](userId);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success(copy.success);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <Button variant={variant} size={size} onClick={() => setOpen(true)}>
        {copy.button}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{copy.title(name)}</DialogTitle>
            <DialogDescription>{copy.body}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button variant={copy.destructive ? "destructive" : "default"} onClick={confirm} disabled={pending}>
              {pending ? "Working..." : copy.button}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
