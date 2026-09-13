import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { getDashboardData } from "@/lib/data/dashboard";
import { requireActiveMembership } from "@/lib/supabase/session";

export default async function DashboardPage() {
  const { organizationId, fullName } = await requireActiveMembership();
  const data = await getDashboardData(organizationId, fullName);

  return <DashboardOverview data={data} />;
}
