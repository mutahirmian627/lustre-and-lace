import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCustomerDetail } from "@/actions/admin/customers.actions";
import { CustomerDetail } from "@/features/admin/components/CustomerDetail";

export const metadata: Metadata = { title: "Customer Detail" };

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getCustomerDetail(id);
  if (!data) notFound();

  return <CustomerDetail data={data} />;
}
