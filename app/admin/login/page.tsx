import { redirect } from "next/navigation";

/** Admins now use the shared login page. Kept so old links keep working. */
export default function AdminLoginRedirect() {
  redirect("/login");
}
