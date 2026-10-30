import { cn } from "@/lib/utils";

/** `own` is the person looking at the screen: right-aligned and in the brand color. */
export function ChatBubble({
  own,
  children,
  time,
}: {
  own: boolean;
  children: React.ReactNode;
  time?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-0.5", own ? "items-end" : "items-start")}>
      <div
        className={cn(
          "max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm",
          own
            ? "rounded-br-sm bg-primary text-primary-foreground"
            : "rounded-bl-sm bg-muted text-foreground"
        )}
      >
        {children}
      </div>
      {time && <span className="px-1 text-[11px] text-muted-foreground">{time}</span>}
    </div>
  );
}
