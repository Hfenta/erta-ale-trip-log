// sw.js — Erta Ale Trip Log service worker
// Network-first with cache fallback. Pre-caches the app shell on install
// so the live URL loads offline on every visit after the first one.
// Browsers refuse to register service workers from blob: URLs, which is
// why this lives as a separate file alongside index.html.

var CACHE_NAME = 'erta-ale-v1';
var APP_SHELL = ['./', './index.html'];

self.addEventListener('install', function(e){
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(APP_SHELL).catch(function(){});
    })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE_NAME; })
            .map(function(k){ return caches.delete(k); })
      );
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e){
  if(e.request.method !== 'GET') return;
  e.respondWith(
    caches.open(CACHE_NAME).then(function(cache){
      return fetch(e.request).then(function(res){
        if(res && res.status === 200 && res.type !== 'opaque'){
          cache.put(e.request, res.clone());
        }
        return res;
      }).catch(function(){
        return cache.match(e.request).then(function(match){
          return match || cache.match('./index.html') || cache.match('./');
        });
      });
    })
  );
});
