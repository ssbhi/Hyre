/**
 * Google Sheet backend client.
 *
 * Posts applicant submissions to the Apps Script Web App deployed on the Hyre
 * sheet (see apps-script/Code.gs). The Web App writes the applicant's details
 * under the matching column headers, stores the resume in Drive, and — when a
 * Gemini key is configured on the sheet — parses the resume to fill blanks.
 *
 * This is a best-effort side-channel: a failure here must NOT block the apply
 * flow, so callers should treat the result as advisory and log failures.
 *
 * Config (.env):
 *   SHEETS_WEBAPP_URL     the deployed /exec URL of the Apps Script Web App
 *   SHEETS_SHARED_SECRET  must match the sheet's SHARED_SECRET script property
 */
import "server-only";

export interface SheetResume {
  filename: string;
  mimeType: string;
  base64: string;
}

export interface SheetApplicant {
  name: string;
  email: string;
  phone?: string;
  location?: string;
  currentEmployer?: string;
  currentTitle?: string;
  totalExperienceYears?: number;
  noticePeriodDays?: number;
  currentCtc?: string;
  expectedCtc?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  skills?: string[];
  coverNote?: string;
  rolesApplied: string[];
  resume?: SheetResume;
}

export interface SheetSyncResult {
  ok: boolean;
  resumeUrl?: string;
  parseStatus?: string;
  error?: string;
}

/** Whether the sheet backend is configured. */
export function isSheetSyncEnabled(): boolean {
  return Boolean(process.env.SHEETS_WEBAPP_URL);
}

/** Turn an uploaded resume File into the base64 payload the Web App expects. */
export async function fileToSheetResume(file: File): Promise<SheetResume> {
  const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
  return {
    filename: file.name,
    mimeType: file.type || "application/pdf",
    base64,
  };
}

/**
 * Append/update the applicant in the Google Sheet. Never throws — returns an
 * { ok: false, error } result on failure so the caller can log and move on.
 */
export async function syncApplicantToSheet(
  applicant: SheetApplicant,
): Promise<SheetSyncResult> {
  const url = process.env.SHEETS_WEBAPP_URL;
  if (!url) return { ok: false, error: "SHEETS_WEBAPP_URL is not set." };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "applicationSubmitted",
        secret: process.env.SHEETS_SHARED_SECRET,
        applicant,
      }),
      // Apps Script Web Apps 302-redirect to a googleusercontent host; fetch
      // follows that by default. Don't cache.
      cache: "no-store",
    });

    const text = await res.text();
    let data: SheetSyncResult;
    try {
      data = JSON.parse(text) as SheetSyncResult;
    } catch {
      return { ok: false, error: `Unexpected sheet response: ${text.slice(0, 200)}` };
    }
    return data;
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Sheet sync failed." };
  }
}
