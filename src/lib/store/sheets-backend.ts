import "server-only";
import type { sheets_v4 } from "@googleapis/sheets";
import { sheetsApi } from "../google";
import { parseLooseDate, parseLooseTime, serialToHHMM, serialToIsoDate } from "../dates";
import type { TableBackend } from "./backend";
import { columnLetter, type Cell, type ColumnDef, type Row, type TabDef } from "./schema";

type Raw = string | number | boolean | null | undefined;

export function fromSheetCell(col: ColumnDef, raw: Raw): Cell {
  const blank = raw === undefined || raw === null || raw === "";
  switch (col.kind) {
    case "number": {
      if (blank) return null;
      const n = typeof raw === "number" ? raw : Number(String(raw).replace(/[$,\s]/g, ""));
      return Number.isFinite(n) ? n : null;
    }
    case "bool":
      if (typeof raw === "boolean") return raw;
      return ["true", "yes", "y", "x", "1"].includes(String(raw ?? "").trim().toLowerCase());
    case "date":
      if (blank) return "";
      if (typeof raw === "number") return serialToIsoDate(raw);
      return parseLooseDate(String(raw)) ?? "";
    case "time":
      if (blank) return "";
      if (typeof raw === "number") return serialToHHMM(raw);
      return parseLooseTime(String(raw)) ?? "";
    default:
      return blank ? "" : String(raw);
  }
}

/** Values are written with USER_ENTERED so dates, times and money become real sheet values. */
export function toSheetCell(col: ColumnDef, value: Cell): string | number | boolean {
  if (value === null || value === undefined || value === "") return "";
  switch (col.kind) {
    case "number":
      return typeof value === "number" ? value : Number(value) || "";
    case "bool":
      return Boolean(value);
    case "date":
      return String(value); // YYYY-MM-DD is parsed as a date in every locale
    case "time":
      return `${value}:00`;
    default:
      // A leading apostrophe keeps text as text (phone numbers, notes starting with "=").
      return `'${String(value)}`;
  }
}

interface LoadedTab {
  headers: string[];
  rows: { rowNumber: number; row: Row }[];
}

export class SheetsBackend implements TableBackend {
  constructor(private readonly spreadsheetId: string) {}

  private get api(): sheets_v4.Sheets {
    return sheetsApi();
  }

  private async load(tab: TabDef): Promise<LoadedTab> {
    const res = await this.api.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: `'${tab.name}'!A1:ZZ`,
      valueRenderOption: "UNFORMATTED_VALUE",
      dateTimeRenderOption: "SERIAL_NUMBER",
    });
    const values = (res.data.values ?? []) as Raw[][];
    const headers = (values[0] ?? []).map((h) => String(h ?? "").trim());
    const index = new Map(headers.map((h, i) => [h.toLowerCase(), i]));
    const rows: LoadedTab["rows"] = [];
    values.slice(1).forEach((cells, i) => {
      const row: Row = {};
      for (const col of tab.columns) {
        const at = index.get(col.header.toLowerCase());
        row[col.key] = fromSheetCell(col, at === undefined ? undefined : cells[at]);
      }
      if (row.id) rows.push({ rowNumber: i + 2, row });
    });
    return { headers, rows };
  }

  private toValues(tab: TabDef, headers: string[], row: Row): (string | number | boolean)[] {
    const out: (string | number | boolean)[] = [];
    for (let i = 0; i < headers.length; i++) {
      const col = tab.columns.find((c) => c.header.toLowerCase() === headers[i].toLowerCase());
      out.push(col ? toSheetCell(col, row[col.key] ?? null) : "");
    }
    return out;
  }

  async readAll(tab: TabDef): Promise<Row[]> {
    return (await this.load(tab)).rows.map((r) => r.row);
  }

  async append(tab: TabDef, row: Row): Promise<void> {
    const { headers } = await this.load(tab);
    if (headers.length === 0) throw new Error(`The "${tab.name}" tab is missing. Open Settings and set up the sheet.`);
    await this.api.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId,
      range: `'${tab.name}'!A1`,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [this.toValues(tab, headers, row)] },
    });
  }

  async update(tab: TabDef, id: string, row: Row): Promise<boolean> {
    const { headers, rows } = await this.load(tab);
    const hit = rows.find((r) => r.row.id === id);
    if (!hit) return false;
    // Write only the app's own cells so any columns Lisa adds herself are left alone.
    const data: sheets_v4.Schema$ValueRange[] = [];
    headers.forEach((h, i) => {
      const col = tab.columns.find((c) => c.header.toLowerCase() === h.toLowerCase());
      if (!col) return;
      data.push({
        range: `'${tab.name}'!${columnLetter(i)}${hit.rowNumber}`,
        values: [[toSheetCell(col, row[col.key] ?? null)]],
      });
    });
    await this.api.spreadsheets.values.batchUpdate({
      spreadsheetId: this.spreadsheetId,
      requestBody: { valueInputOption: "USER_ENTERED", data },
    });
    return true;
  }

  async remove(tab: TabDef, id: string): Promise<boolean> {
    const { rows } = await this.load(tab);
    const hit = rows.find((r) => r.row.id === id);
    if (!hit) return false;
    const meta = await this.api.spreadsheets.get({
      spreadsheetId: this.spreadsheetId,
      fields: "sheets.properties(sheetId,title)",
    });
    const sheetId = meta.data.sheets?.find((s) => s.properties?.title === tab.name)?.properties?.sheetId;
    if (sheetId === undefined || sheetId === null) return false;
    await this.api.spreadsheets.batchUpdate({
      spreadsheetId: this.spreadsheetId,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: { sheetId, dimension: "ROWS", startIndex: hit.rowNumber - 1, endIndex: hit.rowNumber },
            },
          },
        ],
      },
    });
    return true;
  }
}
