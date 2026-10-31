import Image from "next/image";
import { Heart, MessageCircle, Package, ShoppingBag, Sparkles } from "lucide-react";

export const AUTH_BENEFITS = [
  { icon: Package, text: "Track every order in one place" },
  { icon: Heart, text: "Save the pieces you love to your wishlist" },
  { icon: ShoppingBag, text: "Check out faster with saved addresses" },
  { icon: MessageCircle, text: "Chat with our team about your orders" },
] as const;

/**
 * The picture side of the sign-in / sign-up pages. Uses a few real product
 * photos; with fewer than two it falls back to the brand's ring-and-sparkle
 * backdrop so the panel never looks broken.
 */
export function AuthShowcase({ images }: { images: { url: string }[] }) {
  // Products can share a photo (the demo catalogue does); one tile per distinct picture keeps the
  // keys unique and avoids showing the same image twice side by side.
  const photos = [...new Map(images.map((image) => [image.url, image])).values()];
  const hasPhotos = photos.length >= 2;

  return (
    <aside className="relative isolate hidden overflow-hidden bg-plum text-plum-foreground lg:flex">
      {hasPhotos ? (
        <div aria-hidden="true" className="absolute inset-0 -z-10 grid grid-cols-2 grid-rows-2 gap-3 p-3">
          {photos.slice(0, 4).map((image, index) => (
            <div key={image.url} className="relative overflow-hidden rounded-xl">
              <Image
                src={image.url}
                alt=""
                fill
                priority={index < 2}
                sizes="(min-width: 1024px) 25vw, 0px"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      ) : (
        <div aria-hidden="true" className="absolute inset-0 -z-10">
          <div className="absolute -left-24 top-1/4 size-96 rounded-full border border-gold/40" />
          <div className="absolute -right-16 top-1/3 size-96 rounded-full border border-gold/30" />
          <Sparkles className="absolute left-[18%] top-[16%] size-6 text-gold/70" />
          <Sparkles className="absolute right-[20%] top-[34%] size-5 text-gold/60" />
        </div>
      )}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-plum via-plum/80 to-plum/10" />

      <div className="mt-auto flex w-full flex-col gap-6 p-10 xl:p-14">
        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-champagne">Welcome</p>
          <h2 className="font-heading text-4xl leading-tight xl:text-5xl">
            Make every sparkle <em className="font-normal italic text-secondary">yours</em>
          </h2>
          <p className="max-w-md font-light text-plum-foreground/80">
            Create an account or sign in to keep track of your orders, save your favourites and check out in a few
            taps.
          </p>
        </div>

        <ul className="grid gap-3 xl:grid-cols-2">
          {AUTH_BENEFITS.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3 text-sm">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-plum-foreground/15">
                <Icon className="size-4" aria-hidden="true" />
              </span>
              {text}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
