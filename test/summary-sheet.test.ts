import { describe, expect, it } from "vitest";
import { summaryValues } from "@/lib/sheet-setup";

describe("Summary tab formulas", () => {
  const rows = summaryValues(2026);
  it("puts the year in B2 and January on row 5", () => {
    expect(rows[1][1]).toBe(2026);
    expect(rows[4][0]).toBe("January");
    expect(rows[15][0]).toBe("December");
    expect(rows[16][0]).toBe("Total");
  });
  it("counts paid appointments by date and status columns", () => {
    expect(rows[4][1]).toBe(
      '=COUNTIFS(Appointments!$B:$B,">="&DATE($B$2,1,1),Appointments!$B:$B,"<"&EDATE(DATE($B$2,1,1),1),Appointments!$K:$K,"Paid")',
    );
    expect(rows[4][2]).toContain("SUMIFS(Appointments!$H:$H,");
    expect(rows[4][5]).toBe('=SUMIFS(Expenses!$E:$E,Expenses!$B:$B,">="&DATE($B$2,1,1),Expenses!$B:$B,"<"&EDATE(DATE($B$2,1,1),1))');
  });
  it("lays out the side tables without colliding with the month table", () => {
    expect(rows[4][8]).toBe("Supplies (color, product)");
    expect(rows[4][9]).toMatch(/^=SUMIFS\(Expenses!\$E:\$E,Expenses!\$D:\$D,I5,/);
    expect(rows[4][11]).toBe("Cash");
    expect(rows[4][12]).toMatch(/Appointments!\$J:\$J,L5,/);
    expect(rows[18][0]).toBe("Average ticket");
    expect(rows[18][8]).toBe("Total");
  });
});
