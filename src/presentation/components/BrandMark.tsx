import { useId } from "react";

/** Mismo glifo (barras ascendentes, degradado cian-magenta) que el icono de
 * la PWA (public/favicon.svg), para que el logo dentro de la app coincida
 * con el icono de instalacion. */
export function BrandMark({ className }: { className?: string }) {
  const gradId = useId();
  return (
    <svg viewBox="0 0 248 290" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="248" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#5ff2ff" />
          <stop offset="55%" stopColor="#00c8ff" />
          <stop offset="100%" stopColor="#ff33d6" />
        </linearGradient>
      </defs>
      <rect x="0" y="150" width="64" height="140" rx="16" fill={`url(#${gradId})`} />
      <rect x="92" y="80" width="64" height="210" rx="16" fill={`url(#${gradId})`} />
      <rect x="184" y="0" width="64" height="290" rx="16" fill={`url(#${gradId})`} />
    </svg>
  );
}
