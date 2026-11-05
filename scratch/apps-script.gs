/* =====================================================================
   L74 Cider × Moving Arts Program — Scratch & Win (Google Apps Script)

   This is the "brain" behind movingartsprogram.com/scratch/.
   It lives in its OWN Google Sheet (not the ticket booking Sheet), so it
   can never touch ticketing.

   One-time setup (5 minutes, on a laptop):
   1. sheets.new  → name it "L74 Scratch Cards".
   2. Extensions → Apps Script. Delete what's there, paste this whole file, Save.
   3. Pick "setupDeck" in the function list at the top, press Run, allow access.
      It makes three tabs: Cards (the 200 cards, shuffled), People, Settings.
   4. Deploy → New deployment → type "Web app".
      Execute as: Me.  Who has access: Anyone.  Deploy, copy the /exec address.
   5. Send that address to Claude (or paste it into SCRIPT_URL in scratch/index.html).

   Settings tab (change any time, no redeploy needed):
     Open          Yes / No   (No = nobody can scratch)
     Staff PIN     the PIN your gate staff type to check winning codes
     Max per person 4
   ===================================================================== */

var TOTAL_CARDS   = 200;  // must be a multiple of 5
var BLOCK         = 5;    // one drink win in every 5 cards
var TWO_CIDER_WINS = 8;   // of the 40 drink wins, how many are "2 ciders"
var FREE_ENTRY_WINS = 5;  // "next gig entry free" cards (spread over the deck)

var PRIZES = {
  ONE_MORE:   "Scratch one more",
  BAD_LUCK:   "Bad luck, try one more",
  FREE_ENTRY: "Next gig entry free",
  CIDER:      "You have won an L74 Cider",
  CIDER2:     "You have won 2 L74 Ciders"
};
var WINS = { FREE_ENTRY: 1, CIDER: 1, CIDER2: 1 };

/* ---------- setup ---------- */

function setupDeck() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var cards = sheet_(ss, "Cards");
  if (cards.getLastRow() > 1) {
    throw new Error("The Cards tab already has cards. Delete the Cards tab first if you really want a new deck.");
  }
  cards.clear();
  cards.appendRow(["No", "Block", "Prize", "Code", "Status", "Name", "Phone", "Device", "Scratched at", "Redeemed at"]);
  cards.setFrozenRows(1);
  addCards_(cards, TOTAL_CARDS, 0);

  var people = sheet_(ss, "People");
  people.clear();
  people.appendRow(["Phone", "Name", "Scratches", "Won", "First", "Last"]);
  people.setFrozenRows(1);

  var st = sheet_(ss, "Settings");
  st.clear();
  st.getRange(1, 1, 4, 2).setValues([
    ["Setting", "Value"],
    ["Open", "Yes"],
    ["Staff PIN", String(1000 + Math.floor(Math.random() * 9000))],
    ["Max per person", 4]
  ]);
  st.setColumnWidth(1, 160);
}

/* Run this if all cards are used and you want 200 more (same rules). */
function addMoreCards() {
  var cards = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Cards");
  addCards_(cards, TOTAL_CARDS, cards.getLastRow() - 1);
}

function addCards_(sheet, total, startNo) {
  var blocks = total / BLOCK, drink = [], other = [], i;
  for (i = 0; i < blocks; i++) drink.push(i < TWO_CIDER_WINS ? "CIDER2" : "CIDER");
  shuffle_(drink);
  var nOther = total - blocks;
  for (i = 0; i < nOther; i++) {
    if (i < FREE_ENTRY_WINS) other.push("FREE_ENTRY");
    else other.push(i % 2 ? "ONE_MORE" : "BAD_LUCK");
  }
  shuffle_(other);

  var used = {}, rows = [], o = 0;
  for (var b = 0; b < blocks; b++) {
    var winAt = Math.floor(Math.random() * BLOCK);   // where in these 5 the drink sits
    for (var k = 0; k < BLOCK; k++) {
      var p = (k === winAt) ? drink[b] : other[o++];
      var no = startNo + b * BLOCK + k + 1;
      rows.push([no, Math.floor((no - 1) / BLOCK) + 1, p, newCode_(used), "", "", "", "", "", ""]);
    }
  }
  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
}

/* ---------- web app ---------- */

function doGet(e) {
  var p = e.parameter || {}, out;
  try {
    if (p.action === "scratch") out = scratch_(p);
    else if (p.action === "status") out = status_(p);
    else if (p.action === "check") out = check_(p, false);
    else if (p.action === "redeem") out = check_(p, true);
    else out = { ok: false, reason: "unknown" };
  } catch (err) {
    out = { ok: false, reason: "error", message: String(err) };
  }
  var cb = String(p.callback || "").replace(/[^\w.$]/g, "");
  var body = JSON.stringify(out);
  if (cb) {
    return ContentService.createTextOutput(cb + "(" + body + ");").setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(body).setMimeType(ContentService.MimeType.JSON);
}

function scratch_(p) {
  var phone = phone_(p.phone), name = String(p.name || "").trim().slice(0, 40);
  var device = String(p.device || "").slice(0, 40);
  if (!phone || !name) return { ok: false, reason: "details" };
  if (p.adult !== "1") return { ok: false, reason: "age" };

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var set = settings_(ss);
    if (!set.open) return { ok: false, reason: "closed" };

    var cards = ss.getSheetByName("Cards");
    var data = cards.getRange(2, 1, cards.getLastRow() - 1, 10).getValues();
    var mine = 0, byDevice = 0, won = null, next = -1;
    for (var i = 0; i < data.length; i++) {
      var r = data[i];
      if (r[4] === "") { if (next < 0) next = i; continue; }
      var samePhone = String(r[6]) === phone;
      if (samePhone) { mine++; if (WINS[r[2]]) won = r; }
      if (device && r[7] === device) byDevice++;
    }
    if (won) return { ok: false, reason: "won", card: cardOut_(won, device) };
    if (mine >= set.max || byDevice >= set.max) return { ok: false, reason: "limit", left: 0 };
    if (next < 0) return { ok: false, reason: "gone" };

    var now = new Date();
    var row = data[next];
    row[4] = "Scratched"; row[5] = name; row[6] = phone; row[7] = device; row[8] = now;
    cards.getRange(next + 2, 1, 1, 10).setValues([row]);
    cards.getRange(next + 2, 7).setNumberFormat("@").setValue(phone);
    person_(ss, phone, name, !!WINS[row[2]], now);

    var left = WINS[row[2]] ? 0 : set.max - mine - 1;
    return { ok: true, card: cardOut_(row, device), left: Math.max(0, left), n: mine + 1, max: set.max };
  } finally {
    lock.releaseLock();
  }
}

function status_(p) {
  var phone = phone_(p.phone), device = String(p.device || "");
  if (!phone) return { ok: false, reason: "details" };
  var ss = SpreadsheetApp.getActiveSpreadsheet(), set = settings_(ss);
  var cards = ss.getSheetByName("Cards");
  var data = cards.getRange(2, 1, cards.getLastRow() - 1, 10).getValues();
  var list = [], won = null;
  for (var i = 0; i < data.length; i++) {
    if (String(data[i][6]) === phone) { list.push(cardOut_(data[i], device)); if (WINS[data[i][2]]) won = cardOut_(data[i], device); }
  }
  return { ok: true, open: set.open, cards: list, won: won, left: won ? 0 : Math.max(0, set.max - list.length), max: set.max };
}

function check_(p, redeem) {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), set = settings_(ss);
  if (String(p.pin || "") !== set.pin) return { ok: false, reason: "pin" };
  var code = String(p.code || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!code) return { ok: false, reason: "nocode" };
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var cards = ss.getSheetByName("Cards");
    var data = cards.getRange(2, 1, cards.getLastRow() - 1, 10).getValues();
    for (var i = 0; i < data.length; i++) {
      var r = data[i];
      if (String(r[3]).replace(/[^A-Z0-9]/g, "") !== code) continue;
      if (r[4] === "" || !WINS[r[2]]) return { ok: false, reason: "notwin" };
      var res = { ok: true, prize: r[2], label: PRIZES[r[2]], name: r[5], code: r[3],
                  redeemed: r[9] ? fmt_(r[9]) : "" };
      if (redeem && !r[9]) {
        cards.getRange(i + 2, 10).setValue(new Date());
        cards.getRange(i + 2, 5).setValue("Redeemed");
        res.justRedeemed = true;
      }
      return res;
    }
    return { ok: false, reason: "notfound" };
  } finally {
    lock.releaseLock();
  }
}

/* ---------- helpers ---------- */

/* The winning code is only sent back to the phone that scratched it,
   so typing someone else's number never shows their code. */
function cardOut_(r, device) {
  var win = !!WINS[r[2]];
  var mine = device === undefined || (device && r[7] === device);
  return { no: r[0], prize: r[2], label: PRIZES[r[2]], win: win, code: win && mine ? r[3] : "",
           redeemed: r[9] ? true : false };
}

function person_(ss, phone, name, won, now) {
  var sh = ss.getSheetByName("People");
  var last = sh.getLastRow();
  if (last > 1) {
    var phones = sh.getRange(2, 1, last - 1, 1).getDisplayValues();
    for (var i = 0; i < phones.length; i++) {
      if (phones[i][0] === phone) {
        var rg = sh.getRange(i + 2, 3, 1, 4), v = rg.getValues()[0];
        rg.setValues([[Number(v[0] || 0) + 1, won ? "Yes" : v[1], v[2], now]]);
        return;
      }
    }
  }
  sh.appendRow(["'" + phone, name, 1, won ? "Yes" : "", now, now]);
}

function settings_(ss) {
  var v = ss.getSheetByName("Settings").getRange(2, 2, 3, 1).getDisplayValues();
  return { open: /^y/i.test(v[0][0]), pin: String(v[1][0]).trim(), max: Number(v[2][0]) || 4 };
}

function sheet_(ss, name) { return ss.getSheetByName(name) || ss.insertSheet(name); }

function phone_(s) {
  var d = String(s || "").replace(/\D/g, "");
  return d.length >= 10 ? d.slice(-10) : "";
}

function newCode_(used) {
  var abc = "ABCDEFGHJKMNPQRSTUVWXYZ23456789", c;
  do {
    c = "L74-";
    for (var i = 0; i < 5; i++) c += abc.charAt(Math.floor(Math.random() * abc.length));
  } while (used[c]);
  used[c] = 1;
  return c;
}

function shuffle_(a) {
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

function fmt_(d) {
  return Utilities.formatDate(new Date(d), "Asia/Kolkata", "d MMM, h:mm a");
}
