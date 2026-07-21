import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { STAFF_MANAGEMENT_ROLES } from "@/lib/api/types";

/** `/dashboard` itself has no UI — it just routes each role to its home section. */
export default async function DashboardIndexPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const isStaffAdmin = STAFF_MANAGEMENT_ROLES.includes(
    session.role as (typeof STAFF_MANAGEMENT_ROLES)[number],
  );
  if (isStaffAdmin) redirect("/dashboard/staff");
  redirect("/dashboard/chalets");
}
