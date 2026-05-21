/** Cliente padrão para projetos internos até vincular um cliente real. */
export const INTERNAL_PROJECTS_CLIENT_NAME = "Projetos internos (E33)";

export function isInternalProjectsClient(
  clientName: string | null | undefined,
): boolean {
  if (!clientName) return false;
  return clientName.trim().toLowerCase() === INTERNAL_PROJECTS_CLIENT_NAME.toLowerCase();
}
