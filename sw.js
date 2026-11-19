/**
 * TeenVoca AI – Service Worker (PWA)
 *
 * Chiến lược:
 *  - Tệp của ứng dụng (HTML, JS, CSS, biểu tượng): ƯU TIÊN MẠNG (luôn lấy bản mới nhất khi có mạng),
 *    hết 4 giây hoặc mất mạng thì dùng bản đã lưu -> mở được app khi offline, không bị kẹt bản cũ.
 *  - Thư viện CDN có số phiên bản cố định (GSAP, SheetJS, Firebase SDK) và Google Fonts:
 *    dùng bản đã lưu ngay, đồng thời cập nhật ngầm (stale-while-revalidate).
 *  - KHÔNG can thiệp Firebase Realtime Database, Gemini API và mọi yêu cầu không phải GET
 *    (dữ liệu học sinh luôn đi thẳng tới máy chủ; khi offline do Firebase SDK tự xếp hàng).
 *
 * Chỉ cần tăng CACHE_VERSION khi thay đổi danh sách tệp hoặc logic của chính file này.
 */
'use strict';

const CACHE_VERSION = 'v1';
const APP_CACHE = `teenvoca-app-${CACHE_VERSION}`;
const CDN_CACHE = `teenvoca-cdn-${CACHE_VERSION}`;
const NETWORK_TIMEOUT_MS = 4000;

const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/style.css',
  './js/firebase-config.js',
  './js/data.js',
  './js/holland-engine.js',
  './js/tree-svg-animator.js',
  './js/ai-agents.js',
  './js/project-assessment.js',
  './js/career-games.js',
  './js/teacher-analytics.js',
  './js/app.js',
  './js/pwa.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png'
];

const CDN_ASSETS = [
  'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js',
  'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',
  'https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.8.0/firebase-database-compat.js'
];

// Máy chủ bên ngoài được phép lưu đệm (thư viện có phiên bản cố định và phông chữ)
const CDN_HOSTS = ['cdnjs.cloudflare.com', 'cdn.jsdelivr.net', 'fonts.googleapis.com', 'fonts.gstatic.com'];

// Thư mục/tệp của ứng dụng được lưu đệm (tránh lưu PDF SGK 7MB và tệp tài liệu)
const APP_PATH_PATTERN = /\/(index\.html|manifest\.webmanifest|sw\.js|css\/[^/]+\.css|js\/[^/]+\.js|icons\/[^/]+\.png)$/;

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const appCache = await caches.open(APP_CACHE);
    // cache: 'reload' để không lấy nhầm bản cũ trong bộ nhớ đệm HTTP của trình duyệt
    await appCache.addAll(APP_SHELL.map(url => new Request(url, { cache: 'reload' })));
    const cdnCache = await caches.open(CDN_CACHE);
    // Thư viện CDN: lỗi mạng 1 tệp không được làm hỏng cả lần cài đặt
    await Promise.allSettled(CDN_ASSETS.map(url => cdnCache.add(new Request(url, { mode: 'cors' }))));
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keep = new Set([APP_CACHE, CDN_CACHE]);
    const names = await caches.keys();
    await Promise.all(names.filter(n => n.startsWith('teenvoca-') && !keep.has(n)).map(n => caches.delete(n)));
    await self.clients.claim();
  })());
});

// Trang hỏi có muốn cập nhật bản mới ngay không (người dùng bấm "Cập nhật")
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

function timeout(ms) {
  return new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms));
}

async function networkFirst(request, cacheKey) {
  const cache = await caches.open(APP_CACHE);
  try {
    const response = await Promise.race([fetch(request), timeout(NETWORK_TIMEOUT_MS)]);
    if (response && response.ok) {
      cache.put(cacheKey || request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await cache.match(cacheKey || request, { ignoreSearch: true });
    if (cached) return cached;
    throw err;
  }
}

async function staleWhileRevalidate(event) {
  const { request } = event;
  const cache = await caches.open(CDN_CACHE);
  const cached = await cache.match(request);
  const refresh = fetch(request).then((response) => {
    if (response && (response.ok || response.type === 'opaque')) {
      cache.put(request, response.clone());
    }
    return response;
  });
  if (cached) {
    // Cập nhật ngầm, không bắt trang phải chờ
    event.waitUntil(refresh.catch(() => undefined));
    return cached;
  }
  return refresh;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Mở trang (kể cả từ biểu tượng trên màn hình chính, có ?tab=...): luôn trả về index.html
  if (request.mode === 'navigate' && url.origin === self.location.origin) {
    event.respondWith((async () => {
      try {
        return await networkFirst(request, './index.html');
      } catch {
        const cache = await caches.open(APP_CACHE);
        return (await cache.match('./index.html')) || (await cache.match('./')) || Response.error();
      }
    })());
    return;
  }

  if (url.origin === self.location.origin) {
    if (APP_PATH_PATTERN.test(url.pathname)) {
      event.respondWith(networkFirst(request));
    }
    return;
  }

  const isFirebaseSdk = url.hostname === 'www.gstatic.com' && url.pathname.startsWith('/firebasejs/');
  if (isFirebaseSdk || CDN_HOSTS.includes(url.hostname)) {
    event.respondWith(staleWhileRevalidate(event));
  }
  // Còn lại (Firebase Realtime Database, Gemini API, Emulator...) đi thẳng ra mạng
});
