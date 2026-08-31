export function addMonths(dateOnly: string, months: number): string {
  const d = new Date(`${dateOnly}T00:00:00`);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

export function toDateOnly(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Fecha de hoy en zona horaria local, como "YYYY-MM-DD".
 *
 * OJO: nunca usar `new Date().toISOString().slice(0, 10)` para esto — eso
 * convierte el instante actual a UTC, y en zonas horarias detras de UTC
 * (como Mexico) se adelanta un dia entero durante la tarde/noche local
 * (p.ej. a partir de las 6pm en UTC-6), lo que rompe cualquier calculo de
 * "mes siguiente" hecho a partir de ese valor.
 */
export function today(): string {
  return toDateOnly(new Date());
}

/** Lunes a domingo de la semana en la que estamos hoy. */
export function currentWeekRange(): { start: string; end: string } {
  const now = new Date();
  const dow = now.getDay(); // 0=domingo..6=sabado
  const diffToMonday = dow === 0 ? 6 : dow - 1;
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday);
  const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);
  return { start: toDateOnly(monday), end: toDateOnly(sunday) };
}

const monthFormatter = new Intl.DateTimeFormat("es-MX", { month: "long", year: "numeric" });

/** "2026-08" -> "Agosto 2026" */
export function formatMonthLabel(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  const label = monthFormatter.format(new Date(y, m - 1, 1));
  return label.charAt(0).toUpperCase() + label.slice(1);
}
