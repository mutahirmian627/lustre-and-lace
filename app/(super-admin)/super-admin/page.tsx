import type { Metadata } from "next";
import Link from "next/link";
import { Users, ShieldCheck, MailCheck, UserPlus } from "lucide-react";
import { getSuperAdminOverview } from "@/actions/super-admin/users.actions";
import { StatsCard } from "@/features/admin/components/StatsCard";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Super Admin" };

export default async function SuperAdminOverviewPage() {
  const o = await getSuperAdminOverview();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-heading text-2xl text-foreground">Overview</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Only you can promote or remove admins. Every change is recorded in{" "}
          <Link href="/super-admin/activity" className="text-primary underline underline-offset-4">
            Activity
          </Link>
          .
        </p>
      </div>

      <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          label="Customers"
          value={o.customers}
          subtext={`${o.newCustomers30d} joined in 30 days`}
          icon={Users}
          href="/super-admin/customers"
        />
        <StatsCard label="Admins" value={o.admins} subtext="Store staff" icon={ShieldCheck} href="/super-admin/admin" />
        <StatsCard
          label="Verified emails"
          value={o.verifiedCustomers}
          subtext={`${o.unverifiedCustomers} not yet verified`}
          icon={MailCheck}
          tone={o.unverifiedCustomers > 0 ? "warning" : "default"}
        />
        <StatsCard label="New this week" value={o.newCustomers7d} subtext="customer sign-ups" icon={UserPlus} />
      </div>

      <div>
        <h3 className="mb-3 font-heading text-lg text-foreground">Latest sign-ups</h3>
        {o.recentSignups.length === 0 ? (
          <p className="text-sm text-muted-foreground">No customers yet.</p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {o.recentSignups.map((person) => (
              <li key={person.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{person.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{person.email}</p>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {person.emailVerified ? (
                    <Badge variant="outline" className="border-success text-success">
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Unverified</Badge>
                  )}
                  {new Date(person.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short" })}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
