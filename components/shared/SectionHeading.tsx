import { cn } from "@/lib/utils";

export function SectionHeading({
  title,
  subtitle,
  className,
  align = "left",
}: {
  title: string;
  subtitle?: string;
  className?: string;
  align?: "left" | "center";
}) {
  return (
    <div
      className={cn(
        "space-y-2",
        align === "center" && "text-center",
        className
      )}
    >
      <h2 className="font-heading text-3xl text-foreground">{title}</h2>
      <span
        className={cn(
          "block h-0.5 w-12 bg-primary",
          align === "center" && "mx-auto"
        )}
      />
      {subtitle && (
        <p className="text-muted-foreground">{subtitle}</p>
      )}
    </div>
  );
}
