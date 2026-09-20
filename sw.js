'use strict';

/* عامل الخدمة: يخزّن كل ملفات التطبيق ليعمل دون إنترنت بالكامل */
const CACHE_NAME = 'umrah-companion-v4';
const urlsToCache = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json'
];

// تثبيت: تخزين الملفات الأساسية
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// تفعيل: حذف النسخ القديمة من الكاش
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// الجلب: الكاش أولاً، ثم الشبكة، مع رجوع للصفحة الرئيسية عند تعذّر التنقّل دون إنترنت
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).catch(() => {
        // عند فشل الشبكة لطلبات التنقّل، أعِد الصفحة الرئيسية المخزّنة
        if (req.mode === 'navigate') {
          return caches.match('./index.html');
        }
        return Response.error();
      });
    })
  );
});
