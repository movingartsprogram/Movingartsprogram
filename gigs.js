/* ══════════════════════════════════════════════════════════════════════
   MAP GIGS — the ONE list of upcoming gigs for the whole website.

   Change a gig here and it updates, by itself:
     • the billboard in the home page LCD            (/)
     • "Other gigs coming up" on the booking page    (/gig-bookings/)
     • the Live Music in Goa page                    (/gigs/)
       which also tells Google about each gig (MusicEvent data).

   A gig disappears everywhere the day after its date (India time), so
   nothing needs removing after a gig. Keep the list in date order.

   Fields
     id        short-name-with-dashes, unique (used in links: /gigs/#id)
     name      gig title
     date      "YYYY-MM-DD" (India date)
     time      "HH:MM" 24h start time, or "" if not announced
     venue     venue name;  area: town/village if known, else ""
     who       short line-up for the billboard (keep it under ~20 letters)
     lineup    [{name, role}] full line-up
     blurb     one or two sentences about the night
     adults    true if 18+ only
     tickets   "online" (booked on /gig-bookings/) or "gate" (pay at the gate)
     price     optional text, e.g. "₹499 early bird · ₹799 · ₹1000 at the gate"
     lowPrice, highPrice   optional numbers in ₹, for Google (online gigs)
     star      true for the headline gig (glow + "GIG OF THE YEAR")
     images    1 or 2 pictures, 480×600 (4:5). Two pictures take turns.
     info      optional link to a gig info / FAQ page
   ══════════════════════════════════════════════════════════════════════ */
window.MAP_GIGS = [
  {
    id: "six-string-seance",
    name: "Six String Séance",
    date: "2026-10-29", time: "",
    venue: "Saltamontes", area: "",
    who: "Elvis Lobo & Bobby",
    lineup: [{name: "Elvis Lobo", role: "six strings"}, {name: "Bobby", role: "vinyls"}],
    blurb: "A modern-day baithak over music, vinyls, magic and stories (dirty or laundry-clean), all of us sitting in one big circle. It's Halloween eve, so expect horror: avant-garde, B-grade, a tribute to pulp horror.",
    adults: true,
    tickets: "gate",
    images: ["/six-string-seance-poster-sm.jpg"]
  },
  {
    id: "roll-heads",
    name: "Roll Heads",
    date: "2026-11-01", time: "",
    venue: "Guru Bar", area: "",
    who: "From Gangtok, Sikkim",
    lineup: [{name: "Roll Heads", role: "band from Gangtok, Sikkim"}],
    blurb: "The band from Gangtok, Sikkim, live in Goa.",
    tickets: "gate",
    images: ["/roll-heads-sm.jpg"]
  },
  {
    id: "elvis-lobo-dj-voyager",
    name: "Elvis Lobo × DJ Voyager",
    date: "2026-11-13", time: "",
    venue: "Wise Fools", area: "",
    who: "Electronic set",
    lineup: [{name: "Elvis Lobo", role: "guitar"}, {name: "DJ Voyager", role: "decks"}],
    blurb: "An electronic set: Elvis Lobo's guitar meets DJ Voyager on the decks.",
    tickets: "gate",
    images: ["/elvis-lobo-guitar-sm.jpg", "/dj-voyager-sm.jpg"]
  },
  {
    id: "bombay-rock-xchange",
    name: "Bombay Rock Xchange",
    date: "2026-11-22", time: "20:00",
    venue: "Domingos Gazebo", area: "Varca",
    who: "Luke Kenny & band",
    lineup: [{name: "Luke Kenny", role: "vocals"}, {name: "Ravi Iyer", role: "guitar"},
             {name: "Saket Rao", role: "drums"}, {name: "Tejal", role: "bass"}],
    blurb: "Classic rock and Bollywood on their first Goa tour. The biggest gig of the year.",
    tickets: "online",
    price: "₹499 early bird (till 22 Oct) · ₹799 general · ₹1000 at the gate",
    lowPrice: 499, highPrice: 1000,
    star: true,
    images: ["/gig-bookings/current-event-poster.jpg?v=25"],
    info: "/bombay-rock-xchange/"
  }
];

/* ── helpers shared by the pages (no need to edit below) ── */
window.MAP_GIGS_TODAY = function(){
  try{ return new Date().toLocaleDateString("en-CA", {timeZone: "Asia/Kolkata"}); }
  catch(e){ return new Date(Date.now() + 19800000).toISOString().slice(0, 10); }
};
/* Upcoming gigs only (today included), each with .days to go and .day label like "THU 29 OCT". */
window.MAP_GIGS_UPCOMING = function(){
  var today = window.MAP_GIGS_TODAY(), out = [];
  var D = ["SUN","MON","TUE","WED","THU","FRI","SAT"], M = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  (window.MAP_GIGS || []).forEach(function(g){
    if(!g || !g.date || g.date < today) return;
    var t = Date.parse(g.date + "T00:00:00Z"), dt = new Date(t);
    var copy = {}; for(var k in g) copy[k] = g[k];
    copy.days = Math.round((t - Date.parse(today + "T00:00:00Z")) / 86400000);
    copy.day = D[dt.getUTCDay()] + " " + dt.getUTCDate() + " " + M[dt.getUTCMonth()];
    copy.countdown = copy.days > 1 ? copy.days + " DAYS" : (copy.days === 1 ? "TOMORROW" : "TONIGHT!");
    out.push(copy);
  });
  out.sort(function(a, b){ return a.date < b.date ? -1 : (a.date > b.date ? 1 : 0); });
  return out;
};
