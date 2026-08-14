export function addMonths(dateOnly: string, months: number): string {
  const d = new Date(`${dateOnly}T00:00:00`);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

const monthFormatter = new Intl.DateTimeFormat("es-MX", { month: "long", year: "numeric" });

/** "2026-08" -> "Agosto 2026" */
export function formatMonthLabel(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  const label = monthFormatter.format(new Date(y, m - 1, 1));
  return label.charAt(0).toUpperCase() + label.slice(1);
}
