import "server-only";
import type { sheets_v4 } from "@googleapis/sheets";
import { config } from "./config";
import { EXPENSE_CATEGORIES, PAYMENT_METHODS, APPOINTMENT_STATUSES } from "./constants";
import { MONTHS } from "./dates";
import { sheetsApi } from "./google";
import { APPOINTMENTS, DATA_TABS, EXPENSES, columnLetter, columnOf, type TabDef } from "./store/schema";

export const SUMMARY_TAB = "Summary";

const BLACK = { red: 0.04, green: 0.04, blue: 0.05 };
const WHITE = { red: 1, green: 1, blue: 1 };
const CRIMSON = { red: 0.78, green: 0.07, blue: 0.12 };

type Req = sheets_v4.Schema$Request;

function headerRequests(sheetId: number, tab: TabDef): Req[] {
  const reqs: Req[] = [
    {
      repeatCell: {
        range: { sheetId, startRowIndex: 0, endRowIndex: 1 },
        cell: { userEnteredFormat: { backgroundColor: BLACK, textFormat: { bold: true, foregroundColor: WHITE } } },
        fields: "userEnteredFormat(backgroundColor,textFormat)",
      },
    },
  ];
  tab.columns.forEach((col, i) => {
    reqs.push({
      updateDimensionProperties: {
        range: { sheetId, dimension: "COLUMNS", startIndex: i, endIndex: i + 1 },
        properties: { pixelSize: col.width ?? 120, hiddenByUser: Boolean(col.hidden) },
        fields: "pixelSize,hiddenByUser",
      },
    });
    const pattern =
      col.kind === "date" ? { type: "DATE", pattern: "ddd m/d/yyyy" }
      : col.kind === "time" ? { type: "TIME", pattern: "h:mm am/pm" }
      : col.kind === "number" ? { type: "CURRENCY", pattern: "$#,##0.00" }
      : null;
    if (pattern) {
      reqs.push({
        repeatCell: {
          range: { sheetId, startRowIndex: 1, startColumnIndex: i, endColumnIndex: i + 1 },
          cell: { userEnteredFormat: { numberFormat: pattern } },
          fields: "userEnteredFormat.numberFormat",
        },
      });
    }
    if (col.kind === "bool") {
      reqs.push({
        setDataValidation: {
          range: { sheetId, startRowIndex: 1, startColumnIndex: i, endColumnIndex: i + 1 },
          rule: { condition: { type: "BOOLEAN" } },
        },
      });
    }
  });
  const dropdown = (key: string, values: readonly string[]) => {
    const i = tab.columns.findIndex((c) => c.key === key);
    if (i < 0) return;
    reqs.push({
      setDataValidation: {
        range: { sheetId, startRowIndex: 1, startColumnIndex: i, endColumnIndex: i + 1 },
        rule: {
          condition: { type: "ONE_OF_LIST", values: values.map((v) => ({ userEnteredValue: v })) },
          strict: false,
          showCustomUi: true,
        },
      },
    });
  };
  if (tab === APPOINTMENTS) {
    dropdown("paymentMethod", PAYMENT_METHODS);
    dropdown("status", APPOINTMENT_STATUSES);
  }
  if (tab === EXPENSES) {
    dropdown("category", EXPENSE_CATEGORIES);
    dropdown("paymentMethod", PAYMENT_METHODS);
  }
  return reqs;
}

export function summaryValues(year: number): (string | number)[][] {
  const A = (key: string) => {
    const c = columnOf(APPOINTMENTS, key);
    return `${APPOINTMENTS.name}!$${c}:$${c}`;
  };
  const E = (key: string) => {
    const c = columnOf(EXPENSES, key);
    return `${EXPENSES.name}!$${c}:$${c}`;
  };
  const inRange = (col: string, start: string, end: string) => `${col},">="&${start},${col},"<"&${end}`;
  const paid = `${A("status")},"Paid"`;
  const yearStart = "DATE($B$2,1,1)";
  const yearEnd = "DATE($B$2+1,1,1)";

  const rows: (string | number)[][] = [
    [`${config.businessName} · Year Summary`],
    ["Year", year, "← change the year to see another one"],
    [],
    ["Month", "Paid Appts", "Services", "Tips", "Gross Income", "Expenses", "Net", "", "Expenses by Category", "Amount", "", "Income by Payment Method", "Amount"],
  ];
  for (let m = 1; m <= 12; m++) {
    const r = rows.length + 1;
    const start = `DATE($B$2,${m},1)`;
    const end = `EDATE(DATE($B$2,${m},1),1)`;
    const apptRange = inRange(A("date"), start, end);
    rows.push([
      MONTHS[m - 1],
      `=COUNTIFS(${apptRange},${paid})`,
      `=SUMIFS(${A("price")},${apptRange},${paid})`,
      `=SUMIFS(${A("tip")},${apptRange},${paid})`,
      `=C${r}+D${r}`,
      `=SUMIFS(${E("amount")},${inRange(E("date"), start, end)})`,
      `=E${r}-F${r}`,
    ]);
  }
  const totalRow = rows.length + 1;
  rows.push(["Total", ...["B", "C", "D", "E", "F", "G"].map((c) => `=SUM(${c}5:${c}16)`)]);
  rows.push([]);
  rows.push(["Average ticket", `=IFERROR(E${totalRow}/B${totalRow},0)`]);
  rows.push(["Expenses as % of income", `=IFERROR(F${totalRow}/E${totalRow},0)`]);

  // Side tables start on row 5, columns I:J and L:M.
  EXPENSE_CATEGORIES.forEach((cat, i) => {
    const row = rows[4 + i] ?? (rows[4 + i] = []);
    while (row.length < 8) row.push("");
    row[8] = cat;
    row[9] = `=SUMIFS(${E("amount")},${E("category")},I${5 + i},${inRange(E("date"), yearStart, yearEnd)})`;
  });
  const catTotal = 5 + EXPENSE_CATEGORIES.length;
  const catRow = rows[catTotal - 1] ?? (rows[catTotal - 1] = []);
  while (catRow.length < 8) catRow.push("");
  catRow[8] = "Total";
  catRow[9] = `=SUM(J5:J${catTotal - 1})`;

  PAYMENT_METHODS.forEach((method, i) => {
    const row = rows[4 + i];
    while (row.length < 11) row.push("");
    const yr = inRange(A("date"), yearStart, yearEnd);
    row[11] = method;
    row[12] =
      `=SUMIFS(${A("price")},${A("paymentMethod")},L${5 + i},${paid},${yr})` +
      `+SUMIFS(${A("tip")},${A("paymentMethod")},L${5 + i},${paid},${yr})`;
  });
  const payTotal = 5 + PAYMENT_METHODS.length;
  const payRow = rows[payTotal - 1];
  while (payRow.length < 11) payRow.push("");
  payRow[11] = "Total";
  payRow[12] = `=SUM(M5:M${payTotal - 1})`;

  return rows;
}

function summaryFormatRequests(sheetId: number): Req[] {
  const money = (startCol: number, endCol: number, startRow = 4, endRow = 20): Req => ({
    repeatCell: {
      range: { sheetId, startRowIndex: startRow, endRowIndex: endRow, startColumnIndex: startCol, endColumnIndex: endCol },
      cell: { userEnteredFormat: { numberFormat: { type: "CURRENCY", pattern: "$#,##0.00" } } },
      fields: "userEnteredFormat.numberFormat",
    },
  });
  return [
    {
      repeatCell: {
        range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 1 },
        cell: { userEnteredFormat: { textFormat: { bold: true, fontSize: 16, foregroundColor: CRIMSON } } },
        fields: "userEnteredFormat.textFormat",
      },
    },
    {
      repeatCell: {
        range: { sheetId, startRowIndex: 3, endRowIndex: 4, startColumnIndex: 0, endColumnIndex: 13 },
        cell: { userEnteredFormat: { backgroundColor: BLACK, textFormat: { bold: true, foregroundColor: WHITE } } },
        fields: "userEnteredFormat(backgroundColor,textFormat)",
      },
    },
    {
      repeatCell: {
        range: { sheetId, startRowIndex: 16, endRowIndex: 17, startColumnIndex: 0, endColumnIndex: 7 },
        cell: { userEnteredFormat: { textFormat: { bold: true } } },
        fields: "userEnteredFormat.textFormat",
      },
    },
    money(2, 7, 4, 18),
    money(1, 2, 18, 19),
    {
      repeatCell: {
        range: { sheetId, startRowIndex: 19, endRowIndex: 20, startColumnIndex: 1, endColumnIndex: 2 },
        cell: { userEnteredFormat: { numberFormat: { type: "PERCENT", pattern: "0%" } } },
        fields: "userEnteredFormat.numberFormat",
      },
    },
    money(9, 10, 4, 30),
    money(12, 13, 4, 30),
    {
      updateDimensionProperties: {
        range: { sheetId, dimension: "COLUMNS", startIndex: 0, endIndex: 13 },
        properties: { pixelSize: 110 },
        fields: "pixelSize",
      },
    },
    {
      updateDimensionProperties: {
        range: { sheetId, dimension: "COLUMNS", startIndex: 8, endIndex: 9 },
        properties: { pixelSize: 200 },
        fields: "pixelSize",
      },
    },
    {
      updateDimensionProperties: {
        range: { sheetId, dimension: "COLUMNS", startIndex: 11, endIndex: 12 },
        properties: { pixelSize: 180 },
        fields: "pixelSize",
      },
    },
  ];
}

/**
 * Creates any missing tabs (Summary, Appointments, Clients, Expenses) with headers, formats,
 * dropdowns and the Summary formulas. Safe to run again: existing tabs and data are left alone,
 * except that missing header columns are added to the right.
 */
export async function setUpSheet(year: number): Promise<string[]> {
  const spreadsheetId = config.spreadsheetId;
  if (!spreadsheetId) throw new Error("GOOGLE_SHEET_ID isn't set.");
  const api = sheetsApi();
  const meta = await api.spreadsheets.get({ spreadsheetId, fields: "sheets.properties(sheetId,title,index)" });
  const existing = new Map((meta.data.sheets ?? []).map((s) => [s.properties!.title!, s.properties!.sheetId!]));
  const log: string[] = [];

  const toCreate = [SUMMARY_TAB, ...DATA_TABS.map((t) => t.name)].filter((n) => !existing.has(n));
  if (toCreate.length) {
    const res = await api.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: toCreate.map((title) => ({
          addSheet: {
            properties: {
              title,
              tabColor: title === SUMMARY_TAB ? CRIMSON : BLACK,
              gridProperties: { frozenRowCount: title === SUMMARY_TAB ? 4 : 1 },
            },
          },
        })),
      },
    });
    res.data.replies?.forEach((r) => {
      const p = r.addSheet?.properties;
      if (p?.title && p.sheetId !== undefined && p.sheetId !== null) existing.set(p.title, p.sheetId);
    });
    log.push(`Created tabs: ${toCreate.join(", ")}.`);
  }

  const formatReqs: Req[] = [];
  for (const tab of DATA_TABS) {
    const sheetId = existing.get(tab.name)!;
    const head = await api.spreadsheets.values.get({ spreadsheetId, range: `'${tab.name}'!1:1` });
    const headers = (head.data.values?.[0] ?? []).map((h) => String(h).trim().toLowerCase());
    if (headers.length === 0) {
      await api.spreadsheets.values.update({
        spreadsheetId,
        range: `'${tab.name}'!A1`,
        valueInputOption: "RAW",
        requestBody: { values: [tab.columns.map((c) => c.header)] },
      });
      formatReqs.push(...headerRequests(sheetId, tab));
    } else {
      const missing = tab.columns.filter((c) => !headers.includes(c.header.toLowerCase()));
      if (missing.length) {
        await api.spreadsheets.values.update({
          spreadsheetId,
          range: `'${tab.name}'!${columnLetter(headers.length)}1`,
          valueInputOption: "RAW",
          requestBody: { values: [missing.map((c) => c.header)] },
        });
        log.push(`Added columns to ${tab.name}: ${missing.map((c) => c.header).join(", ")}.`);
      }
    }
  }

  if (toCreate.includes(SUMMARY_TAB)) {
    await api.spreadsheets.values.update({
      spreadsheetId,
      range: `'${SUMMARY_TAB}'!A1`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: summaryValues(year) },
    });
    formatReqs.push(...summaryFormatRequests(existing.get(SUMMARY_TAB)!));
  }

  // Put Summary first so it's what opens.
  formatReqs.push({
    updateSheetProperties: { properties: { sheetId: existing.get(SUMMARY_TAB)!, index: 0 }, fields: "index" },
  });
  await api.spreadsheets.batchUpdate({ spreadsheetId, requestBody: { requests: formatReqs } });

  // Remove the blank default tab a new spreadsheet comes with, if it's still empty.
  for (const blank of ["Sheet1"]) {
    const id = existing.get(blank);
    if (id === undefined) continue;
    const v = await api.spreadsheets.values.get({ spreadsheetId, range: `'${blank}'!A1:Z50` });
    if (!v.data.values?.length) {
      await api.spreadsheets.batchUpdate({ spreadsheetId, requestBody: { requests: [{ deleteSheet: { sheetId: id } }] } });
      log.push(`Removed the empty ${blank} tab.`);
    }
  }

  if (!log.length) log.push("Everything was already set up.");
  return log;
}

