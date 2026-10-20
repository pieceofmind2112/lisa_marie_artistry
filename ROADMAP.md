# Roadmap and handoff

Status as of 2026-10-20. Written so a new agent (or person) can pick up the work without the earlier chat.

## Where things stand

- The app is feature complete for a first release: booking, clients, Google Calendar sync, Twilio confirmation
  and reminder texts, expenses, and the yearly Summary tab. See [README.md](README.md) for the feature list and
  code map, and [SETUP.md](SETUP.md) for accounts and deployment.
- All the code is in one commit (`e6c522a`) on `claude/youthful-thompson-0ewytu`. It is the only branch, so
  GitHub probably treats it as the default branch. There are no issues or pull requests yet.
- Checks (verified 2026-10-20 on a clean checkout): `npm test` passes (12 tests), `npm run lint` passes,
  `npx next build` succeeds with `DEMO_MODE=true`.
- Not deployed. None of the SETUP.md account steps (Google Cloud, Twilio, Vercel) are known to be done.

## Next up

Work these in order. Items 1, 2 and 5 are code; 3 and 4 need the owner's accounts and can't be done by an agent.

### 1. Fix `npm run typecheck` on a fresh clone (small, do first)

`tsc --noEmit` fails with `Cannot find name 'PageProps'` / `'LayoutProps'` until a build has generated Next's
route types. Change the script in `package.json` to:

```json
"typecheck": "next typegen && tsc --noEmit"
```

Verified to pass from a clean checkout with `.next/` deleted.

### 2. Rename the branch to `main` (owner decision)

Vercel's import (SETUP.md step 6) deploys the default branch. Ask the owner before renaming or changing the
default branch on GitHub.

### 3. Start Twilio A2P 10DLC registration (owner, start early)

SETUP.md step 5. Carrier approval takes days to a couple of weeks; texts stay in preview mode
(`SMS_MODE` not `live`) until it's done. The campaign form asks for the `/sms-policy` URL, so it can be
submitted once the Vercel URL exists.

### 4. Finish the rest of SETUP.md (owner)

Google Cloud project and OAuth client, service account shared on Lisa's sheet and calendar, Vercel deploy with
all env vars plus `CRON_SECRET`, then **Settings → Set up the sheet**, then Add to Home Screen on her iPhone and
iPad.

### 5. Client CSV import from GlossGenius (main feature work)

SETUP.md promises this before Lisa cancels GlossGenius, otherwise her client list is lost.

- **Get a real export first.** Ask the owner for a GlossGenius client CSV (or just its header row) so the
  column mapping is exact rather than guessed. Don't commit real client data; build a fake fixture for tests.
- **Where it fits:** a form on the Settings page (or `/clients`) that uploads a CSV, shows a preview (new,
  duplicate, invalid rows), then imports on confirm. Put the parsing and matching in `src/lib/` with unit tests
  in `test/`, like the existing helpers.
- **Reuse the existing rules** from `saveClient` in `src/app/actions.ts`: name required, phone normalized with
  `toE164` from `src/lib/phone.ts`, IDs from `newId("C")`, timestamps from `nowStamp()`.
- **Duplicates:** skip rows whose phone (E.164) or email matches an existing client; report them in the preview.
- **OK to Text:** default to off. Consent given to GlossGenius doesn't automatically carry over, so only set it
  if the export has an explicit SMS opt-in column *and* the owner confirms it should be trusted.
- **Write in bulk.** `TableBackend` (`src/lib/store/backend.ts`) only appends one row per call, and the Sheets
  backend makes one API request per append. Hundreds of clients would hit the Sheets write quota (about
  60 requests per minute per user). Add an `appendMany(tab, rows)` to the interface and implement it in both
  `sheets-backend.ts` (one `values.append` with all rows) and `json-backend.ts`.
- Demo mode (`DEMO_MODE=true`, data in `.data/demo.json`) is the easiest way to try it end to end.

## Later ideas (not started, not committed to)

- Import past years' totals from the owner's Google Drive accounting sheets ("Lisa Marie.Artistry – 2021"
  through "Accounting_V2") so the Summary covers history. Their layouts differ by year, so check with the owner
  what's actually wanted.
- Delete or merge duplicate clients. Today clients can only be edited, appointments only cancelled or marked
  no-show, and expenses only removed (no edit).

## Working conventions

- Before pushing: `npm test`, `npm run lint`, `npm run typecheck`, and `npx next build` with `DEMO_MODE=true`.
- Never commit `.env*` files (other than `.env.example`), `.data/`, service account JSON, or real client data.
- Don't open pull requests unless the owner asks.
