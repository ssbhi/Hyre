# Hyre — Google Sheet backend (Apps Script Web App)

This folder holds the Apps Script that turns your Google Sheet into the write
endpoint for candidate applications, with optional Gemini resume parsing.

- **`Code.gs`** — paste this into the sheet's Apps Script editor.

The website (Next.js) POSTs each application here. The script writes the
applicant's details into the **Applicants** tab under the matching column
headers (one row per applicant, keyed by email), stores the resume PDF in a
Drive folder, and — if a Gemini key is set — parses the resume to fill blanks.

---

## One-time setup (≈5 minutes)

### 1. Paste the script
1. Open the sheet → **Extensions ▸ Apps Script**.
2. Delete the default `Code.gs` contents, paste everything from this folder's
   `Code.gs`, and **Save** (💾).
3. Reload the spreadsheet tab. A **Hyre** menu appears in the menu bar.
   - If it doesn't, in the Apps Script editor run the `onOpen` function once
     and grant the permissions it asks for.

### 2. Create the headers
- **Hyre ▸ Initialise sheet (create headers)** — creates the `Applicants` tab
  with the column headers.

### 3. Add your Gemini key (for resume parsing)
- **Hyre ▸ Set Gemini API key** — paste your key from
  https://aistudio.google.com/apikey.
- (Optional) **Hyre ▸ Set Gemini model** — defaults to `gemini-2.0-flash`.
- Resume parsing is skipped automatically if no key is set; everything else
  still works.

### 4. Set a shared secret
- **Hyre ▸ Set shared secret** — type any strong random string (e.g. a UUID).
- You'll put the **same** value in the website's `SHEETS_SHARED_SECRET` env var.

### 5. Deploy as a Web App
1. In the Apps Script editor: **Deploy ▸ New deployment**.
2. Gear icon ▸ **Web app**.
3. **Execute as:** `Me`. **Who has access:** `Anyone`.
4. **Deploy**, authorise, and copy the **Web app URL** (ends in `/exec`).

> Re-deploying after a code change: **Deploy ▸ Manage deployments ▸ Edit ▸
> Version: New version ▸ Deploy.** The `/exec` URL stays the same.

### 6. Point the website at it
In `hyre/.env`:
```
SHEETS_WEBAPP_URL="https://script.google.com/macros/s/AKfy.../exec"
SHEETS_SHARED_SECRET="the-same-secret-you-set-in-step-4"
```
Restart `npm run dev` so the new env vars load.

---

## Smoke test (no website needed)

Open the `/exec` URL in a browser — you should see:
```json
{ "ok": true, "service": "hyre-sheets", "time": "..." }
```

Test a write from PowerShell (replace URL + secret):
```powershell
$body = @{ action='applicationSubmitted'; secret='YOUR_SECRET'; applicant=@{
  name='Test Candidate'; email='test@example.com'; phone='123';
  rolesApplied=@('Senior Frontend Engineer'); skills=@('React','TypeScript')
} } | ConvertTo-Json -Depth 6
Invoke-RestMethod -Uri 'YOUR_EXEC_URL' -Method Post -ContentType 'application/json' -Body $body
```
A new row should appear in the **Applicants** tab.

---

## How it behaves

- **One row per applicant**, keyed by email. Re-applying updates the row and
  appends new roles to **Roles Applied** (existing non-empty values are kept;
  blanks get filled).
- **Resume** is saved to a Drive folder named **Hyre Resumes**; the link goes in
  the **Resume URL** column (shared as "anyone with link → view").
- **Gemini parsing** fills only blank columns the candidate left empty
  (phone, location, current employer/title, experience, skills) and always adds
  an **AI Summary** + **AI Parsed Skills**. The **Parse Status** column records
  success/failure.

## Security notes

- Always set a **shared secret** before deploying publicly — without one the
  endpoint accepts any request.
- The Gemini key and shared secret live in **Script Properties**, never in the
  sheet cells or in the website repo.
