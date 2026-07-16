import { redirect } from "next/navigation";

export default function AdminNotesRedirect() {
  redirect("/admin/courses");
}
