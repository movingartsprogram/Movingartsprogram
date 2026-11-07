# Moving Arts Program website — working notes for Claude

These notes are for Claude Code sessions working on this repo. Read them before
changing anything. Note: this repo IS the public website, so this file is
publicly viewable at movingartsprogram.com/CLAUDE.md. Never put passwords,
API keys or private guest details in it.

## What this is
- **movingartsprogram.com**: Moving Arts Program (MAP), a pro-bono live music and
  arts platform in Goa founded by Prashant Kumar. The site is **live** and sells gig
  tickets, so every change is treated as sensitive.
- Static HTML on **GitHub Pages** (repo `movingartsprogram/Movingartsprogram`,
  branch `main`). The domain is registered at **GoDaddy** (see `CNAME`).
  `.nojekyll` means files are served as-is.
- A deploy happens automatically about a minute after a merge to `main`
  ("pages build and deployment" Action).

## Pages
| Path | What it is |
|---|---|
| `/` (`index.html`) | Home: Winamp-style "player" UI. The series sections are in-page `#page-*` blocks switched by JS (`showPage`). |
| `/gig-bookings/` | **Ticketing.** Google Apps Script backend (Google Sheet) + Razorpay. Event details come from the Sheet at runtime. Since Nov 2026 (script V4.2): the page keeps a booking on the phone (`localStorage` `map_pending_v1`) while Razorpay is open; if GPay drops the page, it asks the script's `recheck` on return and shows the tickets. Tickets seen on a phone are kept (`map_my_tickets_v1`) in a collapsed "Your tickets on this phone" box. Instagram/Facebook in-app browsers get an "open in Chrome" note. The script's 5-minute timer also asks Razorpay for missed payments, so the Razorpay webhook is deliberately left off. |
| `/gigs/` | **Live Music in Goa — Upcoming Gigs.** SEO page built from `/gigs.js`; injects `ItemList` of `MusicEvent`s for Google. In the sitemap. |
| `/gigs.js` | **The one gig list for the site.** Feeds the home LCD billboard, the booking page's "Other gigs coming up" carousel and `/gigs/`. Past gigs drop off by themselves (India date). |
| `/bombay-rock-xchange/` | Gig info & FAQ for the current gig (line-up, gates, parking, food, ages, refunds) + `bombay-rock-xchange.ics` calendar file. FAQPage JSON-LD. Keep it after the gig as an archive page. |
| `/the-feni-trail/` | The Feni Trail: invite-only farm experience at Dudhsagar Plantation with Ouro feni. Animated, SEO-optimised. Evergreen: the hero is the film ("This is how it goes.", `video/feni-trail-reel.mp4`, poster `img/reel-poster.jpg`), the plan says Saturday/Sunday with no dates. Per edition, change only the closing line, now "See you in the next one." (was "See you in December."; swap the film if there is a new one). |
| `/scratch/` | **Scratch & Win with L74 Cider** (sponsor) for Bombay Rock Xchange. Flow: poster (locked) → "I'm 18 or older" → 2-question quiz (Q1 Luke Kenny first male VJ on Channel [V], True/False; Q2 Ravi Iyer's band, Witch Hammer / Indus Creed). 1 of 2 right = the poster becomes the scratch card; both wrong = "Oops", no card. One quiz try per phone. Then up to 4 cards per phone (device id). Backend: its OWN Google Sheet + Apps Script (`scratch/apps-script.gs`, not the booking script). Quiz answers are in the Sheet's Settings tab ("Answer Q1/Q2"), NOT in the public files. DIWALI UPDATE (7 Nov 2026): prizes are now GRAND PRIZE `TICKET` (only 5 free entry tickets to Bombay Rock Xchange 22 Nov in the whole deck, random), `CIDER`/`CIDER2` L74 cider cocktail (1 in 5), `FREE_ENTRY` = free entry to the next MAP gig, Space Odyssey 3 Dec (1 in 10; card face `scratch/space-odyssey.jpg`); deck 300 cards dealt in blocks of 10 by `dealPrizes_()`; the owner runs `diwaliDeck()` once to re-deal only unscratched cards. Page is themed as a Diwali gift (toran, chips, share image `scratch/og-diwali.jpg`); the `.dw` Diwali bits hide themselves after 15 Nov 2026 (India date). Earlier: 200 cards in blocks of 5, one cider-cocktail win per block at a random spot (the prize is an L74 **Cider Cocktail**, not a bottle; win picture `scratch/l74-cocktail.jpg`, `l74-bottles.jpg` kept for the trivia card); cards handed out in order. Winners give name + WhatsApp number to get a code + QR; "send me the code" opens WhatsApp to MAP with the code. One win per WhatsApp number. Staff check codes at `/scratch/?check=CODE` with the PIN in Settings. `SCRIPT_URL` is set to the owner's "Scratch Card" Sheet web app (deployed 5 Nov 2026; after changing the script: Deploy → Manage deployments → edit → New version, so the URL stays). Empty `SCRIPT_URL` or `?demo=1` = PREVIEW mode (`?lose=1` / `?win=1` for testing). Below the card: trivia, a "Live music in Goa" list built from `/gigs.js` (no extra event data, that stays on `/gigs/`), and a visible FAQ that must match its FAQPage JSON-LD word for word. `POSTER` in the page uses `?v=28`: bump it with the Sheet poster version if the poster changes. Linked from `/bombay-rock-xchange/` and the white "🎁 SCRATCH & WIN" chip above POLICIES on the home LCD (the side column's gaps were tightened so `.wa-top-row` stays 179px). Top of the page: "← MAP HOME" and "UPCOMING GIGS" links. In the sitemap. After the gig: set Settings → Open to No; decide whether to keep the page. |
| `/elvis-lobo/` | Elvis Lobo ("The Boss") story and video archive. |
| `/policies/` | Terms, privacy, refunds, pricing and contact (required by Razorpay). |
| `/scan/` | Private ticket-scanning tool. `noindex`; leave it alone. |
| `404.html` | `noindex`. |

Sibling repos (separate GitHub Pages sites): `The-feni-trail-`, `Invitation-feni-trail-`,
`Feni-trail-guest-action-` (guest action is `noindex`). The owner chose to leave
the first two as they are.

## Golden rules
1. **Never change booking logic** in `gig-bookings/index.html`: scripts, the Apps Script
   calls, Razorpay, seats or ticket flow. Only touch it when explicitly asked. If you
   must, prefer inert additions (for example a JSON-LD block in `<head>`), then
   compare live vs new in a browser (visible text, buttons, JS globals, network
   requests must be identical, 0 JS errors).
2. **Branch → PR → merge only after the owner says "yes, merge".** Before merging,
   confirm `main` hasn't moved since testing, merge with `expectedHeadSha`, then
   wait for the Pages deploy to finish and ask the owner to check on their phone.
3. **Never delete or rename an image or file that the live site uses in the same change
   that stops using it.** Phones keep the old page cached for about 10 minutes and will
   request the old file (this broke the Feni Trail night section once). Keep old files;
   clean up much later if at all.
4. **Test before pushing**: serve locally (`python3 -m http.server`), check in
   Chromium (Playwright, `executablePath: /opt/pw-browsers/chromium`) at 320, 375 and
   390px and desktop: no sideways scroll, no JS errors, no 404s. The Sheet, Google
   Fonts and GA can't be reached from the sandbox; that's expected.
5. Keep the look: phosphor green `--phos #7CFC00`, magenta `--mag #ff2fb0`,
   VU yellow `--vu #ffe135`, gold `#c9a648`, clay/pill shapes. Respect
   `prefers-reduced-motion`.
6. The owner is non-technical and often on a phone. Explain plainly, show
   screenshots or short videos, keep replies short.

## Per new gig (checklist)
1. Owner sends the new poster. **Compress it**: 900×1125 (4:5), JPEG quality ~82,
   progressive, about 160 KB. Save it as `gig-bookings/current-event-poster.jpg` (same name).
2. Update the **MusicEvent JSON-LD** block in the `<head>` of `gig-bookings/index.html`
   (name, `startDate` with `+05:30`, venue address, performers, offers/prices, dates).
   Remove it once the gig is over so Google never shows an old event.
   Also update the **`SLOW`** block in the page script: `posterVersion` (same number as
   the Sheet's Poster version) and `until` (gig day). If the Sheet hasn't answered after
   20 seconds (`NET_WAIT`), the page shows the poster with a walking 🐢 under it and "YOUR INTERNET
   IS SLOW. HAVE PATIENCE — IT'S LOADING…", and keeps retrying. Nothing else: no details, prices,
   buttons or WhatsApp (owner's choice).
   **Add every gig (online or at the gate) to `/gigs.js`** (fields are documented at the top
   of the file; pictures go in `/gigs/img/` at 240×300, 4:5, ~15–25 KB: they show as small
   thumbnails, so bigger files only slow phones down). That one edit updates the home billboard,
   the booking page's "Other gigs coming up" carousel (gigs with `tickets:"gate"` only) and
   the `/gigs/` page with its Google event data. Nothing to remove after a gig.
   Also update the booking page's **share preview** (`<title>`, description, og/twitter
   title, description and image alt) and the **Add to calendar** links on the ticket screen.
   The home **GIG BILLBOARD** (`#gigBoard`, inside the LCD) is built from `/gigs.js`: slides
   cross-fade every 4.5 s, countdown sticker on the picture, BOOK NOW only for online gigs,
   `star:true` adds the pink "GIG OF THE YEAR" and glow. It fills only the LCD's leftover space,
   so the panel must never get taller: check `.wa-top-row` height old vs new at 320–1280px with
   the real fonts. Owner's choice: no banner below the player; the old dot-matrix scrolling text
   was removed (its JS is kept but inert). Make a gig info/FAQ page like `/bombay-rock-xchange/`
   (ask the owner for gate time, parking, food, ages) and add it to `sitemap.xml`.
3. Tell the owner to **increase "Poster version"** in the Google Sheet's Event tab
   (the page loads `current-event-poster.jpg?v=<posterVersion>`), so phones fetch the new poster.
4. Update `sitemap.xml` `lastmod` for `/gig-bookings/` and remind the owner to
   *Request indexing* for it in Search Console.

Current gig (at time of writing): **Bombay Rock Xchange**, Sun 22 Nov 2026, gates 7 PM, music 7:30 PM,
Domingos Gazebo, Pedda Road, Varca 403721. Luke Kenny (vocals), Ravi Iyer (guitar),
Saket Rao (drums), Tejal Varadkar (bass). Opening acts (added 30 Oct): Kamikaze (band of
12-year-olds; on the site by first names only, owner's choice), Cream π and Zahaan (11-year-old
drummer, solo on "In the Flesh"). ₹799 online, Gate ₹1000 (Early Bird ₹499 ended
22 Oct and was removed from the site). Poster version 28 (30 Oct, final): the red/yellow/blue full line-up poster
(Luke, Ravi, Kamikaze, Zahaan, Cream π; "7 PM onwards", ₹799 / ₹1000 at gate), 900×1125 at q70
(~186 KB: its photos and small text don't compress further without blur). Elvis Lobo was taken off the
22 Nov poster and text on 23 Oct because he may not make it; add him back only if the owner says.
Also on the billboard: **Six String Séance**, Thu 29 Oct 2026, Saltamontes. Elvis Lobo
(guitar), Bobby (vinyls). Halloween-eve "modern baithak" (music, vinyls, magic, stories),
pulp/B-grade horror tribute. Adults only. Tickets at the gate only. Poster:
`six-string-seance-poster.jpg` (900px) and `-sm.jpg` (billboard).
And: **Roll Heads** (from Gangtok, Sikkim), Sun 1 Nov 2026, Guru Bar. Tickets at the gate.
Picture `roll-heads-sm.jpg`.
The **Elvis Lobo × DJ Voyager** gig (13 Nov, Wise Fools) was cancelled and removed on 23 Oct;
its pictures are kept on purpose.
And: **Bombay Rock Xchange at Saltamontes, Anjuna**, Sat 21 Nov 2026, featuring Ravi Iyer & Luke
Kenny, first time in Goa. Tickets at the gate only (also on the FAQ page).
Towns: Saltamontes and Guru Bar are in Anjuna.
And: **The Feni Trail, 2nd edition**, Sun 29 Nov 2026, Dudhsagar Plantation (in `/gigs.js` with
`tickets:"invite"`, which shows "✉ BY INVITATION" everywhere and has no price; Google type `Event`).
Thumbnail `gigs/img/the-feni-trail.jpg` is cut from the 1st-edition group photo until the owner sends the
2nd-edition poster. The Feni Trail page closing line is now "See you on 29 November."
And: **Space Odyssey**, Thu 3 Dec 2026, Saltamontes, Anjuna: space-themed party, Elvis Lobo (guitar)
"for the first time with DJ Voyager", DJ Lorenz, powered by Ouro feni. Tickets at the gate, ₹300, 8 PM
(confirmed by the owner 5 Nov). Pictures `space-odyssey.jpg` + `elvis-lobo-guitar.jpg`.
Only 22 Nov is booked online. Its slide has `.bb-star`: a pink "★ GIG OF THE YEAR ★"
kicker and a pulsing glow while it's showing.

## Images and speed
- Images live as separate files, never embedded in the HTML. Feni Trail images are in
  `the-feni-trail/img/`, with **WebP** copies served via `<picture>` (JPG/PNG fallback)
  and `image-set()` for CSS backgrounds.
- Below-the-fold images use `loading="lazy"`, except the Feni night-section cut-outs
  (`night-bg`, `moon`, `scorpion`). Those load eagerly with `fetchpriority="low"`,
  because lazy loading inside animated, absolutely positioned layers failed on iOS.
- `the-feni-trail/img/night.jpg` is no longer used, but is kept on purpose for old cached pages.
- Elvis page photos (`elvis-lobo/elvis-lobo-photos/photos/`) also have WebP copies: thumbnails via
  `<picture>`, the full-size lightbox picks `.webp` when the browser decodes it and falls back to the `.jpg`.
  Keep both formats when adding photos.

## SEO
- Every public page has a unique title, description (keep under ~155 characters so Google
  shows it whole), canonical URL, og and twitter tags, and descriptive alt text.
- Home JSON-LD: `WebSite` (site name), `Organization`, Grateful Dead `MusicEvent`
  (14 Feb), the series as `Service`s (including The Feni Trail), and Elvis Lobo as `MusicGroup`.
- Feni Trail JSON-LD: `TouristTrip` (no dates, invitation only), `VideoObject` (the film), `BreadcrumbList` and `FAQPage`.
  Target keywords: offbeat Goa, hidden Goa, personalised Goa experience, Goa farm experience,
  cashew feni, Dudhsagar Plantation.
- `sitemap.xml` lists `/`, `/gig-bookings/`, `/gigs/`, `/bombay-rock-xchange/`, `/scratch/`, `/the-feni-trail/`,
  `/elvis-lobo/` and `/policies/`. `/gigs/` targets "live music in Goa" and injects MusicEvent data
  from `/gigs.js`; `/bombay-rock-xchange/` has FAQPage data.
  Update `lastmod` whenever a page changes, and add new public pages.
- Google Search Console property exists (owner verified). Google can't be asked to
  "Request indexing" by any tool; the owner does that by hand on a laptop.
- `82fb14a332eb444aaced508b42d8593b.txt` is the IndexNow key file (Bing/Yandex). Keep it.
- **Automatic Bing ping:** `.github/workflows/indexnow.yml` runs on every push to `main`
  (except CLAUDE.md-only changes). It waits for the Pages deploy of that commit, then
  sends every URL in `sitemap.xml` to IndexNow. So keep `sitemap.xml` complete: new
  public pages must be added there to be pinged. It can also be run by hand from the
  Actions tab ("Run workflow"). Bing Webmaster Tools is set up (imported from Search Console).

## Analytics
GA4 `G-JMXNSRJPDD` is on every public page. Custom events include `booking_page_click`,
`feni_trail_click`, `feni_next_interest` (WhatsApp interest button), `partner_click`
(Ouro / Dudhsagar), `donate_click`, `social_click` and `page_view` per home section.
Added Oct 2026: `billboard_book_click` (home LCD billboard), `booking_slow_note_shown` (the 🐢 slow
-internet message on the booking page appeared), `add_to_calendar`, `more_gigs_all`, `gigs_book_click`,
`gigs_home_click`, `gig_faq_book`, `gig_faq_map`, `gig_faq_home_click`, `email_click`, `feni_reel_play` (Feni Trail film started).
Added Nov 2026 (booking page): `booking_payment_wait` (checking a payment after GPay), `my_tickets_open`,
`inapp_browser_seen`, `inapp_open_chrome`.
Added Nov 2026 (`/scratch/`): `scratch_start`, `scratch_quiz` (right: 0–2), `scratch_quiz_fail`, `scratch_reveal`, `scratch_claim`,
`scratch_whatsapp`, `scratch_redeem`, `scratch_gig_click`, `scratch_nav`, `scratch_book_click`, `scratch_link` (from the gig FAQ page).

## Contacts and links used on the site
- WhatsApp: +91 98496 90077 (`wa.me/919849690077`). Email: movingartsp@gmail.com.
- Partners: Dudhsagar Plantation `https://www.dudhsagarplantation.com`, Ouro De Goa `https://ourodegoa.in/`.
- Donations: `razorpay.me/@movingartsprogram`, for art contributions only, **never for tickets**.
