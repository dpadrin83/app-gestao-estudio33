import { portalBackgroundImageStyle } from "@/lib/portal/portal-theme";

export function PortalBackground({
  backgroundUrl,
}: {
  backgroundUrl: string | null;
}) {
  const style = portalBackgroundImageStyle(backgroundUrl);
  if (!style) return null;

  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={style}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 bg-background/88 backdrop-blur-[1px]"
      />
    </>
  );
}
