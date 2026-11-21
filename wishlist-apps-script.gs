// Secret Santa backend: paste into the Google Sheet's Apps Script editor.
// "Wishlists" tab: one row per person: name | items (JSON) | updated.
// "Checked" tab:   one row per person who has revealed their match: name | first checked | last checked.
//   It records only WHO looked and WHEN, never who they drew.
// This file is NOT needed on GitHub Pages; it lives in Google Apps Script.

const NAMES = ["charles", "jayden", "gabe", "kathleen", "peter", "cam", "jack", "carter"];
const MAX_ITEMS = 20;
const MAX_LEN = 200;

function tab_(name, header) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(header);
  }
  return sh;
}
function sheet_() { return tab_("Wishlists", ["name", "items", "updated"]); }
function checkedSheet_() { return tab_("Checked", ["name", "first checked", "last checked"]); }

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// GET: every wishlist, plus who has checked their match.
function doGet() {
  const lists = {};
  for (const [name, items, updated] of sheet_().getDataRange().getValues().slice(1)) {
    if (!NAMES.includes(name)) continue;
    try { lists[name] = { items: JSON.parse(items || "[]"), updated: String(updated) }; } catch (e) {}
  }
  const checked = {};
  for (const [name, first] of checkedSheet_().getDataRange().getValues().slice(1)) {
    if (NAMES.includes(name)) checked[name] = String(first);
  }
  return json_({ lists, checked });
}

// POST {name, items}: replace that person's wishlist.
// POST {action: "checkin", name}: note that this person revealed their match.
function doPost(e) {
  let body;
  try { body = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok: false, error: "bad json" }); }

  const name = String(body.name || "").toLowerCase();
  if (!NAMES.includes(name)) return json_({ ok: false, error: "unknown name" });

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    if (body.action === "checkin") {
      const sh = checkedSheet_();
      const now = new Date().toISOString();
      const names = sh.getRange(1, 1, sh.getLastRow(), 1).getValues().map(r => r[0]);
      const row = names.indexOf(name) + 1;
      if (row > 0) sh.getRange(row, 3).setValue(now);   // keep the first time, update the last
      else sh.appendRow([name, now, now]);
      return json_({ ok: true });
    }

    const items = (Array.isArray(body.items) ? body.items : [])
      .map(s => String(s).trim().slice(0, MAX_LEN))
      .filter(Boolean)
      .slice(0, MAX_ITEMS);
    const sh = sheet_();
    const names = sh.getRange(1, 1, sh.getLastRow(), 1).getValues().map(r => r[0]);
    const row = names.indexOf(name) + 1;
    // Leading apostrophe stops Sheets from treating the JSON as a formula.
    const values = [[name, "'" + JSON.stringify(items), new Date().toISOString()]];
    if (row > 0) sh.getRange(row, 1, 1, 3).setValues(values);
    else sh.appendRow(values[0]);
    return json_({ ok: true });
  } finally {
    lock.releaseLock();
  }
}
