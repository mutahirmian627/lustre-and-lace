"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { updateAdminNotes } from "@/actions/admin/orders.actions";

export function AdminNotesField({ orderId, initialNotes }: { orderId: string; initialNotes: string | null }) {
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    setIsSaving(true);
    const result = await updateAdminNotes(orderId, notes);
    setIsSaving(false);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success("Notes saved.");
  }

  return (
    <div className="space-y-2">
      <Textarea
        rows={3}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Courier reference, delivery notes, anything internal..."
      />
      <Button size="sm" variant="outline" onClick={handleSave} disabled={isSaving}>
        {isSaving ? "Saving..." : "Save Notes"}
      </Button>
    </div>
  );
}
