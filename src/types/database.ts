/**
 * Database types — Hub Estúdio 33
 * Mantido manualmente para refletir `supabase/migrations/*`.
 * Regenerar quando o schema crescer:
 *   supabase gen types typescript --project-id <id> > src/types/database.ts
 */

export type ExecutionChecklistItem = {
  id: string;
  label: string;
  done: boolean;
};

export type ClientStatus =
  | "prospect"
  | "active"
  | "paused"
  | "closed"
  | "inactive";

export type ClientCompanySize = "micro" | "small" | "medium" | "large" | "other";

export type ProjectStatus = "in_progress" | "paused" | "done" | "archived";

export type ServiceLine =
  | "branding"
  | "identity"
  | "content"
  | "web_design"
  | "web_dev"
  | "hybrid";

export interface Client {
  id: string;
  name: string;
  legal_name: string | null;
  cnpj: string | null;
  segment: string | null;
  company_size: ClientCompanySize | null;
  website: string | null;
  contact_name: string | null;
  contact_role: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  notes: string | null;
  logo_url: string | null;
  portal_background_url: string | null;
  status: ClientStatus;
  auth_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  client_id: string;
  name: string;
  description: string | null;
  briefing_notes: string | null;
  status: ProjectStatus;
  start_date: string | null;
  expected_end_date: string | null;
  contract_value: number | null;
  payment_status: PaymentStatus;
  invoiced_at: string | null;
  received_at: string | null;
  service_line: ServiceLine | null;
  created_at: string;
  updated_at: string;
}

export type ProjectLinkKind =
  | "drive"
  | "figma"
  | "github"
  | "doc"
  | "link"
  | "other"
  | "supabase"
  | "vercel"
  | "cursor"
  | "hosting"
  | "credential";

export interface ProjectLink {
  id: string;
  project_id: string;
  name: string;
  url: string | null;
  username: string | null;
  secret_note: string | null;
  kind: ProjectLinkKind;
  created_at: string;
}

export type ClientServiceKind =
  | "domain_br"
  | "domain"
  | "hosting"
  | "email"
  | "ssl"
  | "cdn"
  | "other";

export type ClientServiceBillingCycle = "monthly" | "yearly" | "other";

export interface ClientService {
  id: string;
  client_id: string;
  kind: ClientServiceKind;
  name: string;
  provider: string | null;
  next_due_date: string;
  billing_cycle: ClientServiceBillingCycle;
  amount: number | null;
  currency: string;
  panel_url: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type ClientServiceWithClient = ClientService & {
  client: Pick<Client, "id" | "name">;
};

export type ClientAccessKind =
  | "instagram"
  | "registro_br"
  | "domain_br"
  | "domain"
  | "hosting"
  | "email"
  | "ssl"
  | "cdn"
  | "other";

export type ClientAccessBillingCycle = "monthly" | "yearly" | "other";

export interface ClientAccess {
  id: string;
  client_id: string;
  kind: ClientAccessKind;
  label: string;
  login_url: string | null;
  username: string;
  next_due_date: string | null;
  password: string;
  provider: string | null;
  amount: number | null;
  billing_cycle: ClientAccessBillingCycle | null;
  currency: string;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type ClientAccessWithClient = ClientAccess & {
  client: Pick<Client, "id" | "name">;
};

export type PaymentStatus = "to_invoice" | "invoiced" | "received";

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

/* ─── Fase 2: cronograma ─── */

export type ActivityPhase =
  | "planning"
  | "production"
  | "review"
  | "delivery"
  | "other";

export type ActivityKind = "activity" | "milestone";

export type ActivityStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "delayed";

export interface Activity {
  id: string;
  project_id: string;
  phase: ActivityPhase;
  kind: ActivityKind;
  name: string;
  description: string | null;
  estimated_duration_days: number;
  planned_start_date: string;
  planned_end_date: string;
  actual_start_date: string | null;
  actual_end_date: string | null;
  status: ActivityStatus;
  visible_to_client: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ActivityDependency {
  id: string;
  activity_id: string;
  predecessor_id: string;
  dependency_type: "FS";
  lag_days: number;
  created_at: string;
}

export interface ScheduleTemplate {
  id: string;
  name: string;
  description: string | null;
  service_line: ServiceLine | null;
  created_at: string;
}

export interface ScheduleTemplateDeliverable {
  id: string;
  template_id: string;
  name: string;
  type: DeliverableType;
  activity_sort_order: number;
  sort_order: number;
  created_at: string;
}

export interface ScheduleTemplateItem {
  id: string;
  template_id: string;
  name: string;
  phase: ActivityPhase;
  kind: ActivityKind;
  estimated_duration_days: number;
  sort_order: number;
  predecessor_sort_order: number | null;
  lag_days: number;
}

export type ActivityInsert = Omit<
  Activity,
  "id" | "created_at" | "updated_at"
>;
export type ActivityUpdate = Partial<ActivityInsert>;

export interface ActivityWithProject extends Activity {
  project: Pick<Project, "id" | "name" | "status"> & {
    client: Pick<Client, "id" | "name">;
  };
}

export interface ActivityWithDeps extends Activity {
  dependencies: Array<
    ActivityDependency & { predecessor: Pick<Activity, "id" | "name"> }
  >;
}

/* ─── Fase 3: entregáveis, financeiro ─── */

export type DeliverableType = "video" | "design" | "doc" | "code" | "link";

export type DeliverableStatus =
  | "draft"
  | "internal_review"
  | "sent_to_client"
  | "approved"
  | "rejected";

export interface Deliverable {
  id: string;
  project_id: string;
  activity_id: string | null;
  name: string;
  type: DeliverableType;
  status: DeliverableStatus;
  created_at: string;
  updated_at: string;
}

export interface DeliverableVersion {
  id: string;
  deliverable_id: string;
  version_number: number;
  external_link: string | null;
  notes: string | null;
  created_at: string;
}

export interface DeliverableComment {
  id: string;
  deliverable_id: string;
  author_role: "admin" | "client";
  body: string;
  created_at: string;
}

export interface ProjectCost {
  id: string;
  project_id: string;
  description: string;
  amount: number;
  incurred_at: string;
  created_at: string;
}

export type FinanceDocumentKind = "contract" | "invoice" | "receipt" | "other";

export interface ProjectFinanceDocument {
  id: string;
  project_id: string;
  kind: FinanceDocumentKind;
  title: string;
  storage_path: string;
  file_name: string;
  mime_type: string | null;
  file_size: number | null;
  created_at: string;
}

export interface DeliverableWithVersions extends Deliverable {
  versions: DeliverableVersion[];
  comments: DeliverableComment[];
}

export interface DeliverableCatalogGroup {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type DeliverableCatalogGroupWithItems = DeliverableCatalogGroup & {
  items: DeliverableCatalogItem[];
};

export interface DeliverableCatalogItem {
  id: string;
  group_id: string | null;
  name: string;
  deliverable_type: DeliverableType;
  estimated_days: number;
  professional_id: string | null;
  predecessor_id: string | null;
  service_line: ServiceLine | null;
  notes: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  professional?: { id: string; name: string } | null;
  predecessor?: Pick<DeliverableCatalogItem, "id" | "name"> | null;
}

export interface DeliverablePlanItem {
  id: string;
  project_id: string;
  name: string;
  deliverable_type: DeliverableType;
  estimated_days: number;
  professional_id: string | null;
  predecessor_id: string | null;
  deliverable_id: string | null;
  activity_id: string | null;
  notes: string | null;
  execution_checklist: ExecutionChecklistItem[];
  sort_order: number;
  created_at: string;
  updated_at: string;
  professional?: { id: string; name: string } | null;
  predecessor?: Pick<DeliverablePlanItem, "id" | "name"> | null;
  deliverable?: Pick<Deliverable, "id" | "name" | "status"> | null;
}

/* ─── Plano por área macro (profissionais E33) ─── */

export interface StudioProfessional {
  id: string;
  slug: string;
  name: string;
  service_line: ServiceLine | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface ProjectMacroArea {
  id: string;
  project_id: string;
  name: string;
  professional_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type ProjectWorkItemType = "sub_etapa" | "entregavel";

export interface ProjectWorkItem {
  id: string;
  project_id: string;
  macro_area_id: string | null;
  item_type: ProjectWorkItemType;
  name: string;
  professional_id: string;
  estimated_days: number;
  deliverable_id: string | null;
  prompt_notes: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectWorkItemWithRelations extends ProjectWorkItem {
  professional: Pick<StudioProfessional, "id" | "name" | "slug">;
  deliverable: Pick<Deliverable, "id" | "name" | "status"> | null;
}

export interface ProjectMacroAreaWithItems extends ProjectMacroArea {
  professional: Pick<StudioProfessional, "id" | "name"> | null;
  items: ProjectWorkItemWithRelations[];
}

export interface ProjectMacroPlan {
  areas: ProjectMacroAreaWithItems[];
  orphanItems: ProjectWorkItemWithRelations[];
  totalDays: number;
}

/* ─── Banco de prompts ─── */

export interface PromptTemplate {
  id: string;
  professional_id: string | null;
  title: string;
  deliverable_hint: string | null;
  body: string;
  variables: string[];
  version: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PromptTemplateWithProfessional extends PromptTemplate {
  professional: Pick<StudioProfessional, "id" | "name" | "slug" | "service_line"> | null;
}

/* ─── Fase 4: IA ─── */

export type AiGenerationKind =
  | "weekly_summary"
  | "schedule_suggestion"
  | "smart_insights"
  | "briefing_import";

export interface AiGeneration {
  id: string;
  project_id: string | null;
  kind: AiGenerationKind;
  content: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

/* ─── Fase 5: tarefas Kanban ─── */

export type TaskStatus = "todo" | "doing" | "done";

export interface Task {
  id: string;
  project_id: string;
  activity_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface TaskWithActivity extends Task {
  activity: Pick<Activity, "id" | "name"> | null;
}
