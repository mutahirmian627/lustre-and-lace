import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getWishlistProductIds } from "@/actions/wishlist.actions";
import { WishlistProvider } from "@/features/wishlist/context/WishlistProvider";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  const isLoggedIn = !!session?.user;
  const wishlistProductIds = isLoggedIn ? await getWishlistProductIds() : [];

  return (
    <WishlistProvider initialProductIds={wishlistProductIds} isLoggedIn={isLoggedIn}>
      <Header isLoggedIn={isLoggedIn} />
      <main>{children}</main>
      <Footer />
    </WishlistProvider>
  );
}
