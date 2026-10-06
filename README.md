# LisaMarie Artistry booking app

A small, private booking app for a solo hair and makeup stylist, installable on iPhone and iPad.

- **Book appointments** for new or existing clients, with value, payment method and notes (color formulas).
- **Google Calendar**: every booking lands on Lisa's calendar and stays in sync when edited or cancelled.
- **Texts** (Twilio): confirmation on booking and a reminder the day before, for clients who've OK'd texts.
- **Google Sheet as the database**: Appointments, Clients and Expenses tabs plus a yearly Summary tab with
  monthly gross, expenses and net, expenses by category and income by payment method.
- **Money**: the same summary in the app, plus optional expense logging.

See **[SETUP.md](SETUP.md)** to run it locally (there's a no-setup demo mode) and deploy it.

## Development

```bash
npm install
cp .env.example .env.local   # demo mode on by default
npm run dev                  # http://localhost:3000
npm test                     # unit tests
npm run lint && npm run typecheck
```

Built with Next.js (App Router, server actions) and Tailwind. Google access uses a service account that
Lisa shares her sheet and calendar with; people sign in with "Sign in with Google" and an email allow list.

| Path | What it is |
| --- | --- |
| `src/lib/store/` | Sheet-backed tables (`schema.ts` defines the tabs and columns) and the demo JSON store |
| `src/lib/booking.ts` | Booking, payment, cancel, and reminder logic |
| `src/lib/sheet-setup.ts` | Creates the tabs, formats and Summary formulas |
| `src/lib/sms.ts` | Text templates and Twilio sending (preview mode until `SMS_MODE=live`) |
| `src/app/(app)/` | The signed-in screens |
