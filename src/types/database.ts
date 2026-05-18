/**
 * Database types — Hub Estúdio 33
 * Mantido manualmente para refletir `supabase/migrations/*`.
 * Regenerar quando o schema crescer:
 *   supabase gen types typescript --project-id <id> > src/types/database.ts
 */

export type ClientStatus = "active" | "inactive";

export type ProjectStatus = "in_progress" | "paused" | "done" | "archived";

export interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  status: ClientStatus;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  client_id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  start_date: string | null;
  expected_end_date: string | null;
  contract_value: number | null;
  created_at: string;
  updated_at: string;
}

export interface TimeSession {
  id: string;
  project_id: string;
  started_at: string;
  ended_at: string | null;
  description: string | null;
  created_at: string;
}

/* Helper types para inserts (omitem campos auto-gerados) */
export type ClientInsert = Omit<Client, "id" | "created_at" | "updated_at">;
export type ClientUpdate = Partial<ClientInsert>;

export type ProjectInsert = Omit<Project, "id" | "created_at" | "updated_at">;
export type ProjectUpdate = Partial<ProjectInsert>;

export type TimeSessionInsert = Omit<TimeSession, "id" | "created_at">;
export type TimeSessionUpdate = Partial<TimeSessionInsert>;

/* Tipos auxiliares com joins (vão crescer) */
export interface ProjectWithClient extends Project {
  client: Pick<Client, "id" | "name" | "status">;
}

export interface ActiveSession extends TimeSession {
  project: Pick<Project, "id" | "name" | "client_id">;
}
