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

Work these in order. Items 1, 2, 3 and 6 involve code or repo changes; 4 and 5 need the owner's accounts and
can't be done by an agent.

### 1. Fix `npm run typecheck` on a fresh clone (done)

`tsc --noEmit` fails with `Cannot find name 'PageProps'` / `'LayoutProps'` until a build has generated Next's
route types. Change the script in `package.json` to:

```json
"typecheck": "next typegen && tsc --noEmit"
```

Verified to pass from a clean checkout with `.next/` deleted.

### 2. POC: bookings go on Lisa's Google Calendar (`lisacfurth@gmail.com`)

**Goal:** when Lisa books, edits, marks paid or cancels an appointment in the app, the matching event is
created, updated or removed on her own Google Calendar, `lisacfurth@gmail.com`. The owner's Google account
(`mgorney89@gmail.com`) already has write access to that calendar.

**Already built:** `src/lib/calendar.ts` keeps one event per appointment in sync on the calendar named by
`GOOGLE_CALENDAR_ID`. `src/lib/booking.ts` calls it on create, edit and payment, and deletes the event on
cancel. All calls authenticate as the service account (`src/lib/google.ts`). So the calendar ID is just config:

```
GOOGLE_CALENDAR_ID=lisacfurth@gmail.com
```

**What's missing is permission for the app to write to her calendar.** Steps:

1. **Ask the owner what access their account has on Lisa's calendar.** If they can open her calendar's
   settings in Google Calendar and see **Share with specific people**, they have "Make changes and manage
   sharing". If not, they only have "Make changes to events".
2. **Path A (recommended, no code):** if the owner can manage sharing, they add the service account email
   (shown on the app's Settings page) to her calendar with **Make changes to events**. This is SETUP.md
   step 3.2, done from the owner's account instead of Lisa's. Then set `GOOGLE_CALENDAR_ID` as above.
   Update SETUP.md step 3.2 to say either account can do it.
3. **Path B (only if Path A isn't possible and Lisa won't share it herself):** let the app write to the
   calendar as the owner's Google account instead of the service account.
   - New env vars: `GOOGLE_CALENDAR_AUTH=user`, `GOOGLE_OAUTH_CLIENT_SECRET`, `GOOGLE_OAUTH_REFRESH_TOKEN`.
     Add them to `src/lib/config.ts` and `.env.example`.
   - In `src/lib/google.ts`, have `calendarApi()` use an `OAuth2Client` built from the client ID, secret and
     refresh token when `GOOGLE_CALENDAR_AUTH=user`. Sheets stays on the service account.
   - Add a one-time local script (e.g. `scripts/calendar-token.ts`) that runs the OAuth flow for scopes
     `calendar.events` and `calendar.readonly` and prints the refresh token. Never commit the token.
   - **Caveat:** while the OAuth consent screen is in **Testing**, Google expires refresh tokens for these
     scopes after 7 days, so the calendar would stop syncing weekly. Publish the app (unverified is fine for
     personal use; it shows a warning screen once) before relying on it.
   - Update SETUP.md and the Settings page text ("Share the sheet and calendar with…") to describe this mode.
4. **Demo mode doesn't touch the calendar.** `upsertCalendarEvent`, `deleteCalendarEvent` and
   `getTimeZone` all return early when `DEMO_MODE=true`. For the POC, either run with `DEMO_MODE=false`
   (which also needs the sheet set up, SETUP.md steps 2 to 4), or add a flag such as `DEMO_CALENDAR=true`
   that keeps the local JSON store but writes real calendar events. Ask the owner which they prefer.
5. **Verify with a real booking, not just the Settings page.** The Settings check only calls
   `calendars.get`, which succeeds with read-only access, so a green check doesn't prove the app can write.
   Book a test client and confirm on Lisa's calendar that the event appears, moves when the time is edited,
   gets a ✓ in the title when marked paid, and disappears when cancelled. Delete the test client afterwards.

### 3. Rename the branch to `main` (owner decision)

Vercel's import (SETUP.md step 6) deploys the default branch. Ask the owner before renaming or changing the
default branch on GitHub.

### 4. Start Twilio A2P 10DLC registration (owner, start early)

SETUP.md step 5. Carrier approval takes days to a couple of weeks; texts stay in preview mode
(`SMS_MODE` not `live`) until it's done. The campaign form asks for the `/sms-policy` URL, so it can be
submitted once the Vercel URL exists.

### 5. Finish the rest of SETUP.md (owner)

Google Cloud project and OAuth client, service account shared on Lisa's sheet and calendar, Vercel deploy with
all env vars plus `CRON_SECRET`, then **Settings → Set up the sheet**, then Add to Home Screen on her iPhone and
iPad.

### 6. Client CSV import from GlossGenius (main feature work)

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
