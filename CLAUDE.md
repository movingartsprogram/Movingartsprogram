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
| `/gig-bookings/` | **Ticketing.** Google Apps Script backend (Google Sheet) + Razorpay. Event details come from the Sheet at runtime. |
| `/gigs/` | **Live Music in Goa — Upcoming Gigs.** SEO page built from `/gigs.js`; injects `ItemList` of `MusicEvent`s for Google. In the sitemap. |
| `/gigs.js` | **The one gig list for the site.** Feeds the home LCD billboard, the booking page's "Other gigs coming up" carousel and `/gigs/`. Past gigs drop off by themselves (India date). |
| `/bombay-rock-xchange/` | Gig info & FAQ for the current gig (line-up, gates, parking, food, ages, refunds) + `bombay-rock-xchange.ics` calendar file. FAQPage JSON-LD. Keep it after the gig as an archive page. |
| `/the-feni-trail/` | The Feni Trail: invite-only farm experience at Dudhsagar Plantation with Ouro feni. Animated, SEO-optimised. |
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
   of the file; pictures 480×600, 4:5, ~40–90 KB). That one edit updates the home billboard,
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

Current gig (at time of writing): **Bombay Rock Xchange**, Sun 22 Nov 2026, 8 PM,
Domingos Gazebo, Pedda Road, Varca 403721. Luke Kenny (vocals), Ravi Iyer (guitar),
Saket Rao (drums), Tejal (bass). Early Bird ₹499 (till 22 Oct), General ₹799, Gate ₹1000.
Also on the billboard: **Six String Séance**, Thu 29 Oct 2026, Saltamontes. Elvis Lobo
(guitar), Bobby (vinyls). Halloween-eve "modern baithak" (music, vinyls, magic, stories),
pulp/B-grade horror tribute. Adults only. Tickets at the gate only. Poster:
`six-string-seance-poster.jpg` (900px) and `-sm.jpg` (billboard).
And: **Roll Heads** (from Gangtok, Sikkim), Sun 1 Nov 2026, Guru Bar. Tickets at the gate.
Picture `roll-heads-sm.jpg`.
And: **Elvis Lobo × DJ Voyager**, electronic set, Fri 13 Nov 2026, Wise Fools. Tickets at the
gate only. Photos `elvis-lobo-guitar-sm.jpg` and `dj-voyager-sm.jpg` take turns on its slide.
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
- Every public page has a unique title, description, canonical URL, og and twitter tags,
  and descriptive alt text.
- Home JSON-LD: `WebSite` (site name), `Organization`, Grateful Dead `MusicEvent`
  (14 Feb), the series as `Service`s (including The Feni Trail), and Elvis Lobo as `MusicGroup`.
- Feni Trail JSON-LD: `Event` (SoldOut / invitation only), `BreadcrumbList` and `FAQPage`.
  Target keywords: offbeat Goa, hidden Goa, personalised Goa experience, Goa farm experience,
  cashew feni, Dudhsagar Plantation.
- `sitemap.xml` lists `/`, `/gig-bookings/`, `/the-feni-trail/`, `/elvis-lobo/` and `/policies/`.
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

## Contacts and links used on the site
- WhatsApp: +91 98496 90077 (`wa.me/919849690077`). Email: movingartsp@gmail.com.
- Partners: Dudhsagar Plantation `https://www.dudhsagarplantation.com`, Ouro De Goa `https://ourodegoa.in/`.
- Donations: `razorpay.me/@movingartsprogram`, for art contributions only, **never for tickets**.
