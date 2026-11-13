import type { Metadata } from "next";
import { PackageSearch } from "lucide-react";
import { getOrdersForUser } from "@/actions/orders.actions";
import { OrderCard } from "@/features/account/components/OrderCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { ProductListPagination } from "@/features/products/components/ProductListPagination";

export const metadata: Metadata = { title: "My Orders" };

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const { orders, totalPages } = await getOrdersForUser(page);

  return (
    <div>
      <h1 className="mb-6 font-heading text-2xl text-foreground">My Orders</h1>

      {orders.length === 0 ? (
        <EmptyState
          icon={PackageSearch}
          title="No orders yet"
          description="Once you place an order, it'll show up here."
          actionLabel="Start Shopping"
          actionHref="/shop/products"
        />
      ) : (
        <>
          <div className="space-y-3">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
          <div className="mt-6">
            <ProductListPagination
              basePath="/shop/account/orders"
              currentParams={{}}
              page={page}
              totalPages={totalPages}
            />
          </div>
        </>
      )}
    </div>
  );
}
