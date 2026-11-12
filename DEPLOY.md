# Deploying to Vercel

A checklist for putting the app online from the `main` branch. It assumes the Google Cloud project, service
account, sheet and calendar sharing from [SETUP.md](SETUP.md) steps 2 and 3 are done, and that you have a
Twilio account with a phone number.

Type every value straight into Vercel. Don't paste secrets into chat, email or a file in the repo.

Have these open before you start:

- Google Cloud console → **APIs & Services → Credentials**
- The service account's JSON key file you downloaded
- Lisa's Google Sheet for the app
- Twilio Console home page

## 1. Import the repo

1. At https://vercel.com, click **Add New… → Project**.
2. Under **Import Git Repository**, connect GitHub if asked. When GitHub asks which repositories Vercel can
   see, choose **Only select repositories** and pick `lisa_marie_artistry`.
3. Click **Import** next to the repo. Vercel detects Next.js. Leave the framework, root directory, build and
   output settings as they are. It deploys the default branch, `main`.
4. Open **Environment Variables** on the same screen and add everything in step 2 before clicking **Deploy**.
   If you deploy first by accident, add them afterwards under **Settings → Environment Variables** and redeploy
   (step 3).

## 2. Environment variables

Add each one for all environments. For the ones marked 🔒, turn on **Sensitive** so Vercel hides the value
after saving.

| Name | What to enter | Where to find it |
| --- | --- | --- |
| `GOOGLE_CLIENT_ID` | Looks like `1234…-abc….apps.googleusercontent.com` | Cloud console → Credentials → **OAuth 2.0 Client IDs** → your Web client → **Client ID**. The app doesn't need the client secret. |
| `ALLOWED_EMAILS` | Your Gmail and Lisa's Gmail, comma separated, no spaces | Only these accounts can sign in. |
| `SESSION_SECRET` 🔒 | A long random string | Run `openssl rand -base64 32` in Terminal, or use a password manager's generator. |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Ends in `.iam.gserviceaccount.com` | `client_email` in the JSON key file (also under IAM & Admin → Service Accounts). |
| `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` 🔒 | Starts with `-----BEGIN PRIVATE KEY-----` | `private_key` in the JSON key file. Copy the whole value; including or leaving off the surrounding quotes both work. |
| `GOOGLE_SHEET_ID` | A long ID | Lisa's sheet URL, the part between `/d/` and `/edit`. The sheet must be shared with the service account email as **Editor**. |
| `GOOGLE_CALENDAR_ID` | Lisa's Gmail address | Her calendar must be shared with the service account email with **Make changes to events**. |
| `TWILIO_ACCOUNT_SID` | Starts with `AC` | Twilio Console home → **Account Info**. |
| `TWILIO_AUTH_TOKEN` 🔒 | 32 characters | Twilio Console home → **Account Info** → Auth Token (click to reveal). Treat it like a password. |
| `TWILIO_FROM_NUMBER` | `+1` and 10 digits, e.g. `+15551234567` | Twilio → **Phone Numbers → Manage → Active numbers**. |
| `SMS_MODE` | `preview` | Keep it `preview` until Twilio approves the 10DLC registration (step 8). In preview the app shows texts on screen instead of sending them. |
| `BUSINESS_PHONE` | Lisa's own cell number | Every text tells clients to call or text her here, because replies to the Twilio number don't reach her. |
| `CRON_SECRET` 🔒 | Another long random string, different from `SESSION_SECRET` | Generate it the same way. Vercel sends it to the reminder job automatically. |

Leave these out:

- `DEMO_MODE`: demo mode is for your laptop only, and the app ignores it on Vercel anyway.
- `TWILIO_MESSAGING_SERVICE_SID`: add this in step 8, after Twilio approval.
- `APP_TIMEZONE` and `BUSINESS_NAME`: optional. The time zone comes from Lisa's calendar and the name
  defaults to "LisaMarie Artistry".

## 3. Deploy and note the URL

Click **Deploy**. The build takes a minute or two. Your production URL is shown on the project page and
under **Settings → Domains**, e.g. `https://lisa-marie-artistry.vercel.app`. You can change the
`.vercel.app` name there, or add a custom domain, before going further.

Vercel only reads environment variables at deploy time. After changing any of them, go to **Deployments**, open
the ⋯ menu on the latest one and click **Redeploy**.

## 4. Allow Google sign-in from the new URL

The "Sign in with Google" button only works on sites Google has been told about.

1. Cloud console → **Credentials** → your Web client.
2. Under **Authorized JavaScript origins**, click **Add URI** and enter the production URL exactly, e.g.
   `https://lisa-marie-artistry.vercel.app` (https, no trailing slash, no path). Keep `http://localhost:3000`.
3. Click **Save**. Google says changes can take from five minutes to a few hours to apply.

No **Authorized redirect URI** is needed. The button hands the sign-in back to the page directly.

If the consent screen's publishing status is still **Testing**, both Gmail addresses must be listed as test
users (Google Auth Platform → **Audience**). You can also click **Publish app**: the app only asks for name
and email, so Google doesn't review it.

## 5. First sign-in and sheet setup

1. Open the production URL and sign in with one of the allowed accounts.
2. Tap the gear icon for **Settings**. **Google Sheet** and **Google Calendar** should both be green, and
   **Texting** should say texts are only previewed.
3. If the Sheet check says it needs setting up, tap **Set up the sheet**. This creates the Summary,
   Appointments, Clients and Expenses tabs and never deletes anything.

| You see | Fix |
| --- | --- |
| "isn't allowed to use this app" at sign-in | Add that email to `ALLOWED_EMAILS`, then redeploy. |
| Google button error about the origin not being allowed | Step 4 isn't saved yet or hasn't taken effect. Wait and reload. |
| Sheet check: "The caller does not have permission" | Share the sheet with the service account email as Editor. |
| Calendar check: "Not Found" | Share Lisa's calendar with the service account email, or check `GOOGLE_CALENDAR_ID`. |
| Sheet or calendar check mentions the private key or `invalid_grant` | Re-paste `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`, then redeploy. |

## 6. Prove the calendar sync with a test booking

The Settings check only proves the app can *read* the calendar. Book a test appointment for tomorrow and check
Lisa's calendar:

- The event appears (in red, titled with the client's name).
- Editing the time moves the event.
- Marking it paid adds a ✓ to the title.
- Cancelling it removes the event.

Then delete the test rows from the Appointments and Clients tabs in the sheet.

## 7. The reminder job

- `vercel.json` tells Vercel to call `/api/cron/reminders` once a day at 16:00 UTC (10 AM Central, 11 AM
  Eastern and 8 AM Pacific in winter, an hour later in summer). On the free plan Vercel may run it any time
  within that hour.
- It texts everyone booked for tomorrow who is still **Booked**, has **OK to Text** ticked and hasn't had a
  reminder yet.
- To check it, open **Settings → Cron Jobs** in the Vercel project. The job is listed there, and **Run**
  triggers it immediately. While `SMS_MODE=preview` it sends nothing; open **Logs** and filter by
  `/api/cron/reminders` to see which clients it would have texted.
- To change the time, change `schedule` in `vercel.json` (it's in UTC) and push to `main`.

## 8. Turn on real texts (after Twilio approval)

1. Submit the A2P 10DLC registration from SETUP.md step 5. When the form asks for the opt-in or privacy
   policy page, use your production URL plus `/sms-policy`, e.g. `https://lisa-marie-artistry.vercel.app/sms-policy`.
2. When the campaign is approved, create a Messaging Service in Twilio, add the number to it and attach the
   campaign.
3. In Vercel, add `TWILIO_MESSAGING_SERVICE_SID` (starts with `MG`), change `SMS_MODE` to `live`, and redeploy.
4. Test by booking yourself as a client with **OK to Text** ticked.

## 9. Lisa's iPhone and iPad

Open the production URL in **Safari**, sign in, then tap **Share → Add to Home Screen**.

## Good to know

- Vercel's free Hobby plan is meant for non-commercial use. Since the app runs Lisa's business, Vercel may
  expect the paid Pro plan. Starting on Hobby is fine; upgrade if Vercel asks.
- Every push to `main` deploys automatically. Other branches get their own preview URLs, but Google sign-in only
  works on the URLs listed in step 4.
