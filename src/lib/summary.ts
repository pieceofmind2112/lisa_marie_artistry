import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from "./constants";
import { MONTHS } from "./dates";

interface ApptLike {
  date: string;
  status: string;
  price: number | null;
  tip: number | null;
  paymentMethod: string;
}
interface ExpenseLike {
  date: string;
  amount: number | null;
  category: string;
}

export interface MonthRow {
  month: string;
  count: number;
  services: number;
  tips: number;
  gross: number;
  expenses: number;
  net: number;
}

/** Same math as the Summary tab in the sheet: only Paid appointments count as income. */
export function yearSummary(appointments: ApptLike[], expenses: ExpenseLike[], year: number) {
  const prefix = `${year}-`;
  const paid = appointments.filter((a) => a.status === "Paid" && a.date.startsWith(prefix));
  const spent = expenses.filter((e) => e.date.startsWith(prefix));

  const months: MonthRow[] = MONTHS.map((month, i) => {
    const mm = `${prefix}${String(i + 1).padStart(2, "0")}`;
    const inMonth = paid.filter((a) => a.date.startsWith(mm));
    const services = sum(inMonth.map((a) => a.price));
    const tips = sum(inMonth.map((a) => a.tip));
    const exp = sum(spent.filter((e) => e.date.startsWith(mm)).map((e) => e.amount));
    return { month, count: inMonth.length, services, tips, gross: services + tips, expenses: exp, net: services + tips - exp };
  });

  const totals = months.reduce(
    (t, m) => ({
      count: t.count + m.count,
      services: t.services + m.services,
      tips: t.tips + m.tips,
      gross: t.gross + m.gross,
      expenses: t.expenses + m.expenses,
      net: t.net + m.net,
    }),
    { count: 0, services: 0, tips: 0, gross: 0, expenses: 0, net: 0 },
  );

  const categories = [...new Set<string>([...EXPENSE_CATEGORIES, ...spent.map((e) => e.category || "Other")])];
  const byCategory = categories
    .map((category) => ({
      category,
      amount: sum(spent.filter((e) => (e.category || "Other") === category).map((e) => e.amount)),
    }))
    .filter((c) => c.amount !== 0);

  const methods = [...new Set<string>([...PAYMENT_METHODS, ...paid.map((a) => a.paymentMethod)])];
  const byMethod = methods
    .map((method) => ({
      method,
      amount: sum(paid.filter((a) => a.paymentMethod === method).map((a) => (a.price ?? 0) + (a.tip ?? 0))),
    }))
    .filter((m) => m.amount !== 0);

  return {
    year,
    months,
    totals,
    averageTicket: totals.count ? totals.gross / totals.count : 0,
    byCategory,
    byMethod,
  };
}

function sum(values: (number | null)[]): number {
  return values.reduce<number>((t, v) => t + (v ?? 0), 0);
}

export function money(n: number | null | undefined, opts: { cents?: boolean } = {}): string {
  if (n === null || n === undefined) return "—";
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: opts.cents || !Number.isInteger(n) ? 2 : 0,
    maximumFractionDigits: opts.cents || !Number.isInteger(n) ? 2 : 0,
  });
}
