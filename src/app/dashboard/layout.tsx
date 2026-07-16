import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { isAdminRole } from "@/lib/admin/roles";
import { StudentWelcomeLayout } from "@/components/student/welcome-layout";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (isAdminRole(session.role)) redirect("/admin");

  return (
    <StudentWelcomeLayout user={session}>
      {children}
    </StudentWelcomeLayout>
  );
}
