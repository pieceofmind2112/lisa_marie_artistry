# Setup guide

This gets the app from "running on your laptop" to "on Lisa's iPhone and iPad". Do the steps in order;
each one ends with something you can check.

## 1. Try it locally in demo mode (5 minutes, no accounts needed)

```bash
git clone https://github.com/pieceofmind2112/lisa_marie_artistry.git
cd lisa_marie_artistry
npm install
cp .env.example .env.local     # DEMO_MODE=true is already set
npm run dev
```

Open http://localhost:3000 and tap **Try it in demo mode**. Data is saved to `.data/demo.json` on your
computer; texts are shown as previews instead of being sent. Delete `.data/` to start over.

## 2. Google Cloud project (sign-in + robot user)

Do this with **your** Google account at https://console.cloud.google.com.

1. Create a project, e.g. `lisamarie-booking`.
2. **APIs & Services → Library**: enable **Google Sheets API** and **Google Calendar API**.
3. **APIs & Services → OAuth consent screen** (Google Auth Platform):
   - User type **External**, app name `LisaMarie Artistry`, your email as support and developer contact.
   - Don't add any scopes. The app only asks for name and email.
   - Under **Audience**, either add your and Lisa's Gmail addresses as test users, or click **Publish app**
     (no Google review is needed when only name/email are requested).
4. **Credentials → Create credentials → OAuth client ID** → *Web application*.
   - Authorized JavaScript origins: `http://localhost:3000` (add the Vercel URL later in step 6).
   - No redirect URIs are needed. Copy the **Client ID** into `GOOGLE_CLIENT_ID`.
5. **Credentials → Create credentials → Service account**, name it `lisamarie-app`, skip the optional role
   steps. Open it → **Keys → Add key → JSON**. From the downloaded file copy:
   - `client_email` → `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `private_key` → `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` (keep it in double quotes, `\n`s and all)

   Keep that JSON file private and never commit it.

## 3. Lisa's Google Sheet and Calendar

Signed in as **Lisa's** Google account:

1. Create a blank Google Sheet, e.g. `LisaMarie Artistry – Bookings`. Click **Share**, add the service account
   email as **Editor** (untick "Notify"). Copy the ID from the URL
   (`docs.google.com/spreadsheets/d/<THIS PART>/edit`) into `GOOGLE_SHEET_ID`.
2. Open Google Calendar → ⚙ Settings → under *Settings for my calendars* pick her calendar →
   **Share with specific people** → add the service account email with **Make changes to events**.
   Her calendar ID (shown under *Integrate calendar*) is usually her Gmail address → `GOOGLE_CALENDAR_ID`.

## 4. Run locally against the real sheet

In `.env.local` set `DEMO_MODE=false`, fill in the values above, plus:

- `ALLOWED_EMAILS=you@gmail.com,lisa@gmail.com`
- `SESSION_SECRET` = output of `openssl rand -base64 32`

Restart `npm run dev`, sign in with Google, open **Settings** (gear icon) and tap **Set up the sheet**.
That creates the **Summary**, **Appointments**, **Clients** and **Expenses** tabs. All three checks on the
Settings page should be green except Texting.

The Summary tab mirrors your accounting sheet: month by month paid appointments, services, tips, gross,
expenses and net, plus expenses by category and income by payment method. Change the year in cell B2 to
see another year. Income only counts appointments marked **Paid**.

## 5. Texting with Twilio

The app sends a confirmation when you book (if the box is ticked) and a reminder the day before.
Clients must have **OK to Text** ticked on their client page.

Until `SMS_MODE=live`, texts are only previewed on screen, so you can test safely.

1. Sign up at https://www.twilio.com and upgrade from the trial (trial accounts can only text numbers you
   verify yourself). Twilio shows current prices for the number, registration and per-message fees.
2. **Phone Numbers → Buy a number**: a local number with SMS.
3. **Messaging → Regulatory Compliance → A2P 10DLC**: register a **Sole Proprietor** brand with Lisa's
   legal name, address, email and her own mobile (Twilio texts it a code to confirm). US carriers require
   this before they'll deliver texts from the number. Approval usually takes days, sometimes a couple of weeks.
4. Create the campaign. Use case: appointment reminders / customer care. Suggested answers:
   - **Description:** "LisaMarie Artistry is a sole-proprietor hair and makeup stylist. We text clients a
     confirmation when an appointment is booked or changed and a reminder the day before."
   - **How users opt in:** "Clients book in person, by phone or by text. Lisa asks if they want appointment
     texts at the mobile number they provide and records their consent. Policy:
     https://YOUR-APP-URL/sms-policy"
   - **Sample message 1:** "Hi Jane! You're booked with LisaMarie Artistry on Tuesday, Oct 6 at 2:00 PM.
     Questions or changes? Call/text Lisa at (555) 123-4567. Reply STOP to opt out."
   - **Sample message 2:** "Reminder: Jane, you're booked with LisaMarie Artistry tomorrow, Wednesday, Oct 7
     at 9:30 AM. Questions or changes? Call/text Lisa at (555) 123-4567. Reply STOP to opt out."
   - Opt-out keywords STOP, help keyword HELP (Twilio handles both automatically).
5. **Messaging → Services → Create**, add the number as a sender and attach the approved campaign.
6. Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` (Console home page), `TWILIO_MESSAGING_SERVICE_SID`
   (starts with `MG`), `BUSINESS_PHONE` (Lisa's own cell, so clients reply to her), then `SMS_MODE=live`.

Replies to the Twilio number don't reach Lisa, which is why every text tells clients to contact her directly.

## 6. Put it online (Vercel, free)

1. Sign in at https://vercel.com with GitHub and **Import** the `lisa_marie_artistry` repo.
2. Before deploying, add every variable from `.env.local` under **Environment Variables**, except
   `DEMO_MODE` (leave it out). Add `CRON_SECRET` = another `openssl rand -base64 32`.
3. Deploy, then add the site URL (e.g. `https://lisa-marie-artistry.vercel.app`) to the OAuth client's
   **Authorized JavaScript origins** from step 2.4.
4. Reminders: `vercel.json` runs `/api/cron/reminders` daily at 16:00 UTC (noon Eastern / 9 AM Pacific).
   The free plan allows one run per day; change the time in `vercel.json` if you like.

## 7. Lisa's iPhone and iPad

Open the site in **Safari** → **Share** → **Add to Home Screen**. It opens full screen with her logo as the icon.
She stays signed in for 30 days at a time.

## Moving off GlossGenius

Before cancelling, export her client list from GlossGenius so nothing is lost. A CSV import for clients isn't
built yet; it's a small follow-up.
