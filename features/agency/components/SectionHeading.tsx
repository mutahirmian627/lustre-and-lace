import { cn } from "@/lib/utils";

/** Eyebrow + serif heading + optional lead paragraph used at the top of each studio section. */
export function SectionHeading({
  eyebrow,
  title,
  lead,
  align = "center",
  tone = "light",
  className,
}: {
  eyebrow: string;
  title: string;
  lead?: string;
  align?: "center" | "left";
  /** "dark" for sections on the plum background. */
  tone?: "light" | "dark";
  className?: string;
}) {
  const dark = tone === "dark";
  return (
    <div className={cn("max-w-2xl space-y-3", align === "center" && "mx-auto text-center", className)}>
      <p
        className={cn(
          "text-xs font-medium uppercase tracking-[0.22em]",
          dark ? "text-gold-light" : "text-gold-dark"
        )}
      >
        {eyebrow}
      </p>
      <h2 className={cn("font-heading text-3xl leading-tight sm:text-4xl", dark ? "text-plum-foreground" : "text-foreground")}>
        {title}
      </h2>
      {lead && (
        <p className={cn("text-base leading-relaxed", dark ? "text-plum-foreground/75" : "text-muted-foreground")}>
          {lead}
        </p>
      )}
    </div>
  );
}
