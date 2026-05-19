/** URL base do app (Vercel ou local). Usada em links de e-mail e convites. */
export function getAppUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.VERCEL_URL?.trim();
  if (!url) return "http://127.0.0.1:3333";
  if (url.startsWith("http")) return url.replace(/\/$/, "");
  return `https://${url.replace(/\/$/, "")}`;
}
