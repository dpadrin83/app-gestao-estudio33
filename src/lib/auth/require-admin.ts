import "server-only";
import { getHubRole } from "@/lib/auth/roles";

export async function requireHubAdmin(): Promise<
  { ok: true; userId: string } | { ok: false; error: string }
> {
  const { role, userId } = await getHubRole();
  if (role !== "admin" || !userId) {
    return { ok: false, error: "Acesso restrito ao administrador." };
  }
  return { ok: true, userId };
}
