import Image from "next/image";
import { cn } from "@/lib/utils";

/** A browser window drawn in CSS around a real screenshot of the demo project. */
export function BrowserFrame({
  src,
  alt,
  url,
  priority = false,
  className,
}: {
  src: string;
  alt: string;
  url: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-white/10 bg-background shadow-[0_30px_60px_-20px_rgb(0_0_0/0.45)]",
        className
      )}
    >
      <div className="flex items-center gap-3 border-b border-border bg-muted px-3 py-2">
        <div className="flex gap-1.5" aria-hidden="true">
          <span className="size-2.5 rounded-full bg-[#ff5f57]" />
          <span className="size-2.5 rounded-full bg-[#febc2e]" />
          <span className="size-2.5 rounded-full bg-[#28c840]" />
        </div>
        <div className="mx-auto flex-1 truncate rounded-md bg-background px-3 py-1 text-center text-[0.7rem] text-muted-foreground">
          {url}
        </div>
        <span className="w-10" aria-hidden="true" />
      </div>
      <Image src={src} alt={alt} width={1440} height={900} priority={priority} className="h-auto w-full" sizes="(min-width: 1024px) 640px, 90vw" />
    </div>
  );
}
