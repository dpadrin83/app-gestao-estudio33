/**
 * Gera os ícones do PWA "Hub Estúdio 33" a partir da marca oficial.
 * Usa a sigla "33" com o gradiente brand sobre o fundo dark da marca (#0A0B10).
 *
 * Saídas:
 *   public/icon-192.png        (manifest — Android/Chrome)
 *   public/icon-512.png        (manifest — Chrome install / Mac)
 *   src/app/apple-icon.png     (apple-touch-icon — iPhone/iPad)
 *
 * Rodar: node scripts/generate-pwa-icons.mjs
 */
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// Marca "33" extraída de src/components/logo-e33.tsx (paths com gradiente).
// bbox da marca no espaço original: x 274.4–382.9 · y 19.6–125.8 (centro 328.65 / 72.72).
const MARK = `
  <path d="M317.22 81.9163V63.5265C317.22 63.1699 317.511 62.8861 317.875 62.8784C329.401 62.5371 338.668 53.2597 338.668 41.9076V20.9214C338.668 20.1965 338.068 19.6097 337.327 19.6097H317.22C316.48 19.6097 315.88 20.1965 315.88 20.9214V60.9224C315.88 61.283 315.582 61.5783 315.209 61.5783H295.769C295.028 61.5783 294.428 62.165 294.428 62.8899V82.5606C294.428 83.2855 295.028 83.8722 295.769 83.8722H315.209C315.578 83.8722 315.88 84.1637 315.88 84.5281V124.525C315.88 125.25 316.48 125.837 317.22 125.837H337.327C338.068 125.837 338.668 125.25 338.668 124.525V103.543C338.668 92.1869 329.401 82.9096 317.875 82.5721C317.511 82.5606 317.22 82.2768 317.22 81.924V81.9163Z" fill="url(#g)" />
  <path d="M275.227 40.8759C275.392 40.9449 275.568 40.9756 275.741 40.9756C276.09 40.9756 276.431 40.8414 276.685 40.5921L295.848 21.8457C296.232 21.4698 296.345 20.9099 296.138 20.419C295.93 19.9281 295.444 19.6097 294.899 19.6097H275.737C274.996 19.6097 274.396 20.1965 274.396 20.9214V39.6678C274.396 40.2009 274.721 40.6765 275.223 40.8797L275.227 40.8759Z" fill="url(#g)" />
  <path d="M286.604 103.566C279.684 103.094 273.945 108.709 274.427 115.478C274.808 120.832 279.167 125.239 284.624 125.772C291.821 126.477 297.847 120.583 297.125 113.541C296.581 108.203 292.072 103.938 286.604 103.566Z" fill="url(#g)" />
  <path d="M382.904 41.9037V20.9214C382.904 20.1965 382.304 19.6097 381.563 19.6097H361.452C360.711 19.6097 360.112 20.1965 360.112 20.9214V60.9224C360.112 61.283 359.814 61.5783 359.441 61.5783H340.001C339.26 61.5783 338.66 62.165 338.66 62.8899V82.5606C338.66 83.2855 339.26 83.8722 340.001 83.8722H359.441C359.81 83.8722 360.112 84.1637 360.112 84.5281V124.525C360.112 125.25 360.711 125.837 361.452 125.837H381.563C382.304 125.837 382.904 125.25 382.904 124.525V103.543C382.904 92.1869 373.636 82.9096 362.111 82.5721C361.746 82.5606 361.456 82.2768 361.456 81.924V63.5342C361.456 63.1775 361.746 62.8937 362.111 62.8861C373.636 62.5447 382.904 53.2674 382.904 41.9152V41.9037Z" fill="url(#g)" />
`;

// SVG quadrado: fundo dark + marca centralizada com ~18% de respiro (zona segura p/ maskable).
const svg = (px) => `<svg width="${px}" height="${px}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#0A0B10" />
  <g transform="translate(256 256) scale(2.95) translate(-328.65 -72.72)">${MARK}</g>
  <defs>
    <linearGradient id="g" x1="382.9" y1="125.84" x2="280" y2="23.62" gradientUnits="userSpaceOnUse">
      <stop stop-color="#2D79E6" />
      <stop offset="0.13" stop-color="#5C28DB" />
      <stop offset="0.32" stop-color="#C52AAF" />
      <stop offset="0.51" stop-color="#FF0054" />
      <stop offset="0.71" stop-color="#FF5400" />
      <stop offset="0.87" stop-color="#FFBD00" />
    </linearGradient>
  </defs>
</svg>`;

const targets = [
  { out: "public/icon-512.png", size: 512 },
  { out: "public/icon-192.png", size: 192 },
  { out: "src/app/apple-icon.png", size: 180 },
];

for (const { out, size } of targets) {
  const path = resolve(root, out);
  await mkdir(dirname(path), { recursive: true });
  await sharp(Buffer.from(svg(size))).resize(size, size).png().toFile(path);
  console.log(`✓ ${out} (${size}×${size})`);
}
