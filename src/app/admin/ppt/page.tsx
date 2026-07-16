import { redirect } from "next/navigation";

export default function AdminPPTRedirect() {
  redirect("/admin/courses");
}
