/**
 * Hyre — Google Sheet backend (Apps Script Web App)
 * ==================================================
 *
 * This script turns the bound Google Sheet into a write endpoint for the Hyre
 * website. When a candidate applies on the careers portal, the Next.js app POSTs
 * their details (and resume PDF) here; this script:
 *
 *   1. Ensures the "Applicants" tab exists with the right column headers.
 *   2. Saves the resume PDF to a Drive folder and records its link.
 *   3. Upserts one row per applicant (keyed by email) under the matching headers.
 *   4. If a Gemini API key is configured, parses the resume PDF and fills any
 *      blank columns (skills, experience, current title, …) plus an AI summary.
 *
 * SETUP (do this once — see apps-script/README.md for the click-by-click):
 *   - Extensions ▸ Apps Script, paste this file, Save.
 *   - Run `onOpen` once (or reload the sheet) to get the "Hyre" menu.
 *   - Hyre ▸ "Initialise sheet"            → creates the Applicants tab + headers.
 *   - Hyre ▸ "Set Gemini API key"          → stores your Gemini key (Script Props).
 *   - Hyre ▸ "Set shared secret"           → a password the website must send.
 *   - Deploy ▸ New deployment ▸ Web app ▸ Execute as: Me ▸ Who has access: Anyone.
 *     Copy the /exec URL into the website's SHEETS_WEBAPP_URL env var.
 *
 * Security: every request must include `secret` matching the stored shared
 * secret. The endpoint only accepts the actions defined in `handlePost_`.
 */

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

var APPLICANTS_SHEET = 'Applicants';
var DRIVE_FOLDER_NAME = 'Hyre Resumes';
var DEFAULT_GEMINI_MODEL = 'gemini-2.0-flash';

/**
 * Applicant tab columns, in display order. The website sends camelCase keys;
 * this map ties each key to its human header. Gemini-only outputs (aiSummary,
 * aiParsedSkills) have no website key — they are filled by the parser.
 */
var COLUMNS = [
  { key: 'appliedAt',            header: 'Applied At' },
  { key: 'name',                 header: 'Name' },
  { key: 'email',                header: 'Email' },
  { key: 'phone',                header: 'Phone' },
  { key: 'location',             header: 'Location' },
  { key: 'currentEmployer',      header: 'Current Employer' },
  { key: 'currentTitle',         header: 'Current Title' },
  { key: 'totalExperienceYears', header: 'Total Experience (yrs)' },
  { key: 'noticePeriodDays',     header: 'Notice Period (days)' },
  { key: 'currentCtc',           header: 'Current CTC' },
  { key: 'expectedCtc',          header: 'Expected CTC' },
  { key: 'linkedinUrl',          header: 'LinkedIn' },
  { key: 'portfolioUrl',         header: 'Portfolio' },
  { key: 'skills',               header: 'Skills' },
  { key: 'coverNote',            header: 'Cover Note' },
  { key: 'rolesApplied',         header: 'Roles Applied' },
  { key: 'resumeUrl',            header: 'Resume URL' },
  { key: 'aiSummary',            header: 'AI Summary' },
  { key: 'aiParsedSkills',       header: 'AI Parsed Skills' },
  { key: 'parseStatus',          header: 'Parse Status' },
];

/** Columns the resume parser may fill when the applicant left them blank. */
var AI_FILLABLE = [
  'phone', 'location', 'currentEmployer', 'currentTitle',
  'totalExperienceYears', 'skills',
];

// ---------------------------------------------------------------------------
// Web app entry points
// ---------------------------------------------------------------------------

function doPost(e) {
  try {
    var body = (e && e.postData && e.postData.contents)
      ? JSON.parse(e.postData.contents)
      : {};

    if (!secretOk_(body.secret)) {
      return json_({ ok: false, error: 'Unauthorised (bad or missing secret).' }, 401);
    }
    return json_(handlePost_(body));
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message || err) }, 500);
  }
}

function doGet(e) {
  // Health check / smoke test. Does not require the secret.
  return json_({ ok: true, service: 'hyre-sheets', time: new Date().toISOString() });
}

/** Routes a validated POST body to the right handler. */
function handlePost_(body) {
  switch (body.action) {
    case 'ping':
      return { ok: true, pong: true };
    case 'applicationSubmitted':
      return handleApplication_(body.applicant || {});
    default:
      return { ok: false, error: 'Unknown action: ' + body.action };
  }
}

// ---------------------------------------------------------------------------
// Application handler
// ---------------------------------------------------------------------------

/**
 * Upsert an applicant row and (optionally) parse their resume.
 * `applicant` is the payload sent by lib/sheets/client.ts.
 */
function handleApplication_(applicant) {
  if (!applicant.email) return { ok: false, error: 'Applicant email is required.' };

  var lock = LockService.getScriptLock();
  lock.waitLock(30000); // serialise writes so concurrent applies don't clash
  try {
    var sheet = ensureApplicantsSheet_();
    var email = String(applicant.email).toLowerCase();

    // Build the record from the payload.
    var record = {
      appliedAt: new Date().toISOString(),
      name: applicant.name || '',
      email: email,
      phone: applicant.phone || '',
      location: applicant.location || '',
      currentEmployer: applicant.currentEmployer || '',
      currentTitle: applicant.currentTitle || '',
      totalExperienceYears: applicant.totalExperienceYears != null ? applicant.totalExperienceYears : '',
      noticePeriodDays: applicant.noticePeriodDays != null ? applicant.noticePeriodDays : '',
      currentCtc: applicant.currentCtc || '',
      expectedCtc: applicant.expectedCtc || '',
      linkedinUrl: applicant.linkedinUrl || '',
      portfolioUrl: applicant.portfolioUrl || '',
      skills: joinList_(applicant.skills),
      coverNote: applicant.coverNote || '',
      rolesApplied: joinList_(applicant.rolesApplied),
      resumeUrl: '',
      aiSummary: '',
      aiParsedSkills: '',
      parseStatus: '',
    };

    // Save the resume to Drive (if one was sent).
    var resumeBytes = null;
    if (applicant.resume && applicant.resume.base64) {
      try {
        var saved = saveResumeToDrive_(applicant.resume, record.name || email);
        record.resumeUrl = saved.url;
        resumeBytes = saved.blob; // reused for Gemini, avoids re-decoding
      } catch (driveErr) {
        record.parseStatus = 'Resume save failed: ' + driveErr;
      }
    }

    // Merge onto any existing row for this email (accumulate roles, keep data).
    var existing = findRowByEmail_(sheet, email);
    if (existing) {
      record = mergeWithExisting_(sheet, existing.rowIndex, record);
    }

    // Parse the resume with Gemini and fill blanks.
    if (resumeBytes && getGeminiKey_()) {
      try {
        var parsed = parseResumeWithGemini_(resumeBytes);
        applyParsed_(record, parsed);
        record.parseStatus = 'Parsed by Gemini at ' + new Date().toISOString();
      } catch (aiErr) {
        record.parseStatus = 'Gemini parse failed: ' + (aiErr && aiErr.message || aiErr);
      }
    } else if (resumeBytes) {
      record.parseStatus = 'No Gemini key set — resume not parsed.';
    }

    // Write the row.
    var rowValues = COLUMNS.map(function (c) { return record[c.key]; });
    if (existing) {
      sheet.getRange(existing.rowIndex, 1, 1, COLUMNS.length).setValues([rowValues]);
    } else {
      sheet.appendRow(rowValues);
    }

    return { ok: true, email: email, resumeUrl: record.resumeUrl, parseStatus: record.parseStatus };
  } finally {
    lock.releaseLock();
  }
}

// ---------------------------------------------------------------------------
// Sheet helpers
// ---------------------------------------------------------------------------

function ensureApplicantsSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(APPLICANTS_SHEET);
  if (!sheet) sheet = ss.insertSheet(APPLICANTS_SHEET);

  var headers = COLUMNS.map(function (c) { return c.header; });
  var firstRow = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  var needsHeaders = firstRow.join('') === '';
  if (needsHeaders) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/** Returns { rowIndex, values } for the row whose Email matches, or null. */
function findRowByEmail_(sheet, email) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return null;
  var emailCol = colIndex_('email'); // 0-based
  var values = sheet.getRange(2, 1, lastRow - 1, COLUMNS.length).getValues();
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][emailCol]).toLowerCase() === email) {
      return { rowIndex: i + 2, values: values[i] };
    }
  }
  return null;
}

/**
 * Merge a fresh record onto the existing row: keep existing non-empty values,
 * fill blanks from the new submission, and union the Roles Applied list.
 */
function mergeWithExisting_(sheet, rowIndex, fresh) {
  var current = sheet.getRange(rowIndex, 1, 1, COLUMNS.length).getValues()[0];
  var merged = {};
  COLUMNS.forEach(function (c, i) {
    var cur = current[i];
    var nw = fresh[c.key];
    if (c.key === 'rolesApplied') {
      merged[c.key] = unionList_(cur, nw);
    } else if (c.key === 'appliedAt') {
      merged[c.key] = cur || nw; // keep first-applied timestamp
    } else {
      // Prefer a non-empty new value; otherwise keep what's there.
      merged[c.key] = (nw !== '' && nw != null) ? nw : cur;
    }
  });
  return merged;
}

function colIndex_(key) {
  for (var i = 0; i < COLUMNS.length; i++) if (COLUMNS[i].key === key) return i;
  return -1;
}

// ---------------------------------------------------------------------------
// Drive (resume storage)
// ---------------------------------------------------------------------------

function saveResumeToDrive_(resume, ownerLabel) {
  var folder = getResumeFolder_();
  var bytes = Utilities.base64Decode(resume.base64);
  var mime = resume.mimeType || 'application/pdf';
  var safe = (ownerLabel || 'applicant').replace(/[^a-zA-Z0-9._-]/g, '_');
  var name = safe + '__' + (resume.filename || 'resume.pdf');
  var blob = Utilities.newBlob(bytes, mime, name);
  var file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return { url: file.getUrl(), blob: blob };
}

function getResumeFolder_() {
  var it = DriveApp.getFoldersByName(DRIVE_FOLDER_NAME);
  return it.hasNext() ? it.next() : DriveApp.createFolder(DRIVE_FOLDER_NAME);
}

// ---------------------------------------------------------------------------
// Gemini resume parsing
// ---------------------------------------------------------------------------

/**
 * Sends the resume PDF to Gemini and returns a structured object:
 * { phone, location, currentEmployer, currentTitle, totalExperienceYears,
 *   skills: string[], summary: string }
 */
function parseResumeWithGemini_(blob) {
  var key = getGeminiKey_();
  if (!key) throw new Error('No Gemini API key configured.');
  var model = getGeminiModel_();

  var prompt =
    'You are a resume parser for an applicant tracking system. Read the attached ' +
    'resume and return ONLY a JSON object with these fields (use null when unknown):\n' +
    '{\n' +
    '  "phone": string|null,\n' +
    '  "location": string|null,\n' +
    '  "currentEmployer": string|null,\n' +
    '  "currentTitle": string|null,\n' +
    '  "totalExperienceYears": number|null,\n' +
    '  "skills": string[],\n' +
    '  "summary": string  // 1-2 sentence professional summary\n' +
    '}\n' +
    'Do not include any prose outside the JSON.';

  var payload = {
    contents: [{
      parts: [
        { text: prompt },
        { inline_data: { mime_type: blob.getContentType() || 'application/pdf',
                         data: Utilities.base64Encode(blob.getBytes()) } },
      ],
    }],
    generationConfig: { temperature: 0.1, responseMimeType: 'application/json' },
  };

  var url = 'https://generativelanguage.googleapis.com/v1beta/models/' +
            encodeURIComponent(model) + ':generateContent?key=' + encodeURIComponent(key);

  var res = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  });

  var code = res.getResponseCode();
  var text = res.getContentText();
  if (code < 200 || code >= 300) {
    throw new Error('Gemini HTTP ' + code + ': ' + text.slice(0, 300));
  }

  var data = JSON.parse(text);
  var out = data && data.candidates && data.candidates[0] &&
            data.candidates[0].content && data.candidates[0].content.parts &&
            data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text;
  if (!out) throw new Error('Gemini returned no content.');

  return JSON.parse(stripCodeFence_(out));
}

/** Fills blank, AI-fillable columns from the parsed result + AI extras. */
function applyParsed_(record, parsed) {
  if (!parsed) return;
  AI_FILLABLE.forEach(function (key) {
    var blank = record[key] === '' || record[key] == null;
    if (!blank) return;
    if (key === 'skills') {
      if (parsed.skills && parsed.skills.length) record.skills = joinList_(parsed.skills);
    } else if (parsed[key] != null && parsed[key] !== '') {
      record[key] = parsed[key];
    }
  });
  if (parsed.skills && parsed.skills.length) record.aiParsedSkills = joinList_(parsed.skills);
  if (parsed.summary) record.aiSummary = parsed.summary;
}

// ---------------------------------------------------------------------------
// Script Properties (Gemini key, shared secret, model)
// ---------------------------------------------------------------------------

function getGeminiKey_()   { return PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY'); }
function getGeminiModel_() { return PropertiesService.getScriptProperties().getProperty('GEMINI_MODEL') || DEFAULT_GEMINI_MODEL; }
function getSharedSecret_(){ return PropertiesService.getScriptProperties().getProperty('SHARED_SECRET'); }

function secretOk_(provided) {
  var expected = getSharedSecret_();
  if (!expected) return true; // not configured → open (dev only; set one!)
  return provided && String(provided) === String(expected);
}

// ---------------------------------------------------------------------------
// Small utilities
// ---------------------------------------------------------------------------

function joinList_(v) {
  if (Array.isArray(v)) return v.filter(String).join(', ');
  return v == null ? '' : String(v);
}

function unionList_(a, b) {
  var set = {};
  var push = function (x) {
    String(x || '').split(',').forEach(function (t) {
      var s = t.trim();
      if (s) set[s.toLowerCase()] = s;
    });
  };
  push(a); push(b);
  return Object.keys(set).map(function (k) { return set[k]; }).join(', ');
}

function stripCodeFence_(s) {
  return String(s).replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
}

function json_(obj, code) {
  // Apps Script Web Apps can't set arbitrary status codes on ContentService,
  // so the HTTP status is always 200; callers check the `ok` field.
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ---------------------------------------------------------------------------
// Editor menu — friendly setup without touching Project Settings
// ---------------------------------------------------------------------------

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Hyre')
    .addItem('Initialise sheet (create headers)', 'menuInit_')
    .addSeparator()
    .addItem('Set Gemini API key', 'menuSetGeminiKey_')
    .addItem('Set Gemini model', 'menuSetGeminiModel_')
    .addItem('Set shared secret', 'menuSetSecret_')
    .addToUi();
}

function menuInit_() {
  ensureApplicantsSheet_();
  SpreadsheetApp.getUi().alert('Hyre', 'Applicants tab is ready.', SpreadsheetApp.getUi().ButtonSet.OK);
}

function menuSetGeminiKey_()   { promptStore_('Gemini API key', 'GEMINI_API_KEY'); }
function menuSetGeminiModel_()  { promptStore_('Gemini model (e.g. gemini-2.0-flash)', 'GEMINI_MODEL'); }
function menuSetSecret_()       { promptStore_('Shared secret (must match the website env var)', 'SHARED_SECRET'); }

function promptStore_(label, propKey) {
  var ui = SpreadsheetApp.getUi();
  var resp = ui.prompt('Hyre', 'Enter ' + label + ':', ui.ButtonSet.OK_CANCEL);
  if (resp.getSelectedButton() !== ui.Button.OK) return;
  var val = resp.getResponseText().trim();
  if (!val) { ui.alert('Nothing saved (empty value).'); return; }
  PropertiesService.getScriptProperties().setProperty(propKey, val);
  ui.alert('Hyre', label + ' saved.', ui.ButtonSet.OK);
}
