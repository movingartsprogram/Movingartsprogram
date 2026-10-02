/* MAP GATE — offline helper (service worker).
   Saves the scan page on the phone so it opens with no signal at all.
   It deliberately does NOT touch the booking system: every call to the
   Google Apps Script goes straight to the network, never from a cache. */
var VERSION = "map-gate-v2";
var HOSTS = ["cdn.jsdelivr.net", "unpkg.com", "fonts.googleapis.com", "fonts.gstatic.com"];
var CDN_FILES = ["https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js"];

self.addEventListener("install", function(e){
  e.waitUntil((async function(){
    var c = await caches.open(VERSION);
    await c.add(new Request("./", {cache: "reload"}));            /* the page itself — must succeed */
    try{ await c.add(new Request("manifest.webmanifest", {cache: "reload"})); }catch(x){}
    for(var i = 0; i < CDN_FILES.length; i++){                     /* camera-reading library */
      try{ var r = await fetch(new Request(CDN_FILES[i], {mode: "no-cors"})); await c.put(CDN_FILES[i], r); }catch(x){}
    }
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", function(e){
  e.waitUntil((async function(){
    var keys = await caches.keys();
    for(var i = 0; i < keys.length; i++){
      if(keys[i].indexOf("map-gate-") === 0 && keys[i] !== VERSION) await caches.delete(keys[i]);
    }
    await self.clients.claim();
  })());
});

/* The page: show the saved copy instantly, and quietly fetch a fresh one for next time. */
async function shell(e){
  var cache = await caches.open(VERSION);
  var cached = await cache.match("./");
  var refresh = fetch(new Request("./", {cache: "no-cache"})).then(function(r){
    if(r && r.ok){ return cache.put("./", r.clone()).then(function(){ return r; }); }
    return r;
  }).catch(function(){ return null; });
  if(cached){ e.waitUntil(refresh); return cached; }
  var r = await refresh;
  return r || new Response("MAP Gate is not saved on this phone yet. Open this page once with signal.",
    {status: 503, headers: {"Content-Type": "text/plain"}});
}

/* Other files in /scan/ (the manifest): saved copy first, refreshed in the background. */
async function swr(req, e){
  var cache = await caches.open(VERSION);
  var hit = await cache.match(req);
  var net = fetch(req).then(function(r){ if(r && r.ok){ cache.put(req, r.clone()); } return r; }).catch(function(){ return null; });
  if(hit){ e.waitUntil(net); return hit; }
  return (await net) || Response.error();
}

/* Camera library and fonts: saved copy first, fetched once if missing. */
async function cacheFirst(req){
  var cache = await caches.open(VERSION);
  var hit = await cache.match(req);
  if(hit) return hit;
  try{
    var r = await fetch(req);
    if(r && (r.ok || r.type === "opaque")) cache.put(req, r.clone());
    return r;
  }catch(x){ return Response.error(); }
}

self.addEventListener("fetch", function(e){
  var req = e.request;
  if(req.method !== "GET") return;
  var url = new URL(req.url);
  if(url.origin === location.origin){
    if(req.mode === "navigate"){ e.respondWith(shell(e)); return; }
    if(url.pathname.indexOf("/scan/") === 0){ e.respondWith(swr(req, e)); return; }
    return;
  }
  if(HOSTS.indexOf(url.hostname) >= 0){ e.respondWith(cacheFirst(req)); return; }
  /* everything else — including script.google.com — is left alone and goes straight to the network */
});
