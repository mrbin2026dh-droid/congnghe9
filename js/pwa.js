/**
 * TeenVoca AI – Cài đặt ứng dụng (PWA)
 *  - Đăng kí service worker (sw.js) để mở được app khi offline
 *  - Nút "📲 Cài ứng dụng": Android/Windows/macOS (Chrome, Edge) dùng hộp thoại cài đặt của trình duyệt;
 *    iPhone/iPad (Safari) hiện hướng dẫn "Thêm vào MH chính" vì iOS không có hộp thoại tự động
 *  - Báo khi có phiên bản mới và khi mất/có mạng
 */
'use strict';

(() => {
  let deferredPrompt = null;

  const isStandalone = () =>
    (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;

  const isIos = () => {
    const ua = window.navigator.userAgent || '';
    return /iphone|ipad|ipod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  };

  const toast = (msg, type) => {
    if (window.app && typeof window.app.showToastNotification === 'function') {
      window.app.showToastNotification(msg, type);
    }
  };

  // Nút cài đặt ở thanh trên cùng và trong hộp đăng nhập (người chưa đăng nhập cũng cài được)
  function installButtons() {
    return Array.from(document.querySelectorAll('[data-pwa-install]'));
  }

  function refreshInstallButton() {
    // Đã cài (đang chạy như ứng dụng) thì ẩn nút
    const show = !isStandalone() && Boolean(deferredPrompt || isIos());
    installButtons().forEach((btn) => { btn.hidden = !show; });
  }

  function openIosGuide() {
    const dlg = document.getElementById('pwa-ios-guide');
    if (!dlg) return;
    if (typeof dlg.showModal === 'function') dlg.showModal();
    else dlg.setAttribute('open', '');
  }

  async function onInstallClick() {
    if (deferredPrompt) {
      const promptEvent = deferredPrompt;
      deferredPrompt = null;
      promptEvent.prompt();
      try {
        const choice = await promptEvent.userChoice;
        if (choice && choice.outcome === 'accepted') toast('📲 Đang cài TeenVoca AI lên thiết bị của em...');
      } catch { /* người dùng đóng hộp thoại */ }
      refreshInstallButton();
      return;
    }
    if (isIos()) openIosGuide();
  }

  // Chỉ tải lại trang khi chính người dùng bấm "Cập nhật ngay"
  // (lần cài đầu, service worker cũng nhận quyền điều khiển trang nhưng không cần tải lại)
  let updateRequested = false;

  // Có service worker mới đang chờ -> mời người dùng cập nhật (không tự tải lại giữa chừng)
  function offerUpdate(worker) {
    const bar = document.getElementById('pwa-update-bar');
    const btn = document.getElementById('btn-pwa-update');
    if (!bar || !btn) return;
    bar.hidden = false;
    btn.onclick = () => {
      btn.disabled = true;
      updateRequested = true;
      // Ghi ngay tiến độ đang chờ đồng bộ trước khi tải lại
      if (window.app && typeof window.app.flushProgressSync === 'function') window.app.flushProgressSync();
      worker.postMessage({ type: 'SKIP_WAITING' });
    };
  }

  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    // Service worker chỉ chạy trên https hoặc localhost
    if (!(location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) return;

    let reloading = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloading || !updateRequested) return;
      reloading = true;
      window.location.reload();
    });

    navigator.serviceWorker.register('./sw.js', { scope: './' }).then((reg) => {
      if (reg.waiting && navigator.serviceWorker.controller) offerUpdate(reg.waiting);
      reg.addEventListener('updatefound', () => {
        const worker = reg.installing;
        if (!worker) return;
        worker.addEventListener('statechange', () => {
          // Chỉ báo "bản mới" khi trang đang được 1 service worker cũ điều khiển (không phải lần cài đầu)
          if (worker.state === 'installed' && navigator.serviceWorker.controller) offerUpdate(worker);
        });
      });
      // Kiểm tra bản mới mỗi khi học sinh quay lại ứng dụng
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') reg.update().catch(() => undefined);
      });
    }).catch((err) => console.warn('Không đăng kí được service worker:', err));
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    refreshInstallButton();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    refreshInstallButton();
    toast('🎉 Đã cài TeenVoca AI! Em có thể mở ứng dụng từ màn hình chính.');
  });

  // Huy hiệu "📴 Offline" luôn hiện trên thanh trên cùng khi mất mạng
  function refreshNetworkBadge() {
    const badge = document.getElementById('network-status-badge');
    if (badge) badge.hidden = navigator.onLine !== false;
  }

  // Xin trình duyệt lưu trữ BỀN VỮNG: không tự xóa dữ liệu offline (tài khoản, bài làm dở) khi máy thiếu dung lượng
  let persistRequested = false;
  async function requestPersistentStorage() {
    if (persistRequested || !(navigator.storage && navigator.storage.persist)) return false;
    persistRequested = true;
    try {
      if (await navigator.storage.persisted()) return true;
      return await navigator.storage.persist();
    } catch {
      return false;
    }
  }

  window.addEventListener('offline', () => {
    refreshNetworkBadge();
    toast('📴 Mất kết nối mạng. Em vẫn dùng app bình thường; tiến độ được lưu trên máy và tự đồng bộ khi có mạng.', 'error');
  });
  window.addEventListener('online', () => {
    refreshNetworkBadge();
    toast('📶 Đã có mạng trở lại – đang đồng bộ dữ liệu.');
  });

  window.addEventListener('DOMContentLoaded', () => {
    installButtons().forEach((btn) => btn.addEventListener('click', onInstallClick));
    const closeGuide = document.getElementById('btn-close-ios-guide');
    if (closeGuide) {
      closeGuide.addEventListener('click', () => {
        const dlg = document.getElementById('pwa-ios-guide');
        if (dlg && typeof dlg.close === 'function') dlg.close();
        else if (dlg) dlg.removeAttribute('open');
      });
    }
    refreshInstallButton();
    refreshNetworkBadge();
    registerServiceWorker();
    // Ứng dụng đã cài hoặc đã có người đăng nhập trên máy: xin lưu trữ bền vững ngay
    if (isStandalone() || localStorage.getItem('teenvoca_current_user')) requestPersistentStorage();
  });

  window.addEventListener('appinstalled', () => { requestPersistentStorage(); });

  window.TeenVocaPWA = { isStandalone, isIos, refreshInstallButton, requestPersistentStorage };
})();
