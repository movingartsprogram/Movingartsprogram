/* =====================================================================
   MAP TABLES — table numbers for group bookings (Google Apps Script)

   This is a SEPARATE little script. It is NOT the ticket booking script
   and never changes it. It only READS the Bookings, Tickets, Event and
   Staff tabs of the "MAP Gig Bookings" Sheet, and WRITES one tab of its
   own, called "Tables".

   What it does
   - Every paid booking of 2 or more people (for the gig on the Event tab)
     gets a table number, 1 to 60, in the order people booked.
   - The list lives in the "Tables" tab: Table, Booking ID, Event, Name,
     Mobile, People, Request, Status. Send that tab to the venue.
   - You can change any number in the "Table" column by hand, any time
     (put two bookings on the same table, move someone near the stage).
     The script never changes a row that is already there.
   - The gate scanner (movingartsprogram.com/scan/) asks this script for
     the list and shows "TABLE 7" when it scans a ticket of that booking.

   One-time setup (5 minutes, on a laptop, signed in as movingartsp@gmail.com):
   1. Open  script.new   → name the project "MAP Tables".
   2. Delete what's there, paste this whole file, Save.
   3. Pick "setup" in the function list at the top, press Run, allow access.
      It makes the "Tables" tab and keeps it fresh every 10 minutes.
   4. Deploy → New deployment → type "Web app".
      Execute as: Me.  Who has access: Anyone.  Deploy, copy the /exec address.
   5. Send that address to Claude (it goes into TABLES_URL in scan/index.html).

   Settings you can change below: how many tables, and the smallest group
   that gets one. After changing them: Deploy → Manage deployments →
   pencil → Version: New version → Deploy (the address stays the same).
   ===================================================================== */

var SHEET_ID   = "PASTE_SHEET_ID_HERE";  // the "MAP Gig Bookings" Sheet
var MAX_TABLES = 60;                     // tables are numbered 1 to 60
var MIN_PEOPLE = 2;                      // bookings of 2 or more get a table

var HEAD = ["Table", "Booking ID", "Event", "Name", "Mobile", "People", "Request", "Status"];

/* ---------- run once ---------- */

function setup() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var added = withLock_(function () { return sync_(ss); });
  var trig = ScriptApp.getProjectTriggers();
  for (var i = 0; i < trig.length; i++) {
    if (trig[i].getHandlerFunction() === "autoSync") ScriptApp.deleteTrigger(trig[i]);
  }
  ScriptApp.newTrigger("autoSync").timeBased().everyMinutes(10).create();
  Logger.log("Tables tab is ready. New tables added just now: " + added);
}

/* Runs by itself every 10 minutes. You can also Run it by hand any time. */
function autoSync() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  withLock_(function () { return sync_(ss); });
}

/* ---------- the list ---------- */

/* Adds a row (and a table number) for every paid group booking that is not
   in the Tables tab yet. Rows already there are left exactly as they are,
   except the Status cell, which says CANCELLED if the booking is no longer paid. */
function sync_(ss) {
  var evs = eventCodes_(ss);
  if (!evs.length) return 0;
  var bk = ss.getSheetByName("Bookings");
  if (!bk || bk.getLastRow() < 1) return 0;
  var rows = bk.getRange(1, 1, bk.getLastRow(), 13).getValues();

  var sh = tablesSheet_(ss);
  var last = sh.getLastRow();
  var have = last > 1 ? sh.getRange(2, 1, last - 1, HEAD.length).getDisplayValues() : [];
  var known = {}, used = {}, i;
  for (i = 0; i < have.length; i++) {
    var id0 = trim_(have[i][1]);
    if (id0) known[id0] = i;
    var m = trim_(have[i][0]).match(/\d+/g) || [];       // "12" or "12+13" both count as taken
    for (var k = 0; k < m.length; k++) used[trim_(have[i][2]) + "|" + Number(m[k])] = 1;
  }

  var add = [];
  for (i = 0; i < rows.length; i++) {
    var r = rows[i];
    var ev = trim_(r[2]), id = trim_(r[1]);
    if (!id || evs.indexOf(ev) < 0) continue;
    var paid = /^yes$/i.test(trim_(r[8]));

    if (known.hasOwnProperty(id)) {
      if (known[id] >= 0) {
        var st = trim_(have[known[id]][7]);
        if (!paid && st === "") sh.getRange(known[id] + 2, 8).setValue("CANCELLED");
        else if (paid && st === "CANCELLED") sh.getRange(known[id] + 2, 8).setValue("");
      }
      continue;
    }
    var people = Number(r[5]) || 0;
    var mobile = String(r[4] === null || r[4] === undefined ? "" : r[4]).replace(/\D/g, "");
    if (!paid || people < MIN_PEOPLE || !mobile || /^comp$/i.test(trim_(r[12]))) continue;

    var n = 0;
    for (var t = 1; t <= MAX_TABLES; t++) { if (!used[ev + "|" + t]) { n = t; break; } }
    if (n) used[ev + "|" + n] = 1;
    add.push([n || "", id, ev, trim_(r[3]), mobile, people, trim_(r[7]), n ? "" : "NO TABLE LEFT"]);
    known[id] = -1;
  }

  if (add.length) {
    var at = sh.getLastRow() + 1;
    sh.getRange(at, 5, add.length, 1).setNumberFormat("@");   // mobile numbers stay as typed
    sh.getRange(at, 1, add.length, HEAD.length).setValues(add);
  }
  return add.length;
}

function tablesSheet_(ss) {
  var sh = ss.getSheetByName("Tables");
  if (!sh) sh = ss.insertSheet("Tables");
  if (sh.getLastRow() < 1) {
    sh.getRange(1, 1, 1, HEAD.length).setValues([HEAD]).setFontWeight("bold");
    sh.setFrozenRows(1);
    sh.setColumnWidth(4, 190); sh.setColumnWidth(7, 320);
  }
  return sh;
}

/* The gig(s) on sale: the "Event code" row of the Event tab (column B, and C if there are two gigs). */
function eventCodes_(ss) {
  var sh = ss.getSheetByName("Event"), out = [];
  if (!sh || sh.getLastRow() < 1) return out;
  var v = sh.getRange(1, 1, sh.getLastRow(), Math.max(2, sh.getLastColumn())).getDisplayValues();
  for (var i = 0; i < v.length; i++) {
    if (trim_(v[i][0]).toLowerCase() !== "event code") continue;
    for (var c = 1; c < v[i].length; c++) { var code = trim_(v[i][c]); if (code && out.indexOf(code) < 0) out.push(code); }
  }
  return out;
}

/* ---------- web app: the gate scanner asks for the table list ----------
   ?action=tables&pin=<a PIN from the Staff tab>&ev=<event code>
   Answers  t: ticket code -> table,  b: booking ID -> table.            */

function doGet(e) {
  var p = (e && e.parameter) || {}, out;
  try {
    out = p.action === "tables" ? tables_(p) : { ok: false, reason: "unknown" };
  } catch (err) {
    out = { ok: false, reason: "error", message: String(err) };
  }
  var cb = String(p.callback || "").replace(/[^\w.$]/g, "");
  var body = JSON.stringify(out);
  if (cb) return ContentService.createTextOutput(cb + "(" + body + ");").setMimeType(ContentService.MimeType.JAVASCRIPT);
  return ContentService.createTextOutput(body).setMimeType(ContentService.MimeType.JSON);
}

function tables_(p) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  if (!pinOk_(ss, p.pin)) {
    Utilities.sleep(1500);                 // slows down anyone guessing a PIN
    return { ok: false, denied: true };
  }
  try { withLock_(function () { return sync_(ss); }); } catch (err) { /* still answer from the tab as it is */ }

  var ev = trim_(p.ev), b = {}, t = {}, n = 0;
  var sh = ss.getSheetByName("Tables");
  if (sh && sh.getLastRow() > 1) {
    var v = sh.getRange(2, 1, sh.getLastRow() - 1, HEAD.length).getDisplayValues();
    for (var i = 0; i < v.length; i++) {
      var tb = trim_(v[i][0]), id = trim_(v[i][1]);
      if (!tb || !id) continue;
      if (ev && trim_(v[i][2]) !== ev) continue;
      if (/^cancel/i.test(trim_(v[i][7]))) continue;
      b[id] = tb; n++;
    }
  }
  var tk = ss.getSheetByName("Tickets");
  if (n && tk && tk.getLastRow() > 1) {
    var w = tk.getRange(2, 1, tk.getLastRow() - 1, 2).getDisplayValues();
    for (var j = 0; j < w.length; j++) {
      var code = trim_(w[j][0]).toUpperCase(), bid = trim_(w[j][1]);
      if (code && b.hasOwnProperty(bid)) t[code] = b[bid];
    }
  }
  return { ok: true, ev: ev, n: n, t: t, b: b };
}

/* Only phones with a PIN from the Staff tab get the list. */
function pinOk_(ss, pin) {
  pin = trim_(pin);
  if (!pin) return false;
  var sh = ss.getSheetByName("Staff");
  if (!sh || sh.getLastRow() < 2) return false;
  var v = sh.getRange(2, 2, sh.getLastRow() - 1, 1).getDisplayValues();
  for (var i = 0; i < v.length; i++) { if (trim_(v[i][0]) === pin) return true; }
  return false;
}

/* ---------- helpers ---------- */

function withLock_(fn) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(8000)) return 0;       // another run is already doing it
  try { return fn(); } finally { lock.releaseLock(); }
}

function trim_(s) { return String(s === null || s === undefined ? "" : s).trim(); }
