import { redirect } from "next/navigation";
import { getEffectiveRole } from "@/lib/auth/guard";
import { roleHomePath } from "@/lib/auth/permissions";

export default async function Home() {
  const role = await getEffectiveRole();
  redirect(roleHomePath(role));
}
