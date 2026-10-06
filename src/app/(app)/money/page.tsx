import Link from "next/link";
import { removeExpense } from "@/app/actions";
import { ExpenseForm } from "@/components/expense-form";
import { ChevronLeft, ChevronRight } from "@/components/icons";
import { SetupNeeded, errorMessage } from "@/components/setup-needed";
import { requireUser } from "@/lib/auth";
import { config, isDemoMode } from "@/lib/config";
import { listAppointments, listExpenses, type Expense } from "@/lib/data";
import { formatDate, todayIso } from "@/lib/dates";
import { money, yearSummary } from "@/lib/summary";
import { getTimeZone } from "@/lib/timezone";

function Stat({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="card">
      <div className="label">{label}</div>
      <div className={`text-2xl font-semibold ${accent ? "glow-text text-ember" : "text-white"}`}>{value}</div>
    </div>
  );
}

export default async function MoneyPage({ searchParams }: PageProps<"/money">) {
  await requireUser();
  const sp = await searchParams;
  const today = todayIso(await getTimeZone());
  const year = typeof sp.year === "string" && /^\d{4}$/.test(sp.year) ? Number(sp.year) : Number(today.slice(0, 4));

  let summary, expenses: Expense[];
  try {
    const [appts, allExpenses] = await Promise.all([listAppointments(), listExpenses()]);
    summary = yearSummary(appts, allExpenses, year);
    expenses = allExpenses.filter((e) => e.date.startsWith(`${year}-`));
  } catch (err) {
    return <SetupNeeded error={errorMessage(err)} />;
  }
  const t = summary.totals;
  const maxGross = Math.max(1, ...summary.months.map((m) => m.gross));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href={`/money?year=${year - 1}`} className="p-2 text-muted" aria-label="Previous year">
          <ChevronLeft />
        </Link>
        <h1 className="heading text-2xl">{year} Money</h1>
        <Link href={`/money?year=${year + 1}`} className="p-2 text-muted" aria-label="Next year">
          <ChevronRight />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Gross income" value={money(t.gross)} accent />
        <Stat label="Expenses" value={money(t.expenses)} />
        <Stat label="Net" value={money(t.net)} />
        <Stat label="Avg ticket" value={money(Math.round(summary.averageTicket))} />
      </div>

      <section className="card overflow-x-auto p-0">
        <table className="w-full text-[13px] sm:text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs tracking-wider text-muted uppercase">
              <th className="px-3 py-3">Month</th>
              <th className="hidden px-2 py-3 text-right sm:table-cell">Appts</th>
              <th className="px-2 py-3 text-right">Income</th>
              <th className="px-2 py-3 text-right">Expenses</th>
              <th className="px-3 py-3 text-right">Net</th>
            </tr>
          </thead>
          <tbody>
            {summary.months.map((m) => (
              <tr key={m.month} className="border-b border-line/60 last:border-0">
                <td className="px-3 py-2.5">
                  <div className="text-white">{m.month.slice(0, 3)}</div>
                  <div className="mt-1 h-1 rounded-full bg-crimson/80" style={{ width: `${(m.gross / maxGross) * 100}%` }} />
                </td>
                <td className="hidden px-2 py-2.5 text-right text-muted sm:table-cell">{m.count || ""}</td>
                <td className="px-2 py-2.5 text-right text-white">{m.gross ? money(m.gross) : ""}</td>
                <td className="px-2 py-2.5 text-right text-muted">{m.expenses ? money(m.expenses) : ""}</td>
                <td className="px-3 py-2.5 text-right text-silver">{m.gross || m.expenses ? money(m.net) : ""}</td>
              </tr>
            ))}
            <tr className="font-semibold">
              <td className="px-3 py-3 text-white">Total</td>
              <td className="hidden px-2 py-3 text-right text-white sm:table-cell">{t.count}</td>
              <td className="px-2 py-3 text-right text-white">{money(t.gross)}</td>
              <td className="px-2 py-3 text-right text-white">{money(t.expenses)}</td>
              <td className="px-3 py-3 text-right text-ember">{money(t.net)}</td>
            </tr>
          </tbody>
        </table>
      </section>
      {t.tips > 0 && <p className="-mt-3 text-sm text-muted">Income includes {money(t.tips)} in tips.</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="card">
          <h2 className="heading mb-2 text-lg">By payment method</h2>
          {summary.byMethod.length ? (
            summary.byMethod.map((m) => (
              <div key={m.method} className="flex justify-between border-b border-line py-2 text-sm last:border-0">
                <span className="text-silver">{m.method}</span>
                <span className="text-white">{money(m.amount)}</span>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted">No paid appointments yet.</p>
          )}
        </section>
        <section className="card">
          <h2 className="heading mb-2 text-lg">Expenses by category</h2>
          {summary.byCategory.length ? (
            summary.byCategory.map((c) => (
              <div key={c.category} className="flex justify-between border-b border-line py-2 text-sm last:border-0">
                <span className="text-silver">{c.category}</span>
                <span className="text-white">{money(c.amount)}</span>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted">No expenses logged.</p>
          )}
        </section>
      </div>

      <section className="space-y-3">
        <h2 className="heading text-lg">Expenses</h2>
        <ExpenseForm today={today} />
        {expenses.length > 0 && (
          <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-panel">
            {expenses.map((e) => (
              <li key={e.id} className="flex items-center gap-3 px-3 py-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold text-white">{e.item}</div>
                  <div className="truncate text-xs text-muted">
                    {formatDate(e.date)} · {e.category}
                    {e.notes && ` · ${e.notes}`}
                  </div>
                </div>
                <span className="text-white">{money(e.amount, { cents: true })}</span>
                <form action={removeExpense.bind(null, e.id)}>
                  <button className="px-1 text-muted hover:text-ember" aria-label={`Delete ${e.item}`}>
                    ✕
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      {!isDemoMode() && config.spreadsheetId && (
        <a
          href={`https://docs.google.com/spreadsheets/d/${config.spreadsheetId}`}
          target="_blank"
          rel="noreferrer"
          className="btn btn-ghost w-full"
        >
          Open the Google Sheet
        </a>
      )}
    </div>
  );
}
