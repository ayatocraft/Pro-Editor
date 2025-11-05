// sw.js
const CACHE_NAME = 'code-editor-shell-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/offline.html',
  // ここに静的アセット（CSS/JS/アイコン等）を列挙
  // 例: '/icons/icon-192.png', '/icons/icon-512.png'
];

// インストール: アプリシェルをキャッシュ
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// アクティベート: 古いキャッシュのクリーンアップ
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map((key) => {
        if (key !== CACHE_NAME) return caches.delete(key);
      })
    ))
  );
  self.clients.claim();
});

// フェッチ: ネットワーク優先で失敗時はキャッシュ、ナビゲーションはフォールバックを返す
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // same-origin の navigation（ページ移動）なら、ネットワーク → キャッシュ → offline.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then((resp) => {
        // 成功したらキャッシュ更新（任意）
        return resp;
      }).catch(() => {
        return caches.match(request).then((cached) => cached || caches.match('/offline.html'));
      })
    );
    return;
  }

  // 静的アセットはキャッシュ優先
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((resp) => {
        // 取得したものをランタイムキャッシュする（任意）
        return caches.open(CACHE_NAME).then((cache) => {
          // キャッシュに入れられるレスポンスか確認
          if (request.method === 'GET' && resp && resp.status === 200 && resp.type !== 'opaque') {
            try { cache.put(request, resp.clone()); } catch (e) { /* 一部環境で失敗することがある */ }
          }
          return resp;
        }).catch(() => resp);
      }).catch(() => {
        // ネットワークもキャッシュもない場合は fallback（アイコン等が必要なら追加の処理）
        return caches.match('/offline.html');
      });
    })
  );
});
