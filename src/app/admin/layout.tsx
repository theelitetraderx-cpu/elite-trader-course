import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { isPortalStaff } from "@/lib/admin/roles";
import { enrichSessionUser } from "@/lib/admin/session";
import { DashboardLayout } from "@/components/shared/dashboard-layout";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isPortalStaff(session.role)) redirect("/dashboard");

  const user = enrichSessionUser(session);

  return (
    <DashboardLayout user={user} variant="admin">
      {children}
    </DashboardLayout>
  );
}
