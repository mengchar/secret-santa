// Secret Santa wishlist backend: paste into the Google Sheet's Apps Script editor.
// Stores one row per person: name | items (JSON) | updated.
// This file is NOT needed on GitHub Pages; it lives in Google Apps Script.

const NAMES = ["charles", "jayden", "gabe", "kathleen", "peter", "cam", "jack", "carter"];
const MAX_ITEMS = 20;
const MAX_LEN = 200;

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName("Wishlists");
  if (!sh) {
    sh = ss.insertSheet("Wishlists");
    sh.appendRow(["name", "items", "updated"]);
  }
  return sh;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// GET: return every wishlist.
function doGet() {
  const rows = sheet_().getDataRange().getValues().slice(1);
  const lists = {};
  for (const [name, items, updated] of rows) {
    if (!NAMES.includes(name)) continue;
    try { lists[name] = { items: JSON.parse(items || "[]"), updated: String(updated) }; } catch (e) {}
  }
  return json_({ lists });
}

// POST {name, items}: replace that person's wishlist.
function doPost(e) {
  let body;
  try { body = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok: false, error: "bad json" }); }

  const name = String(body.name || "").toLowerCase();
  if (!NAMES.includes(name)) return json_({ ok: false, error: "unknown name" });
  const items = (Array.isArray(body.items) ? body.items : [])
    .map(s => String(s).trim().slice(0, MAX_LEN))
    .filter(Boolean)
    .slice(0, MAX_ITEMS);

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = sheet_();
    const names = sh.getRange(1, 1, sh.getLastRow(), 1).getValues().map(r => r[0]);
    const row = names.indexOf(name) + 1;
    // Leading apostrophe stops Sheets from treating the JSON as a formula.
    const values = [[name, "'" + JSON.stringify(items), new Date().toISOString()]];
    if (row > 0) sh.getRange(row, 1, 1, 3).setValues(values);
    else sh.appendRow(values[0]);
  } finally {
    lock.releaseLock();
  }
  return json_({ ok: true });
}
