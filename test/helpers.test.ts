import { describe, expect, it } from "vitest";
import { addDays, addMinutes, formatTime, todayIso } from "@/lib/dates";
import { toE164 } from "@/lib/phone";
import { money, yearSummary } from "@/lib/summary";

describe("dates", () => {
  it("computes today in the business time zone", () => {
    const lateEvening = new Date("2026-10-07T02:30:00Z"); // 10:30 PM Oct 6 in New York
    expect(todayIso("America/New_York", lateEvening)).toBe("2026-10-06");
    expect(todayIso("UTC", lateEvening)).toBe("2026-10-07");
  });
  it("adds days and minutes", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addMinutes("14:00", 150)).toBe("16:30");
    expect(formatTime("00:05")).toBe("12:05 AM");
  });
});

describe("phones", () => {
  it("normalizes US numbers", () => {
    expect(toE164("(555) 123-4567")).toBe("+15551234567");
    expect(toE164("1 555 123 4567")).toBe("+15551234567");
    expect(toE164("12345")).toBeNull();
  });
});

describe("year summary", () => {
  it("counts only paid appointments and subtracts expenses", () => {
    const s = yearSummary(
      [
        { date: "2026-03-02", status: "Paid", price: 150, tip: 20, paymentMethod: "Venmo" },
        { date: "2026-03-09", status: "Booked", price: 90, tip: null, paymentMethod: "" },
        { date: "2026-03-10", status: "Cancelled", price: 90, tip: null, paymentMethod: "" },
        { date: "2025-03-02", status: "Paid", price: 999, tip: null, paymentMethod: "Cash" },
      ],
      [{ date: "2026-03-05", amount: 40.5, category: "Supplies (color, product)" }],
      2026,
    );
    expect(s.months[2]).toMatchObject({ count: 1, services: 150, tips: 20, gross: 170, expenses: 40.5, net: 129.5 });
    expect(s.totals.gross).toBe(170);
    expect(s.byMethod).toEqual([{ method: "Venmo", amount: 170 }]);
    expect(money(64.2)).toBe("$64.20");
    expect(money(170)).toBe("$170");
  });
});
