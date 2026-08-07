"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ExportCsvButton<Arg extends string>({
  filename,
  arg,
  fetchCsv,
}: {
  filename: string;
  arg: Arg;
  // Must be a real server action reference (not a closure defined in the
  // Server Component) — RSC can only serialize "use server" function
  // references across the boundary, not arbitrary functions (specs/13).
  fetchCsv: (arg: Arg) => Promise<string>;
}) {
  const [isExporting, setIsExporting] = useState(false);

  async function handleExport() {
    setIsExporting(true);
    try {
      const csv = await fetchCsv(arg);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Export failed.");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <Button variant="outline" onClick={handleExport} disabled={isExporting}>
      <Download className="size-4" />
      {isExporting ? "Exporting..." : "Export CSV"}
    </Button>
  );
}
