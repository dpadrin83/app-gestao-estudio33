import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type HubRole = "admin" | "client";

export async function getHubRole(): Promise<{
  role: HubRole;
  clientId: string | null;
  userId: string | null;
}> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { role: "admin", clientId: null, userId: null };
  }

  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (client) {
    return { role: "client", clientId: client.id, userId: user.id };
  }

  return { role: "admin", clientId: null, userId: user.id };
}
