import Image from "next/image";
import { cn } from "@/lib/utils";

/** A phone drawn in CSS around a real mobile screenshot of the demo store. */
export function PhoneFrame({
  src,
  alt,
  priority = false,
  sizes = "220px",
  className,
}: {
  src: string;
  alt: string;
  priority?: boolean;
  sizes?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[2.1rem] border-[6px] border-[#1c1517] bg-[#1c1517] shadow-[0_30px_60px_-18px_rgb(0_0_0/0.6)]",
        className
      )}
    >
      <Image
        src={src}
        alt={alt}
        width={390}
        height={844}
        priority={priority}
        sizes={sizes}
        className="h-auto w-full rounded-[1.65rem]"
      />
    </div>
  );
}
