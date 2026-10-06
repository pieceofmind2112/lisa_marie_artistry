import { describe, expect, it } from "vitest";
import { fromSheetCell, toSheetCell } from "@/lib/store/sheets-backend";
import type { ColumnDef } from "@/lib/store/schema";

const col = (kind: ColumnDef["kind"]): ColumnDef => ({ key: "x", header: "X", kind });

describe("reading cells from the sheet", () => {
  it("turns serial dates and times into ISO strings", () => {
    expect(fromSheetCell(col("date"), 46301)).toBe("2026-10-06");
    expect(fromSheetCell(col("time"), 0.5833333333)).toBe("14:00");
    expect(fromSheetCell(col("time"), 46301.375)).toBe("09:00");
  });
  it("accepts dates and times Lisa typed by hand", () => {
    expect(fromSheetCell(col("date"), "10/6/2026")).toBe("2026-10-06");
    expect(fromSheetCell(col("time"), "2:30 PM")).toBe("14:30");
    expect(fromSheetCell(col("time"), "12:15 AM")).toBe("00:15");
  });
  it("parses money and checkboxes", () => {
    expect(fromSheetCell(col("number"), "$1,250.50")).toBe(1250.5);
    expect(fromSheetCell(col("number"), "")).toBeNull();
    expect(fromSheetCell(col("bool"), true)).toBe(true);
    expect(fromSheetCell(col("bool"), "FALSE")).toBe(false);
  });
});

describe("writing cells to the sheet", () => {
  it("keeps text as text so phones and notes aren't reinterpreted", () => {
    expect(toSheetCell(col("text"), "+15551234567")).toBe("'+15551234567");
    expect(toSheetCell(col("text"), "=6N+6G")).toBe("'=6N+6G");
    expect(toSheetCell(col("text"), "")).toBe("");
  });
  it("writes dates, times and numbers as real values", () => {
    expect(toSheetCell(col("date"), "2026-10-06")).toBe("2026-10-06");
    expect(toSheetCell(col("time"), "14:00")).toBe("14:00:00");
    expect(toSheetCell(col("number"), 85)).toBe(85);
    expect(toSheetCell(col("number"), null)).toBe("");
  });
});
