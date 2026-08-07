/**
 * Minimal CSV builder for the admin Orders export and Analytics export
 * (specs/13) — the actual data dumps are small, flat, and one-off enough
 * that pulling in a CSV library isn't worth it over a plain string join.
 */
export function toCsv(headers: string[], rows: (string | number)[][]): string {
  const escape = (value: string | number) => {
    const str = String(value);
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };
  const lines = [headers, ...rows].map((row) => row.map(escape).join(","));
  return lines.join("\n");
}
