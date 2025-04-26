"use strict";
const CACHE_NAME = 'pwa-cache-v15';

const urlsToCache = [
    '/',
    '/offline/',
    'https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
];

self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache:', CACHE_NAME);
                return Promise.allSettled(
                    urlsToCache.map(url => {
                        return cache.add(url).catch(error => {
                            console.error(`Failed to cache ${url}:`, error);
                        });
                    })
                );
            })
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        Promise.all([
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames
                        .filter(cacheName => cacheName.startsWith('pwa-cache-'))
                        .filter(cacheName => cacheName !== CACHE_NAME)
                        .map(cacheName => {
                            console.log('Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        })
                );
            }),
            self.clients.claim()
        ])
    );
});

self.addEventListener('fetch', event => {
    const requestUrl = event.request.url;

    if (requestUrl.includes('manifest.json')) {
        console.log('🔄 Fetching manifest fresh:', requestUrl);
        event.respondWith(fetch(event.request));
        return;
    }

    if (!requestUrl.startsWith(self.location.origin) &&
        !requestUrl.includes('googleapis.com') &&
        !requestUrl.includes('cdnjs.cloudflare.com')) {
        return;
    }

    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(() => caches.match('/offline/'))
        );
        return;
    }

    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) {
                return cachedResponse;
            }

            return fetch(event.request).then(response => {
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }

                const responseToCache = response.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, responseToCache);
                });

                return response;
            }).catch(error => {
                console.error('Fetch failed:', error);

                if (requestUrl.match(/\.(jpg|jpeg|png|gif|svg)$/)) {
                    return caches.match('/static/images/placeholder.png');
                }
            });
        })
    );
});
