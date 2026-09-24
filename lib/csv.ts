/**
 * RFC 4180 CSV helpers with spreadsheet formula-injection protection:
 * cells that begin with = + - @ (or tab / CR) are prefixed with a single quote
 * so Excel / Google Sheets treat them as text.
 */
export function csvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  let text = String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  if (/[",\r\n]/.test(text)) text = `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function csvRow(values: Array<string | number | null | undefined>): string {
  return values.map(csvCell).join(",");
}

export function toCsv(header: string[], rows: Array<Array<string | number | null | undefined>>): string {
  // BOM so Excel opens UTF-8 (₹, non-Latin names) correctly.
  return "﻿" + [csvRow(header), ...rows.map(csvRow)].join("\r\n") + "\r\n";
}
