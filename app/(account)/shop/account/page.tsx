import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getOrdersForUser } from "@/actions/orders.actions";
import { getWishlistProductIds } from "@/actions/wishlist.actions";
import { OrderCard } from "@/features/account/components/OrderCard";
import { AccountOverviewStats } from "@/features/account/components/AccountOverviewStats";
import { EmailVerificationBanner } from "@/features/account/components/EmailVerificationBanner";

export const metadata: Metadata = { title: "My Account" };

export default async function AccountOverviewPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  // Defense in depth — middleware.ts already guards /account/*, but a
  // server component should never assume that guarantee blindly.
  if (!session?.user) redirect("/shop/login?redirect=/shop/account");
  const { user } = session;

  const [{ orders, totalCount }, wishlistProductIds] = await Promise.all([
    getOrdersForUser(1),
    getWishlistProductIds(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl text-foreground">Welcome back, {user.name}</h1>
      </div>

      {!user.emailVerified && <EmailVerificationBanner email={user.email} />}

      <AccountOverviewStats orderCount={totalCount} wishlistCount={wishlistProductIds.length} />

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-heading text-lg text-foreground">Recent Orders</h2>
          {orders.length > 0 && (
            <Link href="/shop/account/orders" className="text-sm text-primary hover:underline">
              View all
            </Link>
          )}
        </div>
        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No orders yet.{" "}
            <Link href="/shop/products" className="text-primary hover:underline">
              Start shopping
            </Link>
            .
          </p>
        ) : (
          <div className="space-y-3">
            {orders.slice(0, 3).map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-4 text-sm">
        <Link href="/shop/account/addresses" className="text-primary hover:underline">
          Manage Addresses
        </Link>
        <Link href="/shop/account/settings" className="text-primary hover:underline">
          Account Settings
        </Link>
      </div>
    </div>
  );
}
